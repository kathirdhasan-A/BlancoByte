---
title: A Tiny, Zero-Dependency Benchmark for ClickHouse
description: The whole thing is a single Python file with no dependencies — just the standard library. No clickhouse-driver, no requests, no pip install. It talks to ClickHouse over the HTTP interface (port 8123), so you can drop it on any box that can reach the server and run it.
date: '2026-07-01'
author: Can Sayin
tags:
- clickhouse
image: /blog-images/2026-07-GTEND-2018-04-MON-18_Sun_Race-1057-DSCF0560-1024x683.jpg
---

Every time I upgrade ClickHouse, the same question comes up: *did anything get slower?* Release notes tell you what changed, but they don’t tell you what changed **on your hardware, for your kind of queries**. So I wrote a small script to answer that empirically — run a fixed set of queries before the upgrade, run the exact same set after, and diff the results.

The whole thing is a single Python file with **no dependencies** — just the standard library. No `clickhouse-driver`, no `requests`, no `pip install`. It talks to ClickHouse over the HTTP interface (port 8123), so you can drop it on any box that can reach the server and run it.

## The idea

The workflow is three commands:

```text
# before the upgrade
python3 ch_bench.py run --host 192.168.167.166 --out before.json

# ... do the upgrade ...

# after the upgrade
python3 ch_bench.py run --host 192.168.167.166 --out after.json

# compare
python3 ch_bench.py compare before.json after.json
```

`run` executes each query several times, records latency percentiles, and writes a JSON file. `compare` reads two of those files and prints a per-query delta. That’s it.

## Design choices

A few decisions that keep the results honest and the script simple:

**`FORMAT Null` on every query.** The script strips any `FORMAT` clause you wrote and appends `FORMAT Null`. This tells ClickHouse to execute the query fully but throw away the result rows instead of serializing them. We’re measuring the engine’s compute, not network transfer or client-side parsing. You write the query logic; the script handles the format.

**Query cache disabled.** Each request is sent with `use_query_cache=0`, so you’re always measuring real execution, never a cached answer.

**Warmup runs.** Before the timed iterations, each query runs once (configurable) to warm caches, allocate buffers, and JIT whatever needs warming. Those runs aren’t counted.

**Percentiles, not averages.** For each query the script reports min / p50 / p90 / p99 / max. The p50 is what the comparison is built on, because the median is far more stable than the mean when one unlucky run spikes.

**Synthetic data via `numbers_mt`.** The queries generate their own data with `numbers_mt(...)`, so you don’t need to load a dataset to get a repeatable CPU/memory workload. The constants control how heavy each query is — turn them up or down so every query takes a few seconds on your box. If your hardware is much faster or slower than mine, tune these.

## The query set

Ten queries, each stressing a different part of the engine — aggregation, group-by, sorting, hashing, transcendental math, distinct-counting, quantiles, string search, and a join:

```sql
SELECT sum(number), avg(number), max(number), min(number) FROM numbers_mt(2000000000)
SELECT number % 100 AS k, count(), sum(number) FROM numbers_mt(1000000000) GROUP BY k
SELECT number % 10000000 AS k, count() FROM numbers_mt(500000000) GROUP BY k ORDER BY count() DESC LIMIT 100
SELECT number FROM numbers_mt(200000000) ORDER BY cityHash64(number) LIMIT 100
SELECT sum(cityHash64(number)) FROM numbers_mt(1000000000)
SELECT sum(sin(number) + cos(number) + log(number + 1)) FROM numbers_mt(300000000)
SELECT uniq(number % 50000000), uniqExact(number % 1000000) FROM numbers_mt(500000000)
SELECT quantilesTDigest(0.5, 0.9, 0.99)(number) FROM numbers_mt(500000000)
SELECT count() FROM numbers_mt(200000000) WHERE position(toString(number), '42') > 0
SELECT count() FROM numbers_mt(50000000) AS a INNER JOIN (SELECT number FROM numbers(5000000)) AS b ON a.number = b.number
```

These aren’t meant to mirror any real production workload — they’re a broad, repeatable spread that catches per-operator regressions. If you have your own hot queries, add them to the list.

## Running it

`run` prints a live line per query and drops the full detail into JSON. A run looks like this:

Run Before and After your adjustments. Following output represents after.json

```sql
Server 192.168.105.5:8123  version=25.8.8.26  max_threads=8  iter=20

[ 1] p50=   909.55  p90=   951.30  p99=  1004.18 ms  err=0  | SELECT sum(number), avg(number), max(number), min(numbe...
[ 2] p50=  2187.24  p90=  2301.66  p99=  2410.05 ms  err=0  | SELECT number % 100 AS k, count(), sum(number) FROM num...
[ 3] p50=  2574.20  p90=  2698.71  p99=  2790.44 ms  err=0  | SELECT number % 10000000 AS k, count() FROM numbers_mt(...
[ 4] p50=  1123.97  p90=  1288.02  p99=  1401.55 ms  err=0  | SELECT number FROM numbers_mt(200000000) ORDER BY cityH...
[ 5] p50=  1051.19  p90=  1102.87  p99=  1150.33 ms  err=0  | SELECT sum(cityHash64(number)) FROM numbers_mt(10000000...
[ 6] p50=  5910.33  p90=  6120.88  p99=  6301.42 ms  err=0  | SELECT sum(sin(number) + cos(number) + log(number + 1))...
[ 7] p50=  4322.49  p90=  4501.19  p99=  4650.77 ms  err=0  | SELECT uniq(number % 50000000), uniqExact(number % 1000...
[ 8] p50=  3290.61  p90=  3405.28  p99=  3502.90 ms  err=0  | SELECT quantilesTDigest(0.5, 0.9, 0.99)(number) FROM nu...
[ 9] p50=  1173.57  p90=  1250.44  p99=  1330.18 ms  err=0  | SELECT count() FROM numbers_mt(200000000) WHERE positio...
[10] p50=   565.76  p90=   602.11  p99=   640.85 ms  err=0  | SELECT count() FROM numbers_mt(50000000) AS a INNER JOI...

Written -> after.json
```

Each line is the p50/p90/p99 over the timed iterations, the error count, and a truncated view of the query. The JSON file additionally stores min, max, mean, QPS, run counts, an error sample, and metadata (server version, iteration count, timestamp).

## Comparing before and after

Once you have two JSON files, `compare` lines them up by query id and prints the p50 delta:

```sql
python3 ch_bench.py compare before.json after.json

BEFORE: 25.8.8.26   AFTER: 25.8.8.26
id   before p50    after p50     delta   query
----------------------------------------------------------------------------------
 1    3619.11ms     909.55ms   -74.9%   SELECT sum(number), avg(number), max(number),  ++ faster
 2    1743.09ms    2187.24ms   +25.5%   SELECT number % 100 AS k, count(), sum(number  &lt;-- slower
 3    3151.91ms    2574.20ms   -18.3%   SELECT number % 10000000 AS k, count() FROM n  ++ faster
 4     415.48ms    1123.97ms  +170.5%   SELECT number FROM numbers_mt(200000000) ORDE  &lt;-- slower
 5    1044.27ms    1051.19ms    +0.7%   SELECT sum(cityHash64(number)) FROM numbers_m
 6    8016.92ms    5910.33ms   -26.3%   SELECT sum(sin(number) + cos(number) + log(nu  ++ faster
 7    3191.29ms    4322.49ms   +35.4%   SELECT uniq(number % 50000000), uniqExact(num  &lt;-- slower
 8    3425.65ms    3290.61ms    -3.9%   SELECT quantilesTDigest(0.5, 0.9, 0.99)(numbe
 9    2127.50ms    1173.57ms   -44.8%   SELECT count() FROM numbers_mt(200000000) WHE  ++ faster
10     629.20ms     565.76ms   -10.1%   SELECT count() FROM numbers_mt(50000000) AS a  ++ faster
----------------------------------------------------------------------------------
TOTAL p50: before=27364ms  after=23109ms  change=-15.6%  (overall speedup)
```

Anything within ±5% is treated as noise and left unflagged. Beyond that, a query gets marked `++ faster` or `<-- slower`, and the footer sums the p50s across all queries for a single headline number.

## A word on variance — read the deltas carefully

Here’s the honest part. In the comparison above, **both builds are the same version (25.8.8.26)** — it’s essentially the same server benchmarked twice. And look at the spread: query 1 came out 75% “faster,” query 4 came out 170% “slower,” yet nothing about the engine changed at all.

That’s the whole lesson. On these synthetic `numbers_mt` workloads, run-to-run variance is real, and it’s driven by things outside ClickHouse — CPU frequency scaling, background load, memory pressure, the scheduler, noisy neighbors on a VM. A single query’s delta can swing wildly even with 20 iterations and a warmup.

So a few rules I follow when reading the output:

- **Trust the total more than any single row.** The aggregate p50 across all ten queries (here, −15.6%) averages out a lot of the noise. Individual big swings on one query are usually variance, not signal.
- **Repeat the run.** Run `before` two or three times against the same server first. If query 4 jumps around by ±100% between identical runs, you know its delta means nothing on your box — either raise its iteration count and dataset size, or stop over-reading it.
- **Pin what you can.** Set the CPU governor to `performance`, keep the box otherwise idle, and use the same `--max-threads` and `--iterations` on both sides so the comparison is apples-to-apples.
- **Look for consistent, one-directional shifts.** A real regression from an upgrade tends to show up as the *same* query getting slower across repeated runs — not a one-off spike.

Used that way, the tool does its job: it turns “I think the upgrade is fine” into a number you can point at.

## The full script

Single file, standard library only. Save it as `ch_bench.py` and run it.

```python
#!/usr/bin/env python3
"""
ClickHouse upgrade benchmark (single file, stdlib only).

Usage:
  python3 ch_bench.py run --host 192.168.105.5 --out before.json
  # ... upgrade ...
  python3 ch_bench.py run --host 192.168.105.5 --out after.json
  python3 ch_bench.py compare before.json after.json
"""

import argparse, json, sys, time, re
import urllib.request, urllib.parse, urllib.error
from datetime import datetime, timezone

# ----------------------------------------------------------------------------
# BENCHMARK QUERIES — DO NOT WRITE FORMAT; the script adds 'FORMAT Null' automatically.
# Tune the constants (numbers_mt(...)) up/down to match your hardware: each query
# should take a few seconds.
# ----------------------------------------------------------------------------
QUERIES = [
    "SELECT sum(number), avg(number), max(number), min(number) FROM numbers_mt(2000000000)",
    "SELECT number % 100 AS k, count(), sum(number) FROM numbers_mt(1000000000) GROUP BY k",
    "SELECT number % 10000000 AS k, count() FROM numbers_mt(500000000) GROUP BY k ORDER BY count() DESC LIMIT 100",
    "SELECT number FROM numbers_mt(200000000) ORDER BY cityHash64(number) LIMIT 100",
    "SELECT sum(cityHash64(number)) FROM numbers_mt(1000000000)",
    "SELECT sum(sin(number) + cos(number) + log(number + 1)) FROM numbers_mt(300000000)",
    "SELECT uniq(number % 50000000), uniqExact(number % 1000000) FROM numbers_mt(500000000)",
    "SELECT quantilesTDigest(0.5, 0.9, 0.99)(number) FROM numbers_mt(500000000)",
    "SELECT count() FROM numbers_mt(200000000) WHERE position(toString(number), '42') > 0",
    "SELECT count() FROM numbers_mt(50000000) AS a INNER JOIN (SELECT number FROM numbers(5000000)) AS b ON a.number = b.number",
]

def percentile(vals, p):
    if not vals:
        return None
    if len(vals) == 1:
        return vals[0]
    k = (len(vals) - 1) * p
    lo = int(k); hi = min(lo + 1, len(vals) - 1)
    return vals[lo] + (vals[hi] - vals[lo]) * (k - lo)

def http_query(host, port, sql, user, password, settings, timeout):
    """Returns (duration_ms, body_str, error)."""
    url = f"http://{host}:{port}/?" + urllib.parse.urlencode(settings)
    req = urllib.request.Request(url, data=sql.encode("utf-8"), method="POST")
    if user:
        req.add_header("X-ClickHouse-User", user)
    if password:
        req.add_header("X-ClickHouse-Key", password)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", "replace")
            return (time.perf_counter() - t0) * 1000.0, body, None
    except urllib.error.HTTPError as e:
        return None, "", f"HTTP {e.code}: {e.read().decode('utf-8','replace')[:300].strip()}"
    except Exception as e:
        return None, "", str(e)

def strip_format(sql):
    return re.sub(r"\s+FORMAT\s+\w+\s*;?\s*$", "", sql, flags=re.IGNORECASE).rstrip(";").strip()

def cmd_run(a):
    settings = {"use_query_cache": "0", "max_threads": str(a.max_threads)}
    if a.database:
        settings["database"] = a.database

    # server version (no FORMAT, plain)
    _, ver, _ = http_query(a.host, a.port, "SELECT version()", a.user, a.password, settings, 30)
    ver = ver.strip() or "unknown"
    print(f"Server {a.host}:{a.port}  version={ver}  max_threads={a.max_threads}  iter={a.iterations}\n")

    results = []
    for idx, raw in enumerate(QUERIES, 1):
        sql = strip_format(raw) + " FORMAT Null"
        for _ in range(a.warmup):
            http_query(a.host, a.port, sql, a.user, a.password, settings, a.timeout)

        lat, errors, last_err = [], 0, None
        for _ in range(a.iterations):
            ms, _, err = http_query(a.host, a.port, sql, a.user, a.password, settings, a.timeout)
            if err:
                errors += 1; last_err = err
            else:
                lat.append(ms)
        lat.sort()
        short = (raw[:55] + "...") if len(raw) > 58 else raw

        if lat:
            tot = sum(lat) / 1000.0
            st = {"id": idx, "query": raw, "runs": len(lat), "errors": errors,
                  "min_ms": round(lat[0], 2), "p50_ms": round(percentile(lat, .5), 2),
                  "p90_ms": round(percentile(lat, .9), 2), "p99_ms": round(percentile(lat, .99), 2),
                  "max_ms": round(lat[-1], 2), "mean_ms": round(sum(lat) / len(lat), 2),
                  "qps": round(len(lat) / tot, 2) if tot else None, "error_sample": last_err}
            print(f"[{idx:2}] p50={st['p50_ms']:>9.2f}  p90={st['p90_ms']:>9.2f}  "
                  f"p99={st['p99_ms']:>9.2f} ms  err={errors}  | {short}")
        else:
            st = {"id": idx, "query": raw, "runs": 0, "errors": errors,
                  "p50_ms": None, "p90_ms": None, "p99_ms": None, "error_sample": last_err}
            print(f"[{idx:2}] ERROR ({errors}/{a.iterations}): {last_err}  | {short}")
        results.append(st)

    out = {"meta": {"host": a.host, "port": a.port, "server_version": ver,
                    "iterations": a.iterations, "warmup": a.warmup, "max_threads": a.max_threads,
                    "timestamp_utc": datetime.now(timezone.utc).isoformat()},
           "results": results}
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"\nWritten -> {a.out}")

def cmd_compare(a):
    before = json.load(open(a.before, encoding="utf-8"))
    after = json.load(open(a.after, encoding="utf-8"))
    bmap = {r["id"]: r for r in before["results"]}
    amap = {r["id"]: r for r in after["results"]}
    print(f"BEFORE: {before['meta'].get('server_version','?')}   "
          f"AFTER: {after['meta'].get('server_version','?')}\n")
    print(f"{'id':>2}  {'before p50':>11}  {'after p50':>11}  {'delta':>8}   query")
    print("-" * 82)
    tb = ta = 0.0
    for idx in sorted(set(bmap) | set(amap)):
        bp = bmap.get(idx, {}).get("p50_ms")
        ap = amap.get(idx, {}).get("p50_ms")
        q = (amap.get(idx, {}).get("query") or bmap.get(idx, {}).get("query") or "")[:45]
        if bp and ap:
            d = (ap - bp) / bp * 100.0
            tb += bp; ta += ap
            flag = "  &lt;-- slower" if d > 5 else ("  ++ faster" if d &lt; -5 else "")
            print(f"{idx:>2}  {bp:>9.2f}ms  {ap:>9.2f}ms  {d:>+6.1f}%   {q}{flag}")
        else:
            print(f"{idx:>2}  {str(bp):>11}  {str(ap):>11}  {'n/a':>8}   {q}")
    if tb:
        o = (ta - tb) / tb * 100.0
        print("-" * 82)
        print(f"TOTAL p50: before={tb:.0f}ms  after={ta:.0f}ms  change={o:+.1f}%  "
              f"({'overall slowdown' if o > 0 else 'overall speedup'})")

def main():
    p = argparse.ArgumentParser(description="ClickHouse upgrade benchmark (single file, stdlib).")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="Run benchmark, write JSON.")
    r.add_argument("--host", default="localhost")
    r.add_argument("--port", type=int, default=8123)
    r.add_argument("--out", required=True)
    r.add_argument("--iterations", type=int, default=20)
    r.add_argument("--warmup", type=int, default=1)
    r.add_argument("--max-threads", type=int, default=8, dest="max_threads")
    r.add_argument("--timeout", type=int, default=600)
    r.add_argument("--user", default=None)
    r.add_argument("--password", default=None)
    r.add_argument("--database", default=None)
    r.set_defaults(func=cmd_run)
    c = sub.add_parser("compare", help="Compare two JSON results.")
    c.add_argument("before"); c.add_argument("after")
    c.set_defaults(func=cmd_compare)
    a = p.parse_args()
    a.func(a)

if __name__ == "__main__":
    main()
```

## Options worth knowing

The `run` command takes a handful of flags:

- `--iterations` (default 20) — timed runs per query. More runs, smoother percentiles.
- `--warmup` (default 1) — untimed runs before timing starts.
- `--max-threads` (default 8) — passed straight to ClickHouse; keep it identical across before/after.
- `--timeout` (default 600) — per-request timeout in seconds.
- `--user` / `--password` — sent as `X-ClickHouse-User` / `X-ClickHouse-Key` headers.
- `--database` — optional default database.

That’s the whole tool. It won’t replace a real, dataset-driven load test, but for the specific question “is this upgrade safe to roll out?” it’s a fast, honest, dependency-free first answer.
