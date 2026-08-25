---
title: How the BlancoByte Branching Tool Simplifies ClickHouse Database Development
description: In modern software development, handling data in a reliable and scalable way is essential for building stable applications. As systems grow more complex, teams need safer ways to test changes and experiment with database structures without risking production environments. One technique that has beco
date: '2026-03-13'
author: Can Sayin
tags:
- clickhouse
image: /blog-images/2026-03-8707E958-0191-46DE-8517-1E3DE42E4CE2_1_105_c.jpeg
---

## Introduction

In modern software development, handling data in a reliable and scalable way is essential for building stable applications. As systems grow more complex, teams need safer ways to test changes and experiment with database structures without risking production environments. One technique that has become increasingly popular is Database Branching.

This approach allows developers to create independent copies, or branches, of a database so they can test features, modify schemas, and experiment with data safely. In this article, we’ll explain what Database Branching is, discuss its advantages, and look at how it can be implemented using the BlancoByte’s script.

![](/blog-images/2026-03-Screenshot-2026-03-13-at-13.14.13-300x200.png)

## What is the Database Branching Method?

Database Branching is a development strategy that involves creating multiple isolated versions of a database. These branches allow developers to test modifications and run experiments without affecting the primary production database.

The concept is similar to how version control systems like Git manage code. Instead of branching only source code, developers also branch the database environment. Each branch acts as an independent workspace where schema updates, data transformations, and testing can occur without interfering with other environments.

## Advantages of Database Branching

### Safe Testing and Innovation

Having separate database branches allows developers to explore new ideas, update data models, or test experimental features without putting the main production database at risk. This controlled environment encourages innovation while maintaining system stability.

### Support for Parallel Development

Database branching makes it easier for development teams to work simultaneously on multiple features. Each developer or team can operate within their own database branch and later merge successful changes back into the main system, minimizing conflicts and improving collaboration.

### Alignment Between Code and Data

When database branches are tied to specific code changes, developers can ensure that schema updates and application logic remain synchronized. This reduces the likelihood of mismatches between the application and its data structure, making debugging much easier.

### Simple Rollback Options

If a feature test or database modification doesn’t produce the expected results, developers can quickly revert to an earlier branch version. This rollback capability helps maintain data consistency and prevents long-term issues caused by faulty changes.

### Performance Experimentation

Developers can use database branches to test performance improvements on a smaller, isolated dataset before deploying them to production. This ensures that optimizations are validated thoroughly before affecting live systems.

## Example with BlancoByte Branching Tool on-prem

<https://github.com/BlancoByte/ClickHouse-Branching-Tool>

```sql
CREATE TABLE uk_price_paid
(
    price UInt32,
    date Date,
    postcode1 LowCardinality(String),
    postcode2 LowCardinality(String),
    type Enum8('terraced' = 1, 'semi-detached' = 2, 'detached' = 3, 'flat' = 4, 'other' = 0),
    is_new UInt8,
    duration Enum8('freehold' = 1, 'leasehold' = 2, 'unknown' = 0),
    addr1 String,
    addr2 String,
    street LowCardinality(String),
    locality LowCardinality(String),
    town LowCardinality(String),
    district LowCardinality(String),
    county LowCardinality(String)
)
ENGINE = MergeTree
ORDER BY (postcode1, postcode2, addr1, addr2);
```

Insert data into table

```sql
INSERT INTO uk_price_paid
WITH
   splitByChar(' ', postcode) AS p
SELECT
    toUInt32(price_string) AS price,
    parseDateTimeBestEffortUS(time) AS date,
    p[1] AS postcode1,
    p[2] AS postcode2,
    transform(a, ['T', 'S', 'D', 'F', 'O'], ['terraced', 'semi-detached', 'detached', 'flat', 'other']) AS type,
    b = 'Y' AS is_new,
    transform(c, ['F', 'L', 'U'], ['freehold', 'leasehold', 'unknown']) AS duration,
    addr1,
    addr2,
    street,
    locality,
    town,
    district,
    county
FROM url(
    'http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-complete.csv',
    'CSV',
    'uuid_string String,
    price_string String,
    time String,
    postcode String,
    a String,
    b String,
    c String,
    addr1 String,
    addr2 String,
    street String,
    locality String,
    town String,
    district String,
    county String,
    d String,
    e String'
) SETTINGS max_http_get_redirects=10;
```

```sql
Elapsed: 168.927 sec. Processed 28.35 million rows, 7.68 GB (167.82 thousand rows/s., 45.45 MB/s.)

SELECT count(*) FROM uk_price_paid

28349587 rows return.
```

Before establishing a connection with the **BlancoByte on-prem** and creating a database branch, several configuration details must be provided. These credentials allow the branching system to access the database securely and prepare the environment for the branching process.

The required information includes:

- **Database Name**
- **Table Name**
- **Branch Name**
- **Username**
- **Password**
- **Host Name**
- **Port**

Once these details are supplied, the **Branching Tool** begins the process by temporarily freezing the main table. After the freeze operation is completed, the system generates a new table that mirrors the structure of the original main table.

During this stage, the tool establishes a **hardlink** connection to the frozen main table. This allows the new branch table to access the same underlying data while still functioning as an independent development environment.

> **Note:** The branching operation does **not duplicate the existing data**. Because of the hardlink mechanism, the storage usage remains unchanged. Instead of copying files, the branching tool creates a link between the main table and the newly created branch table, allowing both to reference the same data safely.

After the freeze operation finishes, the branching tool scans the directories located under the **freeze path** and automatically creates the required hardlinks for the newly generated branch table.

```sql
python3 clickhouse-branching.py --database default --table uk_price_paid --branch-name tabletest --username default --password '' --hostname localhost --port 9000
```

**Example Output**

Following uk\_price\_paid table is 4 GB. Creating branch with new table name will take 5.878 seconds.

```sql
The table default.uk_price_paid has been frozen with name 'default.uk_price_paid_tabletest'
Table information is saved into /tmp/default.uk_price_paid.sql
New Table information is saved into /tmp/default.uk_price_paid_tabletest.sql
Table default.uk_price_paid_tabletest created successfully.
/var/lib/clickhouse/shadow/default%2Euk_price_paid_tabletest/store/e64/e64c4657-416b-40af-abde-275b70f9672c
/var/lib/clickhouse/data/default/uk_price_paid_tabletest/detached/
sending incremental file list
./
all_13_18_1/
all_13_18_1/addr1.bin
all_13_18_1/addr1.cmrk2
all_13_18_1/addr2.bin
all_13_18_1/addr2.cmrk2
all_13_18_1/checksums.txt
all_13_18_1/columns.txt
all_13_18_1/count.txt
all_13_18_1/county.bin
all_13_18_1/county.cmrk2
all_13_18_1/county.dict.bin
all_13_18_1/county.dict.cmrk2
all_13_18_1/date.bin
all_13_18_1/date.cmrk2
all_13_18_1/default_compression_codec.txt
all_13_18_1/district.bin
all_13_18_1/district.cmrk2
all_13_18_1/district.dict.bin
all_13_18_1/district.dict.cmrk2
all_13_18_1/duration.bin
all_13_18_1/duration.cmrk2
all_13_18_1/is_new.bin
all_13_18_1/is_new.cmrk2
all_13_18_1/locality.bin
all_13_18_1/locality.cmrk2
all_13_18_1/locality.dict.bin
all_13_18_1/locality.dict.cmrk2
all_13_18_1/postcode1.bin
all_13_18_1/postcode1.cmrk2
all_13_18_1/postcode1.dict.bin
all_13_18_1/postcode1.dict.cmrk2
all_13_18_1/postcode2.bin
all_13_18_1/postcode2.cmrk2
all_13_18_1/postcode2.dict.bin
all_13_18_1/postcode2.dict.cmrk2
all_13_18_1/price.bin
all_13_18_1/price.cmrk2
all_13_18_1/primary.cidx
all_13_18_1/serialization.json
all_13_18_1/street.bin
all_13_18_1/street.cmrk2
all_13_18_1/street.dict.bin
all_13_18_1/street.dict.cmrk2
all_13_18_1/town.bin
all_13_18_1/town.cmrk2
all_13_18_1/town.dict.bin
all_13_18_1/town.dict.cmrk2
all_13_18_1/type.bin
all_13_18_1/type.cmrk2
all_19_24_1/
all_19_24_1/addr1.bin
all_19_24_1/addr1.cmrk2
all_19_24_1/addr2.bin
all_19_24_1/addr2.cmrk2
all_19_24_1/checksums.txt
all_19_24_1/columns.txt
all_19_24_1/count.txt
all_19_24_1/county.bin
all_19_24_1/county.cmrk2
all_19_24_1/county.dict.bin
all_19_24_1/county.dict.cmrk2
all_19_24_1/date.bin
all_19_24_1/date.cmrk2
all_19_24_1/default_compression_codec.txt
all_19_24_1/district.bin
all_19_24_1/district.cmrk2
all_19_24_1/district.dict.bin
all_19_24_1/district.dict.cmrk2
all_19_24_1/duration.bin
all_19_24_1/duration.cmrk2
all_19_24_1/is_new.bin
all_19_24_1/is_new.cmrk2
all_19_24_1/locality.bin
all_19_24_1/locality.cmrk2
all_19_24_1/locality.dict.bin
all_19_24_1/locality.dict.cmrk2
all_19_24_1/postcode1.bin
all_19_24_1/postcode1.cmrk2
all_19_24_1/postcode1.dict.bin
all_19_24_1/postcode1.dict.cmrk2
all_19_24_1/postcode2.bin
all_19_24_1/postcode2.cmrk2
all_19_24_1/postcode2.dict.bin
all_19_24_1/postcode2.dict.cmrk2
all_19_24_1/price.bin
all_19_24_1/price.cmrk2
all_19_24_1/primary.cidx
all_19_24_1/serialization.json
all_19_24_1/street.bin
all_19_24_1/street.cmrk2
all_19_24_1/street.dict.bin
all_19_24_1/street.dict.cmrk2
all_19_24_1/town.bin
all_19_24_1/town.cmrk2
all_19_24_1/town.dict.bin
all_19_24_1/town.dict.cmrk2
all_19_24_1/type.bin
all_19_24_1/type.cmrk2
all_1_6_1/
all_1_6_1/addr1.bin
all_1_6_1/addr1.cmrk2
all_1_6_1/addr2.bin
all_1_6_1/addr2.cmrk2
all_1_6_1/checksums.txt
all_1_6_1/columns.txt
all_1_6_1/count.txt
all_1_6_1/county.bin
all_1_6_1/county.cmrk2
all_1_6_1/county.dict.bin
all_1_6_1/county.dict.cmrk2
all_1_6_1/date.bin
all_1_6_1/date.cmrk2
all_1_6_1/default_compression_codec.txt
all_1_6_1/district.bin
all_1_6_1/district.cmrk2
all_1_6_1/district.dict.bin
all_1_6_1/district.dict.cmrk2
all_1_6_1/duration.bin
all_1_6_1/duration.cmrk2
all_1_6_1/is_new.bin
all_1_6_1/is_new.cmrk2
all_1_6_1/locality.bin
all_1_6_1/locality.cmrk2
all_1_6_1/locality.dict.bin
all_1_6_1/locality.dict.cmrk2
all_1_6_1/postcode1.bin
all_1_6_1/postcode1.cmrk2
all_1_6_1/postcode1.dict.bin
all_1_6_1/postcode1.dict.cmrk2
all_1_6_1/postcode2.bin
all_1_6_1/postcode2.cmrk2
all_1_6_1/postcode2.dict.bin
all_1_6_1/postcode2.dict.cmrk2
all_1_6_1/price.bin
all_1_6_1/price.cmrk2
all_1_6_1/primary.cidx
all_1_6_1/serialization.json
all_1_6_1/street.bin
all_1_6_1/street.cmrk2
all_1_6_1/street.dict.bin
all_1_6_1/street.dict.cmrk2
all_1_6_1/town.bin
all_1_6_1/town.cmrk2
all_1_6_1/town.dict.bin
all_1_6_1/town.dict.cmrk2
all_1_6_1/type.bin
all_1_6_1/type.cmrk2
all_25_25_0/
all_25_25_0/addr1.bin
all_25_25_0/addr1.cmrk2
all_25_25_0/addr2.bin
all_25_25_0/addr2.cmrk2
all_25_25_0/checksums.txt
all_25_25_0/columns.txt
all_25_25_0/count.txt
all_25_25_0/county.bin
all_25_25_0/county.cmrk2
all_25_25_0/county.dict.bin
all_25_25_0/county.dict.cmrk2
all_25_25_0/date.bin
all_25_25_0/date.cmrk2
all_25_25_0/default_compression_codec.txt
all_25_25_0/district.bin
all_25_25_0/district.cmrk2
all_25_25_0/district.dict.bin
all_25_25_0/district.dict.cmrk2
all_25_25_0/duration.bin
all_25_25_0/duration.cmrk2
all_25_25_0/is_new.bin
all_25_25_0/is_new.cmrk2
all_25_25_0/locality.bin
all_25_25_0/locality.cmrk2
all_25_25_0/locality.dict.bin
all_25_25_0/locality.dict.cmrk2
all_25_25_0/postcode1.bin
all_25_25_0/postcode1.cmrk2
all_25_25_0/postcode1.dict.bin
all_25_25_0/postcode1.dict.cmrk2
all_25_25_0/postcode2.bin
all_25_25_0/postcode2.cmrk2
all_25_25_0/postcode2.dict.bin
all_25_25_0/postcode2.dict.cmrk2
all_25_25_0/price.bin
all_25_25_0/price.cmrk2
all_25_25_0/primary.cidx
all_25_25_0/serialization.json
all_25_25_0/street.bin
all_25_25_0/street.cmrk2
all_25_25_0/street.dict.bin
all_25_25_0/street.dict.cmrk2
all_25_25_0/town.bin
all_25_25_0/town.cmrk2
all_25_25_0/town.dict.bin
all_25_25_0/town.dict.cmrk2
all_25_25_0/type.bin
all_25_25_0/type.cmrk2
all_26_26_0/
all_26_26_0/addr1.bin
all_26_26_0/addr1.cmrk2
all_26_26_0/addr2.bin
all_26_26_0/addr2.cmrk2
all_26_26_0/checksums.txt
all_26_26_0/columns.txt
all_26_26_0/count.txt
all_26_26_0/county.bin
all_26_26_0/county.cmrk2
all_26_26_0/county.dict.bin
all_26_26_0/county.dict.cmrk2
all_26_26_0/date.bin
all_26_26_0/date.cmrk2
all_26_26_0/default_compression_codec.txt
all_26_26_0/district.bin
all_26_26_0/district.cmrk2
all_26_26_0/district.dict.bin
all_26_26_0/district.dict.cmrk2
all_26_26_0/duration.bin
all_26_26_0/duration.cmrk2
all_26_26_0/is_new.bin
all_26_26_0/is_new.cmrk2
all_26_26_0/locality.bin
all_26_26_0/locality.cmrk2
all_26_26_0/locality.dict.bin
all_26_26_0/locality.dict.cmrk2
all_26_26_0/postcode1.bin
all_26_26_0/postcode1.cmrk2
all_26_26_0/postcode1.dict.bin
all_26_26_0/postcode1.dict.cmrk2
all_26_26_0/postcode2.bin
all_26_26_0/postcode2.cmrk2
all_26_26_0/postcode2.dict.bin
all_26_26_0/postcode2.dict.cmrk2
all_26_26_0/price.bin
all_26_26_0/price.cmrk2
all_26_26_0/primary.cidx
all_26_26_0/serialization.json
all_26_26_0/street.bin
all_26_26_0/street.cmrk2
all_26_26_0/street.dict.bin
all_26_26_0/street.dict.cmrk2
all_26_26_0/town.bin
all_26_26_0/town.cmrk2
all_26_26_0/town.dict.bin
all_26_26_0/town.dict.cmrk2
all_26_26_0/type.bin
all_26_26_0/type.cmrk2
all_27_27_0/
all_27_27_0/addr1.bin
all_27_27_0/addr1.cmrk2
all_27_27_0/addr2.bin
all_27_27_0/addr2.cmrk2
all_27_27_0/checksums.txt
all_27_27_0/columns.txt
all_27_27_0/count.txt
all_27_27_0/county.bin
all_27_27_0/county.cmrk2
all_27_27_0/county.dict.bin
all_27_27_0/county.dict.cmrk2
all_27_27_0/date.bin
all_27_27_0/date.cmrk2
all_27_27_0/default_compression_codec.txt
all_27_27_0/district.bin
all_27_27_0/district.cmrk2
all_27_27_0/district.dict.bin
all_27_27_0/district.dict.cmrk2
all_27_27_0/duration.bin
all_27_27_0/duration.cmrk2
all_27_27_0/is_new.bin
all_27_27_0/is_new.cmrk2
all_27_27_0/locality.bin
all_27_27_0/locality.cmrk2
all_27_27_0/locality.dict.bin
all_27_27_0/locality.dict.cmrk2
all_27_27_0/postcode1.bin
all_27_27_0/postcode1.cmrk2
all_27_27_0/postcode1.dict.bin
all_27_27_0/postcode1.dict.cmrk2
all_27_27_0/postcode2.bin
all_27_27_0/postcode2.cmrk2
all_27_27_0/postcode2.dict.bin
all_27_27_0/postcode2.dict.cmrk2
all_27_27_0/price.bin
all_27_27_0/price.cmrk2
all_27_27_0/primary.cidx
all_27_27_0/serialization.json
all_27_27_0/street.bin
all_27_27_0/street.cmrk2
all_27_27_0/street.dict.bin
all_27_27_0/street.dict.cmrk2
all_27_27_0/town.bin
all_27_27_0/town.cmrk2
all_27_27_0/town.dict.bin
all_27_27_0/town.dict.cmrk2
all_27_27_0/type.bin
all_27_27_0/type.cmrk2
all_28_28_0/
all_28_28_0/addr1.bin
all_28_28_0/addr1.cmrk2
all_28_28_0/addr2.bin
all_28_28_0/addr2.cmrk2
all_28_28_0/checksums.txt
all_28_28_0/columns.txt
all_28_28_0/count.txt
all_28_28_0/county.bin
all_28_28_0/county.cmrk2
all_28_28_0/county.dict.bin
all_28_28_0/county.dict.cmrk2
all_28_28_0/date.bin
all_28_28_0/date.cmrk2
all_28_28_0/default_compression_codec.txt
all_28_28_0/district.bin
all_28_28_0/district.cmrk2
all_28_28_0/district.dict.bin
all_28_28_0/district.dict.cmrk2
all_28_28_0/duration.bin
all_28_28_0/duration.cmrk2
all_28_28_0/is_new.bin
all_28_28_0/is_new.cmrk2
all_28_28_0/is_new.sparse.idx.bin
all_28_28_0/is_new.sparse.idx.cmrk2
all_28_28_0/locality.bin
all_28_28_0/locality.cmrk2
all_28_28_0/locality.dict.bin
all_28_28_0/locality.dict.cmrk2
all_28_28_0/postcode1.bin
all_28_28_0/postcode1.cmrk2
all_28_28_0/postcode1.dict.bin
all_28_28_0/postcode1.dict.cmrk2
all_28_28_0/postcode2.bin
all_28_28_0/postcode2.cmrk2
all_28_28_0/postcode2.dict.bin
all_28_28_0/postcode2.dict.cmrk2
all_28_28_0/price.bin
all_28_28_0/price.cmrk2
all_28_28_0/primary.cidx
all_28_28_0/serialization.json
all_28_28_0/street.bin
all_28_28_0/street.cmrk2
all_28_28_0/street.dict.bin
all_28_28_0/street.dict.cmrk2
all_28_28_0/town.bin
all_28_28_0/town.cmrk2
all_28_28_0/town.dict.bin
all_28_28_0/town.dict.cmrk2
all_28_28_0/type.bin
all_28_28_0/type.cmrk2
all_7_12_1/
all_7_12_1/addr1.bin
all_7_12_1/addr1.cmrk2
all_7_12_1/addr2.bin
all_7_12_1/addr2.cmrk2
all_7_12_1/checksums.txt
all_7_12_1/columns.txt
all_7_12_1/count.txt
all_7_12_1/county.bin
all_7_12_1/county.cmrk2
all_7_12_1/county.dict.bin
all_7_12_1/county.dict.cmrk2
all_7_12_1/date.bin
all_7_12_1/date.cmrk2
all_7_12_1/default_compression_codec.txt
all_7_12_1/district.bin
all_7_12_1/district.cmrk2
all_7_12_1/district.dict.bin
all_7_12_1/district.dict.cmrk2
all_7_12_1/duration.bin
all_7_12_1/duration.cmrk2
all_7_12_1/is_new.bin
all_7_12_1/is_new.cmrk2
all_7_12_1/locality.bin
all_7_12_1/locality.cmrk2
all_7_12_1/locality.dict.bin
all_7_12_1/locality.dict.cmrk2
all_7_12_1/postcode1.bin
all_7_12_1/postcode1.cmrk2
all_7_12_1/postcode1.dict.bin
all_7_12_1/postcode1.dict.cmrk2
all_7_12_1/postcode2.bin
all_7_12_1/postcode2.cmrk2
all_7_12_1/postcode2.dict.bin
all_7_12_1/postcode2.dict.cmrk2
all_7_12_1/price.bin
all_7_12_1/price.cmrk2
all_7_12_1/primary.cidx
all_7_12_1/serialization.json
all_7_12_1/street.bin
all_7_12_1/street.cmrk2
all_7_12_1/street.dict.bin
all_7_12_1/street.dict.cmrk2
all_7_12_1/town.bin
all_7_12_1/town.cmrk2
all_7_12_1/town.dict.bin
all_7_12_1/town.dict.cmrk2
all_7_12_1/type.bin
all_7_12_1/type.cmrk2

sent 327,670,989 bytes received 7,417 bytes 43,690,454.13 bytes/sec
total size is 327,565,238 speedup is 1.00
Attach copy successfully done.
[]
```

**A new branch has been created in 1.2 second**

<https://github.com/BlancoByte/ClickHouse-Branching-Tool>

## **Conclusion**

Database Branching is a highly effective approach that enables development teams to work more flexibly while protecting the stability of their production systems. By using isolated database branches, developers can safely test new features, adjust data models, and evaluate performance improvements without impacting the main environment.

This method allows teams to experiment freely and identify potential issues before changes reach production. As a result, it improves reliability, accelerates development workflows, and helps maintain strong data consistency throughout the entire software lifecycle.
