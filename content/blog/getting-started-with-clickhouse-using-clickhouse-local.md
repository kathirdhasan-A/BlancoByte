---
title: Getting Started with ClickHouse Using clickhouse-local
description: What if you could run ClickHouse SQL queries without setting up a server or managing storage? That’s exactly what clickhouse-local is for.
date: '2025-09-05'
author: Can Sayin
tags:
- clickhouse
image: /blog-images/2025-09-IMG_0487-843x1024.jpeg
---

What if you could run ClickHouse SQL queries **without setting up a server** or managing storage? That’s exactly what clickhouse-local is for.

clickhouse-local transforms the ClickHouse query engine into a lightweight **command-line utility**. It allows you to:

- Query files directly (CSV, TSV, Parquet, JSON, etc.).
- Use ClickHouse’s full SQL dialect and built-in functions.
- Perform transformations on the fly, without first importing data into a database.

In short: it’s a great way to explore datasets quickly, prototype queries, or use SQL in shell pipelines.

## **How Does** **clickhouse-local differ from****clickhouse-client** **?**

- **clickhouse-client** connects to a running ClickHouse server, allowing you to interact with existing databases and tables.
- **clickhouse-local** runs entirely **without a server**. It reads data from files (or stdin, or URLs), applies SQL queries, and outputs results directly to your terminal or pipeline.

This makes clickhouse-local particularly useful for **one-off queries, file exploration, or quick data analysis scripts**.

## **Installing and Running** **clickhouse-local**

On macOS, you can install ClickHouse with Homebrew:

```sql
brew install clickhouse
brew services start clickhouse # if you also want to run the server

```

Once installed, you can launch clickhouse-local:

```sql
clickhouse-local

```

You’ll see something like:

```sql
ClickHouse local version 22.9.3.18 (official build).
: )

```

## **Example 1: Counting Words in a Text File**

Suppose you have a text file book.txt and want to find the top 10 most frequent words.

```sql
cat book.txt | tr -s ' ' '\n' | \
clickhouse-local \
--structure "word String" \
--query "SELECT word, count() AS cnt 
FROM table 
WHERE word != '' 
GROUP BY word 
ORDER BY cnt DESC 
LIMIT 10 FORMAT Pretty"

```

This gives you a quick word frequency analysis using SQL, without loading the file into a database.

## **Example 2: Analyzing a JSON File**

Imagine you have an application log stored as JSON lines in logs.json. Each row has fields like timestamp, level, and message.

```sql
clickhouse-local \
--file=logs.json \
--input-format=JSONEachRow \
--structure="timestamp DateTime, level String, message String" \
--query="SELECT level, count() AS events 
FROM table 
GROUP BY level 
ORDER BY events DESC"

```

This instantly tells you how many log entries exist per severity level.

## **Example 3: Querying Remote Data from a URL**

You don’t even need local files—clickhouse-local can fetch data from a remote source. For example, let’s query a JSON API that returns cryptocurrency prices:

```sql
clickhouse-local \
--query="SELECT symbol, priceUsd 
FROM url('https://api.coincap.io/v2/assets','JSONEachRow','symbol String, priceUsd Float64') 
ORDER BY priceUsd DESC 
LIMIT 5 FORMAT PrettyCompact"

```

The result gives you the top 5 cryptocurrencies by price, straight from the API, without any extra scripting.

## **Why Use** **clickhouse-local** **?**

Here’s where it shines:

- **Exploratory analysis** – Quickly check file contents with SQL.
- **Data preprocessing** – Transform data before loading it into ClickHouse (or another system).
- **Scripting and pipelines** – Combine with shell tools like awk, sed, or jq.
- **Performance** – Faster than SQLite-based command-line SQL tools like q or textql.

---

## **Conclusion**

clickhouse-local is a hidden gem in the ClickHouse ecosystem. It gives you:

- The **power of ClickHouse SQL** without running a server.
- The ability to query **local files, remote files, and even URLs**.
- Seamless integration with **shell pipelines** for ad-hoc data processing.

Whether you’re exploring a CSV, analyzing logs, or fetching real-time API data, clickhouse-local offers a fast, flexible, and lightweight way to do it all.

If you’re new to ClickHouse, clickhouse-local is one of the best entry points—it lets you experiment with SQL and ClickHouse functions immediately, no setup required.
