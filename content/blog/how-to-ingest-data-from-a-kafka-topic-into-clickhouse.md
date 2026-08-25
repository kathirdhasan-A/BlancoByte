---
title: How to Ingest Data from a Kafka Topic into ClickHouse
description: The good news? ClickHouse provides a Kafka table engine that lets you subscribe directly to Kafka topics and pipe messages into your database efficiently. By combining Kafka with materialized views in ClickHouse, you can build a reliable ingestion pipeline that continuously transforms and stores mes
date: '2025-09-05'
author: Can Sayin
tags:
- clickhouse
image: /blog-images/2025-09-IMG_1849-768x1024.jpeg
---

Modern applications generate enormous streams of events—user activity, transactions, logs, IoT sensor data, and more. **Apache Kafka** has become the de facto standard for transporting these real-time event streams, while **ClickHouse** excels at storing and analyzing them with sub-second query speeds.

The good news? ClickHouse provides a **Kafka table engine** that lets you subscribe directly to Kafka topics and pipe messages into your database efficiently. By combining Kafka with **materialized views** in ClickHouse, you can build a reliable ingestion pipeline that continuously transforms and stores messages for analytics.

In this article, we’ll walk through a simple example of ingesting messages from a Kafka topic into ClickHouse.

## **Step 1: Create a Kafka Engine Table**

The first step is to set up a table that connects ClickHouse to your Kafka topic. This table won’t store data permanently—it’s just a streaming buffer that reads from Kafka.

Suppose your Kafka topic produces JSON messages like this:

```json
{"ID":1 , "Name": "a"}
{"ID":2 , "Name": "b"}
{"ID":3 , "Name": "c"}

```

You can define a Kafka engine table in ClickHouse as follows:

```sql
CREATE TABLE kafka_example
(
ID UInt64,
Name String
) 
ENGINE = Kafka
SETTINGS kafka_broker_list = 'localhost:9092',
kafka_topic_list = 'kafka_topic',
kafka_group_name = 'consumer_group_name',
kafka_format = 'JSONEachRow';

```

Here’s what’s happening:

- **kafka\_broker\_list** – Kafka brokers to connect to (in this case, running locally).
- **kafka\_topic\_list** – The Kafka topic you’re subscribing to.
- **kafka\_group\_name** – Consumer group name for parallel consumption.
- **kafka\_format** – The message format (here JSONEachRow).

At this stage, ClickHouse can read messages from Kafka, but they aren’t stored yet.

## **Step 2: Create a Storage Table**

Since Kafka engine tables don’t persist data, we need a **permanent table** to hold the ingested records. A MergeTree table works perfectly for this:

```sql
CREATE TABLE kafka_example_storage
(
ID UInt64,
Name String
)
ENGINE = MergeTree()
ORDER BY ID;

```

This table is where the data will actually live for querying.

## **Step 3: Define a Materialized View**

The final step is to bridge the Kafka table and the storage table with a **materialized view**. This view continuously reads messages from Kafka and inserts them into your storage table.

```sql
CREATE MATERIALIZED VIEW kafka_example_materialized
TO kafka_example_storage
AS SELECT ID, Name
FROM kafka_example;

```

Now, every new message in the Kafka topic flows into the kafka\_example\_storage table automatically.

## **Useful Kafka Engine Settings**

ClickHouse offers several Kafka-related settings to fine-tune ingestion for different use cases:

- **kafka\_row\_delimiter** – Defines how messages are separated.
- **kafka\_num\_consumers** – Number of consumers per table (≤ topic partitions, ≤ CPU cores).
- **kafka\_max\_block\_size** – Maximum batch size when polling messages.
- **kafka\_skip\_broken\_messages** – How many malformed messages can be skipped per batch.
- **kafka\_thread\_per\_consumer** – Assigns a dedicated thread per consumer.
- **kafka\_commit\_every\_batch** – Commits offsets after every batch instead of full block.

These options help you optimize ingestion throughput and reliability depending on your data velocity and schema.

## **Verifying Ingestion**

Once everything is set up, you can query the storage table to confirm messages are flowing correctly:

```sql
SELECT * FROM kafka_example_storage;
```

You should see the ingested records with minimal delay.

## **Conclusion**

Ingesting Kafka data into ClickHouse is straightforward thanks to the **Kafka engine + materialized views** combo. The Kafka table provides a streaming bridge, while materialized views ensure data lands in permanent storage—ready for fast analytics.

This was a **minimal working example**, but in production you’ll likely need to:

- Tune Kafka settings for higher throughput.
- Use schema-aware formats like Avro, Protobuf, or Parquet.
- Apply transformations inside the materialized view.
- Partition and index your storage tables for faster queries.

With these techniques, ClickHouse can handle high-velocity event streams and power real-time dashboards, anomaly detection, monitoring, and more—all directly on top of your Kafka data.
