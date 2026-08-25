---
title: BlancoByte Builds a ClickHouse Profiler That Runs Anywhere
description: The tool reads the ClickHouse server log file line-by-line, extracts every executed query along with its execution time, rows read, bytes read, and peak memory usage, then groups structurally identical queries together and ranks them by the metric you care about most.
date: '2026-04-17'
author: Can Sayin
tags:
- clickhouse
image: /blog-images/2026-04-timthumb.jpeg
---

We built a CLI tool that reads raw ClickHouse server logs and turns them into actionable query performance reports — with no agents, no extra infrastructure, and zero runtime overhead.

At BlancoByte we run ClickHouse at the core of our analytics pipeline. As the dataset grew, so did the number of queries — and with them, the number of questions: *Which query is reading the most data? Which one runs a hundred times per minute? Why did memory spike at 3 a.m.?*

Existing tools require either a running agent, a cloud subscription, or writing custom SQL against `system.query_log` every time you want an answer. We wanted something simpler: point a script at a log file, get a ranked report back. So we built one.

### What the profiler does

The tool reads the ClickHouse server log file line-by-line, extracts every executed query along with its execution time, rows read, bytes read, and peak memory usage, then groups structurally identical queries together and ranks them by the metric you care about most.

### 5 report formats

Text, Markdown, JSON, CSV, and a dark-themed interactive HTML report.

### Rich statistics

Total, min, max, avg, p95, stddev, and median for every metric.

### Flexible sorting

Sort by exec time, rows read, bytes read, peak memory, QPS, or call count.

### S3 support

Read log files directly from S3 or any S3-compatible store like MinIO.

### Compressed files

Reads .gz and .bz2 log archives transparently — no manual extraction needed.

### Zero dependencies

Pure Python 3.7+ standard library. S3 support is the only optional extra.

### Requirements

To run the ClickHouse Log Profiler, you only need **Python 3.7** or higher — no third-party packages are required for core functionality. The tool relies entirely on the Python standard library, which means you can drop it onto any server and run it immediately without setting up a virtual environment or installing dependencies.

The only optional dependency is **boto3**, which is needed exclusively for S3 support. If you plan to read log files directly from Amazon S3, MinIO, or any other S3-compatible object store, install it with a single command:

```bash
pip install boto3
```

For AWS authentication, the tool follows the standard boto3 credential chain — it will automatically pick up credentials from environment variables (**`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`**), from `~/.aws/credentials`, or from an IAM instance role if you are running on EC2. Explicit credentials can also be passed directly via CLI flags if preferred.

The profiler has been tested on Linux and macOS. It reads the default ClickHouse server log located at `/var/log/clickhouse-server/clickhouse-server.log`, and is compatible with both older and newer ClickHouse log formats. Compressed log archives in `.gz` and `.bz2` format are supported out of the box.

### Setting up a test dataset

For this walkthrough we used the publicly available UK Land Registry price paid dataset — roughly 27 million property transactions spanning 30 years. First we create the table:

```sql
CREATE DATABASE uk;

CREATE TABLE uk.uk_price_paid
(
    price      UInt32,
    date       Date,
    postcode1  LowCardinality(String),
    postcode2  LowCardinality(String),
    type       Enum8('terraced' = 1, 'semi-detached' = 2,
                      'detached' = 3, 'flat' = 4, 'other' = 0),
    is_new     UInt8,
    duration   Enum8('freehold' = 1, 'leasehold' = 2, 'unknown' = 0),
    addr1      String,
    addr2      String,
    street     LowCardinality(String),
    locality   LowCardinality(String),
    town       LowCardinality(String),
    district   LowCardinality(String),
    county     LowCardinality(String)
)
ENGINE = MergeTree
ORDER BY (postcode1, postcode2, addr1, addr2);
```

Then we load data from the public Land Registry CSV endpoint. ClickHouse’s `url()` table function streams the file directly — no intermediate download required:

```sql
INSERT INTO uk.uk_price_paid
SELECT
    toUInt32(price_string)                                  AS price,
    parseDateTimeBestEffortUS(time)                        AS date,
    splitByChar(' ', postcode)[1]                          AS postcode1,
    splitByChar(' ', postcode)[2]                          AS postcode2,
    transform(a, ['T','S','D','F','O'],
              ['terraced','semi-detached','detached','flat','other'])
                                                              AS type,
    b = 'Y'                                                 AS is_new,
    transform(c, ['F','L','U'],
              ['freehold','leasehold','unknown'])          AS duration,
    addr1, addr2, street, locality, town, district, county
FROM url(
    'http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-complete.csv',
    'CSV',
    'uuid_string String, price_string String, time String,
     postcode String, a String, b String, c String,
     addr1 String, addr2 String, street String,
     locality String, town String, district String, county String,
     d String, e String'
);
```

Alternatively, if you want to generate synthetic data quickly for local testing, ClickHouse’s built-in random functions make that straightforward:

```sql
INSERT INTO uk.uk_price_paid
SELECT
    randUniform(50000, 2000000)::UInt32  AS price,
    toDate('1995-01-01') + randUniform(0, 10000)::UInt32  AS date,
    arrayElement(['SW1','EC1','W1','N1','SE1','E1','NW1','WC1'],
                  rand() % 8 + 1)                   AS postcode1,
    arrayElement(['terraced','semi-detached','detached','flat','other'],
                  rand() % 5 + 1)                   AS type,
    rand() % 2                                     AS is_new,
    arrayElement(['freehold','leasehold','unknown'],
                  rand() % 3 + 1)                   AS duration,
    arrayElement(['London','Manchester','Birmingham','Leeds','Bristol'],
                  rand() % 5 + 1)                   AS town,
    -- ... remaining columns omitted for brevity
FROM numbers(500000);
```

### Generating meaningful log activity

The profiler needs log entries to analyze, so we run a mix of queries that represent different workload shapes: fast lookups, heavy aggregations, joins, and window functions.

```sql
-- Fast: called frequently, low cost
SELECT COUNT(*) FROM uk.uk_price_paid;
SELECT AVG(price) FROM uk.uk_price_paid;

-- Medium: aggregation by group
SELECT town, AVG(price), COUNT(*), MIN(price), MAX(price)
FROM uk.uk_price_paid
GROUP BY town
ORDER BY AVG(price) DESC;

-- Medium: price trend over time
SELECT toYear(date) AS year, AVG(price) AS avg_price, COUNT(*) AS sales
FROM uk.uk_price_paid
GROUP BY year ORDER BY year;

-- Heavy: quantile computation
SELECT
    town,
    quantile(0.50)(price) AS median_price,
    quantile(0.95)(price) AS p95_price,
    quantile(0.99)(price) AS p99_price
FROM uk.uk_price_paid
GROUP BY town;

-- Very heavy: self-join comparing new vs. existing builds
SELECT
    a.town,
    AVG(a.price) AS avg_new,
    AVG(b.price) AS avg_old
FROM uk.uk_price_paid a
JOIN uk.uk_price_paid b ON a.town = b.town AND b.is_new = 0
WHERE a.is_new = 1
GROUP BY a.town;
```

### Running the profiler

The tool is a single Python file. Drop it on any machine that has access to the ClickHouse log and run it directly — no installation step required.

#### Basic usage

```sql
python3 clickhouse_profiler.py /var/log/clickhouse-server/clickhouse-server.log
```

Output

```sql
# Query 6  |  QPS: 0.000  |  Errors: 0
# Time range: From 2026-04-17 17:11:42.055904 to 2026-04-17 17:11:42.055904
# ========================================================================
# Attribute          total       min       max       avg       95%    stddev    median
# ==============  =========  =========  =========  =========  =========  =========  =========
# Count               1.00
# Exec time       117.09ms  117.09ms  117.09ms  117.09ms  117.09ms     0.00s  117.09ms
# Rows read         31.59M    31.59M    31.59M    31.59M    31.59M      0.00    31.59M
# Bytes read      220.41MB  220.41MB  220.41MB  220.41MB  220.41MB     0.00B  220.41MB
# Peak Memory        0.00B     0.00B     0.00B     0.00B     0.00B     0.00B     0.00B
# ========================================================================
# Databases  uk (1/1)
# Hosts      127.0.0.1 (1/1)
# Users      unknown (1/1)
# Completion 1/1
# Query_time distribution
# ========================================================================
#   1us  
#  10us  
# 100us  
#   1ms  
#  10ms  
# 100ms  ##################################################
#    1s  
#  10s+  
# ========================================================================
# Query
(query 1, line 1) SELECT type, duration, is_new, AVG(price) AS avg_price, COUNT(*) AS count FROM uk.uk_price_paid GROUP BY type, duration, is_new ORDER BY avg_price DESC

# Query 7  |  QPS: 0.000  |  Errors: 0
# Time range: From 2026-04-17 16:59:44.035075 to 2026-04-17 16:59:44.035075
# ========================================================================
# Attribute          total       min       max       avg       95%    stddev    median
# ==============  =========  =========  =========  =========  =========  =========  =========
# Count               1.00
# Exec time       102.19ms  102.19ms  102.19ms  102.19ms  102.19ms     0.00s  102.19ms
# Rows read         31.09M    31.09M    31.09M    31.09M    31.09M      0.00    31.09M
# Bytes read      310.92MB  310.92MB  310.92MB  310.92MB  310.92MB     0.00B  310.92MB
# Peak Memory        0.00B     0.00B     0.00B     0.00B     0.00B     0.00B     0.00B
# ========================================================================
# Databases  uk (1/1)
# Hosts      127.0.0.1 (1/1)
# Users      unknown (1/1)
# Completion 1/1
# Query_time distribution
# ========================================================================
#   1us  
#  10us  
# 100us  
#   1ms  
#  10ms  
# 100ms  ##################################################
#    1s  
#  10s+  
# ========================================================================
# Query
(query 1, line 1) SELECT town, district, count() AS c, round(avg(price)) AS price, bar(price, 0, 5000000, 100) FROM uk.uk_price_paid WHERE date >= '2020-01-01' GROUP BY town, district HAVING c >= 100 ORDER BY price DESC LIMIT 100
```

That’s it. You get a ranked text report on stdout within seconds, even for multi-gigabyte log files.

#### Choosing a report format

```sql
# Interactive HTML report saved to disk
python3 clickhouse_profiler.py -r html -o report.html /var/log/clickhouse-server/clickhouse-server.log

# Markdown — paste directly into your wiki
python3 clickhouse_profiler.py -r md -o report.md  /var/log/clickhouse-server/clickhouse-server.log

# JSON — pipe to jq or ingest into another system
python3 clickhouse_profiler.py -r json -o report.json /var/log/clickhouse-server/clickhouse-server.log

# CSV — open in Excel or Google Sheets
python3 clickhouse_profiler.py -r csv  -o report.csv  /var/log/clickhouse-server/clickhouse-server.log
```

#### Sorting and filtering

```sql
# Top 20 queries by bytes read
python3 clickhouse_profiler.py -n 20 --sort-field=BytesRead /var/log/...

# Queries that appear most often (call count)
python3 clickhouse_profiler.py --sort-field=QueryCount /var/log/...

# Worst cumulative time (sum of all executions)
python3 clickhouse_profiler.py --sort-field-operation=sum /var/log/...

# Only queries slower than 500 ms
python3 clickhouse_profiler.py --min-duration=0.5 /var/log/...

# Only queries matching a pattern
python3 clickhouse_profiler.py --query-filter="uk_price_paid" /var/log/...

# Narrow to a specific time window
python3 clickhouse_profiler.py \
    --from-time "2026-04-17 09:00:00" \
    --to-time   "2026-04-17 11:00:00" \
    /var/log/clickhouse-server/clickhouse-server.log
```

#### Analyzing compressed archives

Log rotation typically produces `.gz` files. The profiler handles them transparently — you can pass multiple files or mix compressed and uncompressed:

```sql
# All rotated logs + today's live log in one pass
python3 clickhouse_profiler.py \
    /var/log/clickhouse-server/clickhouse-server.log   \
    /var/log/clickhouse-server/clickhouse-server.log.1.gz \
    /var/log/clickhouse-server/clickhouse-server.log.2.gz
```

#### Reading directly from S3

If your logs are shipped to object storage — which is common in cloud deployments — the profiler can stream them without downloading first. You only need `boto3` installed:

```sql
pip install boto3

# Single object — credentials from ~/.aws or IAM role
python3 clickhouse_profiler.py \
    s3://my-bucket/clickhouse/logs/clickhouse-server.log.gz

# Entire folder — lists and reads all objects under the prefix
python3 clickhouse_profiler.py \
    s3://my-bucket/clickhouse/logs/

# Explicit credentials
python3 clickhouse_profiler.py \
    s3://my-bucket/clickhouse/logs/ \
    --s3-access-key AKIAIOSFODNN7EXAMPLE \
    --s3-secret-key wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# MinIO or any S3-compatible store
python3 clickhouse_profiler.py \
    s3://my-bucket/logs/ \
    --s3-endpoint http://minio.internal:9000 \
    --s3-region us-east-1 \
    -r html -o report.html
```

#### Full production example

```sql
# Top 20 slowest queries from last night, as an HTML report
python3 clickhouse_profiler.py \
    -n 20 \
    --from-time  "2026-04-16 22:00:00" \
    --to-time    "2026-04-17 06:00:00" \
    --min-duration 0.1 \
    --sort-field=BytesRead \
    --sort-order=desc \
    -r html \
    -o overnight_report.html \
    s3://prod-logs/clickhouse/2026-04-16/
```

#### What the output looks like

Here is a condensed sample of the text report generated against our UK price-paid dataset after running the workload queries above:

```sql
# Current date: 2026-04-17 17:41:47
# Hostname: prod-analytics-01
# Overall: 34  |  Unique: 20  |  QPS: 0.01  |  Errors: 0
# Time range: 2026-04-17 16:50:33 to 2026-04-17 17:31:25

# Attribute         total      min      max      avg      95%   stddev   median
# ============    =======  =======  =======  =======  =======  =======  =======
# Exec time        1.55ks  950.0us   1.04ks   45.47s  177.66s  195.57s   48.28ms
# Rows read       631.35M     1.00  63.18M   18.57M   31.84M   17.53M   31.09M
# Bytes read        9.17GB  16.00B    5.44GB 269.84MB 401.72MB 923.23MB  75.09MB

# Profile
# Rank  Response time    Calls  R/Call  Query
# ====  =============    =====  ======  =====
#    1   1.04ks  67.1%       1  1.04ks  SELECT a.town, AVG(a.price) AS avg_new ...
#    2  121.9ms   0.1%       2  121.8ms SELECT town, AVG(price), COUNT(*) ...
#    3  162.5ms   0.0%       1  162.5ms SELECT type, duration, is_new, AVG(price) ...
#    4  206.6ms   0.0%       1  206.6ms SELECT COUNT(*) FROM uk.uk_price_paid ...
```

**Json Output Example**

```sql
{
      "rank": 10,
      "sample_query": "(query 1, line 1) SELECT toYear(date) AS year, round(avg(price)) AS price, bar(price, 0, 1000000, 80 ) FROM uk.uk_price_paid GROUP BY year ORDER BY year",
      "normalized_query": "(QUERY ?, LINE ?) SELECT TOYEAR(DATE) AS YEAR, ROUND(AVG(PRICE)) AS PRICE, BAR(PRICE, ?, ?, ? ) FROM UK.UK_PRICE_PAID GROUP BY YEAR ORDER BY YEAR",
      "count": 1,
      "qps": 0.0,
      "completion": "1/1",
      "error_count": 0,
      "time_range": {
        "from": "2026-04-17T16:59:36.193560",
        "to": "2026-04-17T16:59:36.193560"
      },
      "exec_time_sec": {
        "total": 0.077533,
        "min": 0.077533,
        "max": 0.077533,
        "avg": 0.077533,
        "p95": 0.077533,
        "stddev": 0.0,
        "median": 0.077533
      },
      "rows_read": {
        "total": 31092167.0,
        "min": 31092167.0,
        "max": 31092167.0,
        "avg": 31092167.0,
        "p95": 31092167.0,
        "stddev": 0.0,
        "median": 31092167.0
      },
      "bytes_read": {
        "total": 186552156.16,
        "min": 186552156.16,
        "max": 186552156.16,
        "avg": 186552156.16,
        "p95": 186552156.16,
        "stddev": 0.0,
        "median": 186552156.16
      },
      "peak_memory_bytes": {
        "total": 0.0,
        "min": 0.0,
        "max": 0.0,
        "avg": 0.0,
        "p95": 0.0,
        "stddev": 0.0,
        "median": 0.0
      },
      "users": {
        "unknown": 1
      },
      "hosts": {
        "127.0.0.1": 1
      },
      "databases": {
        "uk": 1
      }
    }
```

### A few design decisions worth explaining

1

### Query normalization

Literal values (numbers, strings, IN lists) are replaced with `?` placeholders before grouping. This means `WHERE price > 100000` and `WHERE price > 250000` collapse into the same group — which is almost always what you want when identifying hot query patterns.

2

### Parse-only, no runtime impact

The profiler reads log files that already exist on disk or in S3. It attaches to nothing and modifies nothing. You can run it against production logs from a separate machine with zero impact on the ClickHouse process.

3

### Streaming S3 reads

S3 objects are streamed line-by-line rather than downloaded to a temp file. This keeps memory usage flat regardless of log size — a 10 GB log file uses the same memory footprint as a 10 MB one.

4

### Handling ClickHouse version differences

Newer ClickHouse versions changed the query start line format — the `user:` field moved and a `(query N, line N)` prefix was added. The parser handles both the old and new formats automatically.

### Performance

The tool is I/O-bound. On a modern laptop with an SSD, it processes roughly 125 MB/s of log data. For reference:

~0.5s
10 MB log

~3s
100 MB log

~25s
1 GB log

~2m
5 GB log

S3 throughput depends on network bandwidth. On an EC2 instance in the same region as the bucket, we measured roughly 80–100 MB/s end-to-end.

### What’s next

We’re planning to add a real-time mode that tails the log file and updates stats continuously — useful for watching a deployment or a batch job as it runs. A diff mode for comparing two time windows (before/after an index change, for example) is also on the roadmap.

If you’re running ClickHouse and want a fast, self-contained way to understand your query workload, give it a try. We’ve been using it in production at BlancoByte for every performance investigation since we built it.

*The best observability tool is the one that’s already on the machine when something goes wrong at 2 a.m.*
