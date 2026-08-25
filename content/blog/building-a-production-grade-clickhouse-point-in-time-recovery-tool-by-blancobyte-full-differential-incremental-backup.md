---
title: Building a Production-Grade ClickHouse Point-in-Time Recovery Tool by BlancoByte (Full, Differential & Incremental Backup)
description: This is the most important concept to understand before using the tool. There are three types of backups and they behave very differently.
date: '2026-03-31'
author: Can Sayin
tags:
- clickhouse
image: /blog-images/2026-03-A92B0191-F90F-4081-BAEB-37F86EE82C6A_1_105_c.jpeg
---

## Introduction

Data loss is not a question of *if* — it is a question of *when*. A misconfigured migration deletes a production table. A bad deployment corrupts rows. A developer runs a DELETE on the wrong server. When these moments happen, your only lifeline is a reliable backup and recovery system.

ClickHouse is one of the fastest analytical databases in the world, but it does not ship with a ready-made Point-in-Time Recovery workflow out of the box. In this post we walk through `clickhouse_pitr`, a Python tool we built at BlancoByte that handles the entire lifecycle: taking full, differential, and incremental backups, cataloging every operation, and restoring your data to any point in time with a single command — without ever deleting a single row from your original table.

All examples in this post were tested on a live ClickHouse 26.3 cluster.

## What is Point-in-Time Recovery?

Point-in-Time Recovery means being able to say: *“Give me my table exactly as it was at 14:30 yesterday”* — and getting it back cleanly.

ClickHouse does not expose WAL-level continuous recovery like PostgreSQL. Starting from version 22.7 it introduced a native BACKUP and RESTORE command engine, and from version 23.x it added differential and incremental backup support. Our tool builds on top of these native commands.

The recovery granularity equals your backup frequency. If you take a differential every hour, you can recover to any full hour.

---

#### Requirements

Python 3.10 or higher. ClickHouse 22.7+ for full backups. ClickHouse 23.x+ for differential and incremental backups.

```sql
pip install clickhouse-connect rich
pip install boto3                    # S3 or MinIO
pip install google-cloud-storage     # GCS
pip install azure-storage-blob       # Azure
```

---

```sql
root@clickhouse1:~# python3.10 clickhouse_pitr_v2.py --help
usage: clickhouse_pitr [-h] [-v] [--version] COMMAND ...

ClickHouse Point-in-Time Recovery Tool  v2.0.0

BACKUP TYPES:
  full           Complete snapshot
  differential   Changes since latest FULL backup
                 Restore needs: full + this differential only
  incremental    Changes since latest backup of ANY type
                 Restore needs: full + all incrementals in chain

RESTORE METHODS:
  restore (default)  RESTORE TABLE ... AS temp + EXCEPT INSERT
                     Works with all storage backends
  attach (optinal)  ATTACH PART with dependency resolution
                         Local storage only

STORAGE BACKENDS:
  local   Local disk or NFS
  s3      AWS S3, MinIO, Ceph RGW
  gcs     Google Cloud Storage
  azure   Azure Blob Storage

positional arguments:
  COMMAND
    backup       Take a full, differential, or incremental backup
    restore      Restore a backup
    list         List all backups
    info         Show full details of one backup
    verify       Verify backup integrity
    prune        Delete old backups
    chain        Show backup chain
    schedule     Generate a crontab line
    config       Show current effective configuration

options:
  -h, --help     show this help message and exit
  -v, --verbose  Enable DEBUG logging
  --version      show program's version number and exit
```

---

## ClickHouse Server Configuration

Before taking any backup, ClickHouse must know which directories it is allowed to write to:

```sql
/etc/clickhouse-server/config.d/backup.xml

<clickhouse>
    <backups>
        <allowed_path>/var/lib/clickhouse/backups</allowed_path>
    </backups>
</clickhouse>
```

Create the directory and restart:

```sql
sudo mkdir -p /var/lib/clickhouse/backups
sudo chown clickhouse:clickhouse /var/lib/clickhouse/backups
sudo chmod 750 /var/lib/clickhouse/backups
sudo systemctl restart clickhouse-server
```

## Three Backup Types

This is the most important concept to understand before using the tool. There are three types of backups and they behave very differently.

### Full Backup

A complete snapshot of the table. Every row, every part, everything. This is always the starting point before any differential or incremental.

**Full backup: 281.9 MB (entire table)**

---

### Differential Backup

Captures \*\*all changes since the latest full backup\*\*. The base is always the most recent full backup. Each differential is independent of the others.

```text
08:00  Full           →  281.9 MB  (entire table)
09:00  Differential   →  12 KB     (changes since 08:00 full)
10:00  Differential   →  20 KB     (changes since 08:00 full, cumulative)
11:00  Differential   →  35 KB     (changes since 08:00 full, cumulative)
```

Notice that each differential grows slightly because it accumulates all changes since the full. To restore the 11:00 state you only need the full and the 11:00 differential. You do not need the 09:00 or 10:00 differentials at all. Simple and reliable.

---

### Incremental Backup

Captures \*\*only the changes since the previous backup\*\* of any type. Each incremental uses the most recent backup as its base, whether that was a full or another incremental.

```text
08:00  Full            →  281.9 MB  (entire table)
09:00  Incremental 1   →  12 KB     (changes from 08:00 to 09:00 only)
10:00  Incremental 2   →  8 KB      (changes from 09:00 to 10:00 only)
11:00  Incremental 3   →  5 KB      (changes from 10:00 to 11:00 only)
```

---

Each backup is very small because it only stores new data since the previous backup. To restore the 11:00 state you need Full + Incremental 1 + Incremental 2 + Incremental 3. The chain grows over time.

### Comparison

|  | Full | Differential | Incremental |
| --- | --- | --- | --- |
| Backup size | Large | Medium, grows over time | Small, stays small |
| Restore complexity | Simple | Simple (full + 1 backup) | Complex (full + entire chain) |
| Restore speed | Fast | Fast | Slower (more steps) |
| If one backup is lost | Independent | Independent | Chain is broken |
| Recommended for | Weekly baseline | Hourly/daily changes | High-frequency changes |

## Storage Backends

The tool supports four storage backends.

**Local disk** — fastest, simplest, suitable for NFS mounts:

```sql
--storage local --backup-dir /var/lib/clickhouse/backups
```

**AWS S3:**

```text
--storage s3 --s3-bucket prod-backups --s3-region eu-west-1 \
--s3-access-key AKIAIOSFODNN7EXAMPLE --s3-secret-key wJalrXUtnFEMI...
```

**MinIO** — requires custom endpoint and path-style addressing:

```text
--storage s3 --s3-bucket mybackups \
--s3-endpoint http://minio.internal:9000 \
--s3-access-key minioadmin --s3-secret-key minioadmin \
--s3-path-style
```

**Azure Blob Storage:**

```text
--storage azure --azure-account mystorageaccount \
--azure-container ch-backups --azure-sas-token "?sv=2023-01-03&..."
```

## Taking Backups

### Full Backup

```sql
python3.10 clickhouse_pitr_v2.py backup \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --tables uk.uk_price_paid
 

Output:

----------------------------------------------------------------------
  Backup ID    : backup_20260331_080000
  Type         : FULL
  Tables       : uk.uk_price_paid
  Storage      : local -> /var/lib/clickhouse/backups
  ClickHouse   : 26.3.2.3
  Compression  : LZ4
----------------------------------------------------------------------
  Collecting table stats...
  Running BACKUP command...
  Size         : 281.9 MB
  Duration     : 47s
  Status       : OK
----------------------------------------------------------------------
  Verifying backup_20260331_080000...
    uk.uk_price_paid: 31,092,167 rows  OK
  Verification passed
```

### Differential Backup

Always run after a full backup. Uses `--flush-before-backup` to force ClickHouse to complete any background merges before the backup runs. Without this, new rows may be merged into existing parts and the differential would appear empty.

```sql
python3.10 clickhouse_pitr_v2.py backup \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --tables uk.uk_price_paid \
    --differential --flush-before-backup
 
Output:
 
  Auto-selected base: backup_20260331_080000  [full]
  --flush-before-backup: forcing final merge on all tables...
  Flushing and optimizing uk.uk_price_paid (this may take a moment)...
  Flush and optimize complete.
----------------------------------------------------------------------
  Backup ID    : backup_20260331_090000
  Type         : DIFFERENTIAL  (base: backup_20260331_080000)
  Flush first  : yes (OPTIMIZE FINAL ran before backup)
----------------------------------------------------------------------
  Size         : 12 KB
  Duration     : 3s
  Status       : OK
```

### Incremental Backup

Each incremental uses the most recent backup of any type as its base.

```sql
python3.10 clickhouse_pitr_v2.py backup \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --tables uk.uk_price_paid \
    --incremental --flush-before-backup
 

Output (second incremental, base is the first incremental):
 
  Auto-selected base: backup_20260331_090000  [incremental]
----------------------------------------------------------------------
  Backup ID    : backup_20260331_100000
  Type         : INCREMENTAL  (base: backup_20260331_090000)
----------------------------------------------------------------------
  Size         : 8 KB
  Duration     : 2s
  Status       : OK
```

### Back up an entire database

```sql
python3.10 clickhouse_pitr_v2.py backup \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --database uk
```

## How Restore Works

We started by manually copying parts from the backup directory into the table’s `detached/` folder and running `ALTER TABLE ... ATTACH PART`. This works perfectly for full backups. For differential and incremental backups it fails completely. The reason is that parts in a differential or incremental backup reference dictionary files such as `county.dict.bin` and `town.dict.bin` that are stored in the base full backup, not in the differential itself. Copying only the differential part gives ClickHouse an incomplete set of files and you get `FILE_DOESNT_EXIST` errors at attach time.

### Method 1: RESTORE TABLE … AS (Default)

The primary restore method uses ClickHouse’s own native RESTORE command with an alias. ClickHouse follows the full→differential or full→incremental chain internally, resolves all file references correctly, and assembles the complete table into a fresh temporary table. No missing files, no manual copying, no version-specific workarounds. After the restore into the temp table, the tool waits for all pending DELETE and UPDATE mutations to finish before proceeding. Without this step, EXCEPT would see deleted rows as still present and incorrectly skip them. Then it runs INSERT INTO original SELECT FROM temp EXCEPT SELECT FROM original, which inserts only the rows that do not already exist in the original table, guaranteeing zero duplicates. Finally the temp table is dropped. This method works with all storage backends including local disk, S3, MinIO, GCS, and Azure.

### Method 2: ATTACH PART with Dependency Resolution

We also implemented the ATTACH PART approach correctly. Instead of failing when dictionary files are missing, the tool reads `checksums.txt` inside each part to get the full list of required files, copies all files present in the differential or incremental part, and for any missing files searches all backups in the chain and copies them from the full backup automatically. It also generates `columns.txt` automatically when it is missing, which is necessary because ClickHouse 26.x uses `columns_substreams.txt` instead of `columns.txt` and ATTACH PART still requires the older format. After attach, the same temp table and INSERT EXCEPT pattern is used to prevent duplicates. This method only works with local storage and is marked experimental.

### What Both Methods Guarantee

Regardless of which method is used, the original table never has rows deleted from it at any point during the restore. Only new rows are added. The INSERT EXCEPT logic prevents any duplicate rows regardless of what the backup contains, and pending DELETE and UPDATE mutations are always waited on before the comparison runs so that accidentally deleted rows are never re-inserted.

```sql
The full restore flow:
 
Step 1:  RESTORE TABLE original AS temp FROM backup
         ClickHouse follows the chain internally.
         No missing files. No manual work.

Step 2:  Wait for all pending DELETE/UPDATE mutations to finish.
         Without this, EXCEPT would see deleted rows as still present.

Step 3:  INSERT INTO original              <-- THIS IS WHERE INSERT HAPPENS
         SELECT * FROM temp
         EXCEPT SELECT * FROM original
         Only rows not already in original are inserted.
         Zero duplicates guaranteed.

Step 4:  DROP TABLE temp
```

The original table never has rows deleted. The tool only adds rows.

---

## A Complete PITR Scenario

#### **Step 1 — Full backup:**

```sql
python3.10 clickhouse_pitr_v2.py backup \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --tables uk.uk_price_paid
```

#### **Step 2 — Insert a rows:**

```sql
clickhouse-client --password default --query "
INSERT INTO uk.uk_price_paid VALUES (
    1111111111, '2023-06-15', 'SW1A', '1AA',
    'terraced', 0, 'freehold', '10', '',
    'DOWNING STREET', 'WESTMINSTER', 'TEST',
    'CITY OF WESTMINSTER', 'GREATER LONDON'
)"

clickhouse-client --password default --query "
INSERT INTO uk.uk_price_paid VALUES (
    22222222222, '2023-06-15', 'SW1A', '1AA',
    'terraced', 0, 'freehold', '10', '',
    'DOWNING STREET', 'WESTMINSTER', 'TEST',
    'CITY OF WESTMINSTER', 'GREATER LONDON'
)"

clickhouse-client --password default --query "
INSERT INTO uk.uk_price_paid VALUES (
    3333333333, '2023-06-15', 'SW1A', '1AA',
    'terraced', 0, 'freehold', '10', '',
    'DOWNING STREET', 'WESTMINSTER', 'TEST',
    'CITY OF WESTMINSTER', 'GREATER LONDON'
)"

clickhouse-client --password default --query "
INSERT INTO uk.uk_price_paid VALUES (
    44444444444, '2023-06-15', 'SW1A', '1AA',
    'terraced', 0, 'freehold', '10', '',
    'DOWNING STREET', 'WESTMINSTER', 'TEST',
    'CITY OF WESTMINSTER', 'GREATER LONDON'
)"

....
...
..
.
```

Verify it exists:

```sql
clickhouse-client --password default --query \
    "SELECT * FROM uk.uk_price_paid WHERE price = 1111111111"
 
1111111111   2023-06-15   SW1A   1AA   terraced   0   freehold
DOWNING STREET   WESTMINSTER   TEST   CITY OF WESTMINSTER   GREATER LONDON
```

#### **Step 3 — Take a differential backup after the insert:**

```sql
python3.10 clickhouse_pitr_v2.py backup \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --tables uk.uk_price_paid \
    --differential --flush-before-backup
 

  Auto-selected base: backup_20260331_103109  [full]
  Flush and optimize complete.
----------------------------------------------------------------------
  Backup ID    : backup_20260331_103138
  Type         : DIFFERENTIAL  (base: backup_20260331_103109)
  Size         : 26.6 KB
----------------------------------------------------------------------
  Verification passed
```

#### **Step 4 — Delete the row (the accident):**

```sql
clickhouse-client --password default --query \
    "DELETE FROM uk.uk_price_paid WHERE price = 1111111111"

clickhouse-client --password default --query "
SELECT * FROM system.mutations
WHERE database='uk' AND table='uk_price_paid' AND is_done=0"
```

#### **Step 5 — List backups to confirm IDs:**

```text
python3.10 clickhouse_pitr_v2.py list

Backup ID                   Timestamp (UTC)       Type           Size
----------------------------------------------------------------------
backup_20260331_103138      2026-03-31T10:31:38   differential   26.6 KB
backup_20260331_103109      2026-03-31T10:31:09   full           281.9 MB
```

#### **Step 6 — Dry run to see the plan:**

```sql
python3.10 clickhouse_pitr_v2.py restore \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --backup-id backup_20260331_103138 \
    --dry-run

----------------------------------------------------------------------
  PITR RESTORE
  Method       : RESTORE TABLE ... AS temp  +  EXCEPT INSERT
  Backup ID    : backup_20260331_103138
  Type         : DIFFERENTIAL
  Timestamp    : 2026-03-31T10:31:38 UTC
  Chain        :
    [FULL  ] backup_20260331_103109  2026-03-31T10:31:09  281.9 MB
    [DIFFER] backup_20260331_103138  2026-03-31T10:31:38  26.6 KB  <- restoring this
----------------------------------------------------------------------
  [DRY RUN] uk.uk_price_paid
    Original rows : 31,092,167
    Mode          : restore to temp -> EXCEPT INSERT -> original
  [DRY RUN] No restore performed.
```

#### **Step 7 — Real restore:**

```sql
python3.10 clickhouse_pitr_v2.py restore \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --backup-id backup_20260331_103138

----------------------------------------------------------------------
  PITR RESTORE
  Method       : RESTORE TABLE ... AS temp  +  EXCEPT INSERT
  Chain        :
    [FULL  ] backup_20260331_103109  281.9 MB
    [DIFFER] backup_20260331_103138  26.6 KB  <- restoring this
----------------------------------------------------------------------

  Table: uk.uk_price_paid
  Step 1/4  RESTORE uk.uk_price_paid AS uk.uk_price_paid_pitr_20260331...
  Restored in 52s
  Temp table has 31,092,167 rows
  Step 2/4  Waiting for pending mutations...
  All mutations complete.
  Step 3/4  INSERT INTO uk.uk_price_paid SELECT * FROM temp
            EXCEPT SELECT * FROM uk.uk_price_paid ...
  Rows before   : 31,092,167
  Rows added    : 4
  Rows after    : 31,092,171
  Step 4/4  Dropping temp table...
  Temp table dropped
----------------------------------------------------------------------
  Restore complete.
```

#### **Step 8 — Verify the row is back:**

```sql
clickhouse-client --password default --query \
    "SELECT * FROM uk.uk_price_paid WHERE price = 1111111111"
  
  

1111111111   2023-06-15   SW1A   1AA   terraced   0   freehold
DOWNING STREET   WESTMINSTER   TEST   CITY OF WESTMINSTER   GREATER LONDON

....
...
..
.
```

The row is back. The rest of the table is completely untouched.

## Restore by Point in Time

You can also restore without knowing the backup ID, just by specifying a UTC timestamp. The tool finds the best backup on or before that time:

```sql
python3.10 clickhouse_pitr_v2.py restore \
    --host localhost --port 8123 \
    --username default --password default \
    --storage local --backup-dir /var/lib/clickhouse/backups \
    --target-time "2026-03-31 10:31:38"
```

## Listing and Inspecting Backups

List all backups:

```text
python3.10 clickhouse_pitr_v2.py list

Backup ID                   Timestamp (UTC)       Type           Backend  Status      Size
--------------------------------------------------------------     ----------------------------
backup_20260331_110000      2026-03-31T11:00:00   incremental    local    verified    5 KB
backup_20260331_100000      2026-03-31T10:00:00   incremental    local    verified    8 KB
backup_20260331_090000      2026-03-31T09:00:00   differential   local    verified    12 KB
backup_20260331_080000      2026-03-31T08:00:00   full           local    verified    281.9 MB
```

Show full details of one backup including per-table row counts:

```text
python3.10 clickhouse_pitr_v2.py info --backup-id backup_20260331_103138
python3.10 clickhouse_pitr_v2.py chain --backup-id backup_20260331_110000

  Backup chain  (4 step(s))
  [FULL         ]  backup_20260331_080000   08:00  281.9 MB
  [INCREMENTAL 1]  backup_20260331_090000   09:00  12 KB
  [INCREMENTAL 2]  backup_20260331_100000   10:00  8 KB
  [INCREMENTAL 3]  backup_20260331_110000   11:00  5 KB
  -> RESTORING FROM: backup_20260331_110000
```

## Cleaning Up Old Backups

```text
python3.10 clickhouse_pitr_v2.py prune --keep-days 30 --dry-run
python3.10 clickhouse_pitr_v2.py prune --keep-days 30
```

Keep only the 10 most recent:

```text
python3.10 clickhouse_pitr_v2.py prune --keep-count 10
```

## Recommended Production Schedule

```text
# Weekly full backup - Sunday at 02:00
0 2 * * 0   python3.10 /opt/clickhouse_pitr_v2.py backup \
    --storage s3 --s3-bucket prod-backups --all-tables \
    --tag weekly >> /var/log/ch_pitr.log 2>&1

# Hourly differential - every hour except Sunday 02:00
0 * * * 1-6  python3.10 /opt/clickhouse_pitr_v2.py backup \
    --storage s3 --s3-bucket prod-backups --all-tables \
    --differential --flush-before-backup \
    --tag hourly >> /var/log/ch_pitr.log 2>&1

# Prune backups older than 14 days - Sunday at 03:00
0 3 * * 0   python3.10 /opt/clickhouse_pitr_v2.py prune \
    --keep-days 14 >> /var/log/ch_pitr.log 2>&1
```

This gives you a recovery window of 1 hour at any point in the last 14 days, with a simple restore that only needs the weekly full and the most recent hourly differential.

---

## Environment Variables

Set once, use everywhere:

```sql
export CH_HOST=db.internal.blancobytecloud.com
export CH_PORT=8123
export CH_USER=backup_user
export CH_PASSWORD=supersecret
export CH_STORAGE=s3
export S3_BUCKET=prod-clickhouse-backups
export S3_REGION=eu-west-1
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI...
```

Then every command becomes:

```text
python3.10 clickhouse_pitr_v2.py backup --all-tables --differential --flush-before-backup
python3.10 clickhouse_pitr_v2.py list
python3.10 clickhouse_pitr_v2.py restore --target-time "2026-03-31 10:31:38"
```

---

## Important Limitations

**PITR granularity equals backup frequency.** Hourly differentials give you hourly recovery points. There is no sub-minute recovery without more frequent backups.

**ClickHouse version requirements.** BACKUP command requires 22.7+. Differential and incremental backups require 23.x+.

**`--flush-before-backup` is required for reliable differential and incremental backups.** ClickHouse merges parts in the background. Without flushing first, a background merge running between INSERT and backup can cause the differential or incremental to appear empty. The flush runs `OPTIMIZE TABLE FINAL` which completes any in-progress merges before the backup runs. It does not lock the table.

**The tool only adds rows, never deletes.** Restore operations insert only rows missing from the original table using `INSERT EXCEPT`. No existing data is ever removed during a restore.

**The catalog is local.** The `catalog.json` file lives on the machine running the tool. For multi-machine setups, share it via NFS or a mounted volume.

---

## Conclusion

ClickHouse is built for speed at scale, but production-grade data safety requires more than fast queries. The tool we built at BlancoByte gives our teams a complete backup lifecycle with three backup strategies to choose from depending on your recovery requirements and storage budget:

- - **Full backup** as the weekly baseline

- - **Differential backup** for simple hourly or daily recovery points

- - **Incremental backup** for high-frequency backups with minimal disk usage

The restore path is always the same regardless of backup type: ClickHouse resolves the chain internally, we INSERT only the missing rows with EXCEPT, and the original table is never touched beyond receiving new rows.

One file. One catalog. Complete recovery.

---

If you have questions or want to adapt this for your own infrastructure, reach out to the BlancoByte engineering team -> **support@blancobyte.com**

---

```sql
usage: clickhouse_pitr_v2.py backup [options]

Take a backup.
ClickHouse 22.7+ for full backups, 23.x+ for differential/incremental.

BACKUP TYPE (choose one, default: full):
  --differential        Captures all changes since the latest FULL backup.
                        Base is always the latest full backup.
                        Chain: Full -> Diff(base:Full) -> Diff(base:Full)
                        Restore needs: full + this differential only.
                        Recommended for most production use cases.

  --incremental         Captures changes since the latest backup of ANY type.
                        Base is the most recent backup (full or incremental).
                        Chain: Full -> Incr1(base:Full) -> Incr2(base:Incr1)
                        Restore needs: full + all incrementals in chain.
                        Smaller backups, but restore chain grows over time.

  --base-backup-id ID   Override the auto-detected base backup ID.
                        Use this to manually specify which backup to use as base.

  --flush-before-backup
                        Run OPTIMIZE TABLE FINAL before taking the backup.
                        Ensures all recent INSERTs are captured by forcing
                        ClickHouse to complete any background merges first.
                        Without this, new rows may be merged into existing
                        parts and the differential/incremental may appear empty.
                        Strongly recommended for differential and incremental.

TABLE SELECTION (choose one):
  --all-tables          Back up all non-system tables across all databases.
  --database DB         Back up all tables in the specified database.
  --tables DB.T1 DB.T2  Back up specific tables only.

CLICKHOUSE CONNECTION:
  --host HOST           ClickHouse host  (default: localhost / CH_HOST)
  --port PORT           HTTP port        (default: 8123 / CH_PORT)
  --username USER       Username         (default: default / CH_USER)
  --password PASS       Password         (CH_PASSWORD)

STORAGE BACKEND:
  --storage BACKEND     local | s3 | gcs | azure  (default: local / CH_STORAGE)
  --backup-dir DIR      Local backup directory     (CH_BACKUP_DIR)
  --catalog-file FILE   Catalog JSON file          (CH_CATALOG_FILE)

S3 / MINIO / CEPH:
  --s3-bucket BUCKET    Bucket name        (S3_BUCKET)
  --s3-prefix PREFIX    Key prefix         (S3_PREFIX)
  --s3-region REGION    AWS region         (S3_REGION)
  --s3-endpoint URL     Custom endpoint for MinIO or Ceph (S3_ENDPOINT)
  --s3-access-key KEY   Access key         (AWS_ACCESS_KEY_ID)
  --s3-secret-key SEC   Secret key         (AWS_SECRET_ACCESS_KEY)
  --s3-path-style       Use path-style addressing. Required for MinIO.

GOOGLE CLOUD STORAGE:
  --gcs-bucket BUCKET   GCS bucket name    (GCS_BUCKET)
  --gcs-credentials F   Service account JSON file (GCS_CREDENTIALS)

AZURE BLOB STORAGE:
  --azure-account ACC   Storage account name  (AZURE_ACCOUNT)
  --azure-container C   Container name        (AZURE_CONTAINER)
  --azure-sas-token T   SAS token             (AZURE_SAS_TOKEN)
  --azure-conn-str S    Connection string     (AZURE_CONNECTION_STRING)

BACKUP OPTIONS:
  --tag TAG             Append a tag to the backup ID  (e.g. nightly, weekly)
  --note TEXT           Free-text note stored in the catalog
  --no-compress         Disable LZ4 compression
  --no-verify           Skip post-backup row count verification
  --max-retries N       Number of retries on failure  (default: 3)
  --parallel-threads N  Number of parallel backup threads  (default: 4)

EXAMPLES:
  # Full backup to local disk
  python3 clickhouse_pitr_v2.py backup \
      --host localhost --port 8123 \
      --username default --password default \
      --storage local --backup-dir /var/lib/clickhouse/backups \
      --tables uk.uk_price_paid

  # Differential backup (base: latest full)
  python3 clickhouse_pitr_v2.py backup \
      --host localhost --port 8123 \
      --username default --password default \
      --storage local --backup-dir /var/lib/clickhouse/backups \
      --tables uk.uk_price_paid --differential --flush-before-backup

  # Incremental backup (base: latest backup of any type)
  python3 clickhouse_pitr_v2.py backup \
      --host localhost --port 8123 \
      --username default --password default \
      --storage local --backup-dir /var/lib/clickhouse/backups \
      --tables uk.uk_price_paid --incremental --flush-before-backup

  # Back up entire database
  python3 clickhouse_pitr_v2.py backup \
      --host localhost --port 8123 \
      --username default --password default \
      --storage local --backup-dir /var/lib/clickhouse/backups \
      --database uk --differential --flush-before-backup

  # S3 backup
  python3 clickhouse_pitr_v2.py backup \
      --host localhost --port 8123 \
      --username default --password default \
      --storage s3 --s3-bucket my-bucket --s3-region eu-west-1 \
      --s3-access-key AKIA... --s3-secret-key ... \
      --tables uk.uk_price_paid

  # MinIO backup
  python3 clickhouse_pitr_v2.py backup \
      --host localhost --port 8123 \
      --username default --password default \
      --storage s3 --s3-bucket backups \
      --s3-endpoint http://minio:9000 \
      --s3-access-key minioadmin --s3-secret-key minioadmin \
      --s3-path-style --tables uk.uk_price_paid
```

---

**Contact Us: support@blancobyte.com**

---
