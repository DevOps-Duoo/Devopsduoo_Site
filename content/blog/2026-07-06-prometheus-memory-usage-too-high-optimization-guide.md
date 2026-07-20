---
title: "Prometheus Memory Usage Too High - Optimization Guide"
description: "High Prometheus memory usage can lead to performance issues and crashes in production. This guide covers the root causes, including high-cardinality metrics and long retention periods, and provides actionable steps to reduce memory consumption."
date: "2026-07-06"
lastModified: "2026-07-06"
author: "DevOps Duoo"
category: "monitoring"
tags:
  - "prometheus memory usage optimization"
  - "prometheus cardinality"
  - "metric retention"
  - "prometheus federation"
  - "thanos"
readTime: 4
featured: false
draft: false
seo:
  title: "Prometheus Memory Usage Too High - Optimization Guide | DevOps Duoo"
  description: "Learn how to diagnose and fix high Prometheus memory usage. Covers cardinality reduction, metric retention policies, Thanos integration, and federation."
  keywords: "prometheus memory usage optimization, prometheus cardinality, metric retention, prometheus federation, thanos"
  canonical: "/blog/prometheus-memory-usage-too-high-optimization-guide"
---

## TL;DR

- Identify and eliminate high-cardinality metrics to reduce Prometheus memory usage.
- Implement metric retention policies and use Thanos for long-term storage to keep Prometheus lean.
- Monitor Prometheus memory usage proactively to prevent performance issues and crashes.

## The Problem

Prometheus is a popular monitoring system used in production environments, but high memory usage can lead to performance degradation and even out-of-memory crashes. Understanding why Prometheus uses so much memory — and knowing what to do about it — is a critical skill for any DevOps engineer.

## Understanding Prometheus Memory Usage

Prometheus memory usage is primarily driven by the number of time series it stores in memory. A time series is a uniquely identified sequence of data points, and each one requires memory to store. The main contributing factors are:

- **High-cardinality metrics**: Metrics with a large number of unique label combinations (e.g., per-request or per-user labels) generate an enormous number of time series.
- **Long retention periods**: Storing metrics for extended periods means more data in memory and more data on disk.
- **Inefficient scraping**: Scraping targets too frequently, or scraping metrics you do not actually use, increases both memory and storage consumption.

## Optimizing High-Cardinality Metrics

High-cardinality metrics are the most common cause of excessive Prometheus memory usage. The fix is to reduce the number of unique label combinations.

You can drop or rewrite labels using `metric_relabel_configs` in your Prometheus configuration:

```yaml
scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['localhost:8080']
    metric_relabel_configs:
      # Drop a high-cardinality label we do not need
      - source_labels: [request_id]
        action: labeldrop
      # Drop entire metrics we are not using
      - source_labels: [__name__]
        regex: 'go_gc_.*'
        action: drop
```

Use the Prometheus UI (`/tsdb-status`) to identify your top cardinality contributors before making changes.

## Implementing Metric Retention Policies

Reducing how long Prometheus retains data is one of the simplest ways to lower memory and disk usage. You can set the retention period using the `--storage.tsdb.retention.time` flag when starting Prometheus:

```yaml
args:
  - '--storage.tsdb.retention.time=15d'
  - '--storage.tsdb.retention.size=10GB'
```

For most teams, 15 days of local retention is sufficient when combined with a long-term storage solution like Thanos or Grafana Mimir.

## Using Thanos for Long-Term Storage

Thanos is a highly available, long-term storage system for Prometheus metrics. It extends Prometheus by adding durable object storage (e.g., AWS S3, GCS), global query views, and compaction — without requiring you to keep all your data in Prometheus memory.

Start by deploying the Thanos sidecar alongside your Prometheus instance:

```bash
thanos sidecar   --prometheus.url=http://localhost:9090   --objstore.config-file=/etc/thanos/objstore.yaml   --tsdb.path=/prometheus
```

Then configure your object store (e.g., S3):

```yaml
type: S3
config:
  bucket: my-prometheus-metrics
  endpoint: s3.amazonaws.com
  region: us-east-1
  access_key: YOUR_ACCESS_KEY
  secret_key: YOUR_SECRET_KEY
```

With Thanos in place, you can reduce Prometheus local retention to just a few hours while retaining years of queryable history in object storage.

## Configuring Prometheus Federation

Prometheus federation lets multiple Prometheus servers scrape each other's metrics. This can help scale your monitoring setup by distributing the scraping load across several Prometheus instances, with a top-level Prometheus aggregating only the high-level summary metrics:

```yaml
scrape_configs:
  - job_name: 'federate'
    scrape_interval: 15s
    honor_labels: true
    metrics_path: '/federate'
    params:
      match[]:
        - '{job="prometheus"}' # Only federate the metrics you need
        - 'up'
    static_configs:
      - targets:
          - 'prometheus-us-east-1:9090'
          - 'prometheus-eu-west-1:9090'
```

## Common Mistakes

When optimizing Prometheus memory usage, avoid these common pitfalls:

- **Not monitoring Prometheus itself**: Use `prometheus_tsdb_head_series` to track how many active time series Prometheus is storing. Set an alert if this number grows unexpectedly.
- **Using high-cardinality labels**: Labels like `user_id`, `session_id`, or `request_id` can create millions of time series. Never add these to metrics.
- **Keeping retention too long without offloading**: If you need long-term data, use Thanos or Grafana Mimir rather than extending local Prometheus retention.

## Troubleshooting

When investigating high Prometheus memory usage, start here:

- Check `/tsdb-status` in the Prometheus UI to see which metrics and labels contribute the most series.
- Query `topk(10, count by (__name__)({__name__=~".+"}))" to find your top 10 metric cardinality contributors.
- Check the Prometheus logs for WAL-related errors, which can indicate storage pressure.
- Review your `metric_relabel_configs` and `relabel_configs` to ensure unnecessary metrics and labels are being dropped at scrape time.

## Key Takeaways

- Identify and eliminate high-cardinality labels and metrics — they are the primary driver of Prometheus memory usage.
- Implement retention limits using `--storage.tsdb.retention.time` and `--storage.tsdb.retention.size`.
- Use Thanos or Grafana Mimir for long-term storage so you can keep local Prometheus retention short.
- Use Prometheus federation to distribute scraping load at scale.
- Monitor Prometheus itself with `prometheus_tsdb_head_series` and set alerts to catch cardinality explosions early.
