---
title: "Kubernetes CPU Alert Not Firing - Complete Troubleshooting Guide"
description: "Learn why your Kubernetes CPU alerts might not be firing and how to fix common Prometheus alerting issues in production environments."
date: "2026-01-31"
lastModified: "2026-01-31"
author: "DevOps Duoo"
category: "kubernetes"
tags:
  - "kubernetes"
  - "prometheus"
  - "alerting"
  - "monitoring"
  - "troubleshooting"
readTime: 8
featured: true
draft: false
seo:
  title: "Kubernetes CPU Alert Not Firing - Complete Troubleshooting Guide | DevOps Duoo"
  description: "Learn why your Kubernetes CPU alerts might not be firing and how to fix common Prometheus alerting issues in production environments."
  keywords: "kubernetes cpu alert not firing, prometheus alerting, kubernetes monitoring, cpu throttling, alertmanager troubleshooting"
  canonical: "/blog/kubernetes-cpu-alert-not-firing-complete-troubleshooting"
---

## TL;DR

- **Check if metrics exist**: Run `container_cpu_usage_seconds_total` query in Prometheus
- **Verify alert rules are loaded**: Check Prometheus `/rules` endpoint
- **Confirm Alertmanager is connected**: Look for `alertmanager_notifications_total` metric
- **Test with lower thresholds**: Temporarily reduce thresholds to verify the pipeline works

## The Problem

You've set up CPU alerts in your Kubernetes cluster, but they're not firing even when pods are clearly under heavy load. This is one of the most frustrating monitoring issues because everything *looks* correct, but the alerts never trigger.

## Common Causes and Fixes

### 1. Metrics Are Not Being Collected

First, verify that CPU metrics are actually being scraped:

```promql
container_cpu_usage_seconds_total{namespace="your-namespace"}

up{job="kubelet"}
```

If you see no data, the issue is at the collection layer:

- **ServiceMonitor not matching**: Check labels match your Prometheus operator config
- **Kubelet metrics disabled**: Ensure `--read-only-port` is enabled or use authenticated scraping
- **Network policies blocking**: Prometheus needs access to kubelet metrics endpoint

### 2. Alert Expression Is Wrong

The most common mistake is using instantaneous values instead of rates:

```yaml
expr: container_cpu_usage_seconds_total > 0.8

expr: |
  sum(rate(container_cpu_usage_seconds_total{container!=""}[5m])) by (pod, namespace)
  /
  sum(kube_pod_container_resource_limits{resource="cpu"}) by (pod, namespace)
  > 0.8
```

### 3. Alert Is Pending But Not Firing

Alerts have a `for` duration that must be exceeded:

```yaml
alert: HighCPUUsage
expr: ...
for: 5m  # Alert must be true for 5 minutes continuously
```

Check the Prometheus Alerts page - if your alert shows "Pending" but never "Firing", the condition is flapping (going above and below threshold).

**Fix**: Either extend the evaluation window or adjust the threshold.

### 4. Alertmanager Configuration Issues

Even if Prometheus fires alerts, Alertmanager might not route them:

```bash
curl -s http://alertmanager:9093/api/v2/alerts | jq .

amtool config show --alertmanager.url=http://alertmanager:9093
```

Common issues:
- **Inhibit rules**: Another alert might be suppressing yours
- **Route mismatch**: Labels don't match any route
- **Silences active**: Check for active silences

## Complete Working Example

Here's a production-tested CPU alert that works:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cpu-alerts
  namespace: monitoring
spec:
  groups:
    - name: cpu.rules
      interval: 30s
      rules:
        - alert: HighPodCPUUsage
          expr: |
            (
              sum(rate(container_cpu_usage_seconds_total{container!="", container!="POD"}[5m])) by (pod, namespace)
              /
              sum(kube_pod_container_resource_limits{resource="cpu", unit="core"}) by (pod, namespace)
            ) * 100 > 80
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} CPU usage is above 80%"
            description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has been using more than 80% of its CPU limit for 5 minutes."
            runbook_url: "https://devopsduoo.com/runbooks/high-cpu"
```

## Debugging Checklist

Run through this checklist when alerts aren't firing:

1. **✅ Metrics exist**: Query raw metrics in Prometheus UI
2. **✅ Alert rule loaded**: Check `/api/v1/rules` endpoint
3. **✅ Expression evaluates**: Test the exact expression manually
4. **✅ Threshold is realistic**: Ensure pods actually exceed the threshold
5. **✅ Duration met**: Wait for the `for` duration to pass
6. **✅ Alertmanager connected**: Check Prometheus targets for Alertmanager
7. **✅ Route matches**: Verify alert labels match Alertmanager routes
8. **✅ No silences**: Check Alertmanager for active silences

## Key Takeaways

- Always use `rate()` with counter metrics like CPU usage
- Test alerts with artificially low thresholds first
- Check both Prometheus AND Alertmanager for issues
- Use the Prometheus UI to validate expressions before deploying
- Monitor `prometheus_notifications_failed_total` for delivery issues

## Next Steps

If you're still having issues, consider:

- Setting up recording rules for complex expressions
- Implementing alert testing with `promtool`
- Adding dead man's switch alerts to catch silent failures

---

*Have questions? Reach out to us at [contact@devopsduoo.com](mailto:contact@devopsduoo.com) or connect on LinkedIn.*
