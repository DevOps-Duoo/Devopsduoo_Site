---
title: "Prometheus Memory Usage Too High - Optimization Guide"
description: "Prometheus is a popular monitoring system used in production environments, but high memory usage can lead to performance issues and even crashes. In thi..."
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
  description: "Prometheus is a popular monitoring system used in production environments, but high memory usage can lead to performance issues and even crashes. In thi..."
  keywords: "prometheus memory usage optimization, prometheus cardinality, metric retention, prometheus federation, thanos"
  canonical: "/blog/prometheus-memory-usage-too-high-optimization-guide"
---

# Prometheus Memory Usage Too High - Optimization Guide
## TL;DR
* Identify and optimize high-cardinality metrics to reduce memory usage in Prometheus
* Implement metric retention policies and use Thanos for long-term storage
* Monitor Prometheus memory usage and adjust configurations as needed to prevent performance issues

## The Problem
Prometheus is a popular monitoring system used in production environments, but high memory usage can lead to performance issues and even crashes. In this guide, we'll cover the common causes of high memory usage in Prometheus and provide step-by-step instructions on how to optimize it.

## Understanding Prometheus Memory Usage
Prometheus memory usage is primarily driven by the number of time series it stores. A time series is a sequence of data points measured at regular intervals, and each time series requires a certain amount of memory to store. The main factors that contribute to high memory usage in Prometheus are:

* High-cardinality metrics: Metrics with a large number of unique label combinations can lead to a high number of time series, increasing memory usage.
* Long metric retention periods: Storing metrics for extended periods can lead to a large amount of data being stored in memory.
* Inefficient scraping configurations: Scraping too frequently or scraping unnecessary metrics can lead to increased memory usage.

## Optimizing High-Cardinality Metrics
High-cardinality metrics can be optimized by reducing the number of unique label combinations. One way to do this is by using the `label_replace` function to remove unnecessary labels.

```promql
# Remove the 'instance' label from the 'http_requests_total' metric
label_replace(http_requests_total, "instance", "", ".*")
```

This can be done in the Prometheus configuration file using the `metric_relabel_configs` section.

```yml
# prometheus.yml
metric_relabel_configs:
  - source_labels: [instance]
    regex: '.*'
    target_label: instance
    replacement: ''
    action: replace
```

## Implementing Metric Retention Policies
Implementing metric retention policies can help reduce memory usage by limiting the amount of data stored. Prometheus provides a `retention` configuration option that can be used to set the retention period for metrics.

```yml
# prometheus.yml
retention:
  30d
```

This will store metrics for 30 days. It's also possible to use Thanos for long-term storage, which can help reduce memory usage in Prometheus.

## Using Thanos for Long-Term Storage
Thanos is a highly scalable, object storage-based metric system that can be used to store metrics long-term. It provides a `store` component that can be used to store metrics, and a `query` component that can be used to query metrics.

```bash
# Start the Thanos store component
thanos store --data-dir=/path/to/data --objstore.config-file=/path/to/config.yaml
```

The `objstore.config-file` option specifies the configuration file for the object store. The configuration file should contain the following:

```yml
# config.yaml
type: S3
config:
  bucket: my-bucket
  endpoint: s3.amazonaws.com
  access_key: my-access-key
  secret_key: my-secret-key
```

## Configuring Prometheus to Use Thanos
To configure Prometheus to use Thanos, you need to add the `thanos` section to the Prometheus configuration file.

```yml
# prometheus.yml
thanos:
  store:
    url: http://thanos-store:10901
```

This will configure Prometheus to send metrics to the Thanos store component.

## Configuring Prometheus Federation
Prometheus federation allows multiple Prometheus servers to be configured to scrape metrics from each other. This can help reduce memory usage by distributing the metrics across multiple servers.

```yml
# prometheus.yml
federation:
  - name: my-federation
    url: http://prometheus1:9090
    honor_labels: true
```

This will configure Prometheus to scrape metrics from the `prometheus1` server.

## Common Mistakes
When optimizing Prometheus memory usage, there are several common mistakes to watch out for:

* Not monitoring memory usage: Failing to monitor memory usage can lead to performance issues and crashes.
* Not optimizing high-cardinality metrics: Failing to optimize high-cardinality metrics can lead to high memory usage.
* Not implementing metric retention policies: Failing to implement metric retention policies can lead to high memory usage.

To monitor memory usage, you can use the `prometheus_memory_usage` metric, which is available in Prometheus 2.26.0 and later.

```promql
# Query the prometheus_memory_usage metric
prometheus_memory_usage
```

## Troubleshooting
When troubleshooting Prometheus memory usage issues, there are several things to check:

* Check the Prometheus configuration file for any misconfigurations.
* Check the metric retention policies to ensure they are set correctly.
* Check the Thanos configuration to ensure it is set up correctly.
* Check the Prometheus logs for any error messages.

For more information on troubleshooting Prometheus, see <!-- TODO: Add internal link to: prometheus-troubleshooting -->.

## Key Takeaways
* Identify and optimize high-cardinality metrics to reduce memory usage in Prometheus.
* Implement metric retention policies and use Thanos for long-term storage.
* Monitor Prometheus memory usage and adjust configurations as needed to prevent performance issues.
* Use Prometheus federation to distribute metrics across multiple servers and reduce memory usage.
* Regularly check the Prometheus configuration file, metric retention policies, and Thanos configuration to ensure they are set up correctly.