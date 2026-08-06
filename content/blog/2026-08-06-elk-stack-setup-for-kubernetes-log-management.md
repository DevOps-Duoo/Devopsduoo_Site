---
title: "ELK Stack Setup for Kubernetes Log Management"
description: "Kubernetes clusters generate a massive amount of log data from various sources, including containers, pods, and nodes. Managing and analyzing these logs..."
date: "2026-08-06"
lastModified: "2026-08-06"
author: "DevOps Duoo"
category: "monitoring"
tags:
  - "elk stack kubernetes logging"
  - "elasticsearch kubernetes"
  - "fluentd logging"
  - "kibana dashboards"
  - "centralized logging"
readTime: 4
featured: false
draft: false
seo:
  title: "ELK Stack Setup for Kubernetes Log Management | DevOps Duoo"
  description: "Kubernetes clusters generate a massive amount of log data from various sources, including containers, pods, and nodes. Managing and analyzing these logs..."
  keywords: "elk stack kubernetes logging, elasticsearch kubernetes, fluentd logging, kibana dashboards, centralized logging"
  canonical: "/blog/elk-stack-setup-for-kubernetes-log-management"
---

# ELK Stack Setup for Kubernetes Log Management
## TL;DR
* Set up a centralized logging system using the ELK Stack (Elasticsearch, Logstash, Kibana) for Kubernetes log management
* Use Fluentd as a log collector and forwarder to send logs to Elasticsearch
* Configure Kibana dashboards to visualize and analyze logs for improved monitoring and troubleshooting

## The Problem
Kubernetes clusters generate a massive amount of log data from various sources, including containers, pods, and nodes. Managing and analyzing these logs is crucial for monitoring cluster health, detecting issues, and ensuring security. However, the sheer volume and complexity of log data can make it challenging to manage and analyze. This is where the ELK Stack comes in – a popular and powerful logging solution that can help you centralize, process, and visualize your Kubernetes log data.

## Setting Up the ELK Stack
To set up the ELK Stack for Kubernetes log management, you'll need to install and configure the following components:
### Elasticsearch
Elasticsearch is the core component of the ELK Stack, responsible for storing and indexing log data. You can deploy Elasticsearch as a StatefulSet in your Kubernetes cluster using the following YAML configuration:
```yml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:7.10.2
        ports:
        - containerPort: 9200
        volumeMounts:
        - name: elastic-data
          mountPath: /usr/share/elasticsearch/data
  volumeClaimTemplates:
  - metadata:
      name: elastic-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```
Apply this configuration using the following command:
```bash
kubectl apply -f elasticsearch.yaml
```
### Fluentd
Fluentd is a log collector and forwarder that will send logs from your Kubernetes cluster to Elasticsearch. You can deploy Fluentd as a DaemonSet in your cluster using the following YAML configuration:
```yml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        volumeMounts:
        - name: logs
          mountPath: /var/log
        - name: fluentd-config
          mountPath: /etc/fluentd
      volumes:
      - name: logs
        hostPath:
          path: /var/log
      - name: fluentd-config
        configMap:
          name: fluentd-config
```
Apply this configuration using the following command:
```bash
kubectl apply -f fluentd.yaml
```
### Kibana
Kibana is a visualization tool that will help you explore and analyze your log data. You can deploy Kibana as a Deployment in your cluster using the following YAML configuration:
```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kibana
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kibana
  template:
    metadata:
      labels:
        app: kibana
    spec:
      containers:
      - name: kibana
        image: docker.elastic.co/kibana/kibana:7.10.2
        ports:
        - containerPort: 5601
```
Apply this configuration using the following command:
```bash
kubectl apply -f kibana.yaml
```
## Configuring Kibana Dashboards
Once you have the ELK Stack up and running, you can configure Kibana dashboards to visualize and analyze your log data. You can access the Kibana dashboard by exposing the Kibana service using a Service and an Ingress resource:
```yml
apiVersion: v1
kind: Service
metadata:
  name: kibana
spec:
  selector:
    app: kibana
  ports:
  - name: http
    port: 80
    targetPort: 5601
  type: ClusterIP
```

```yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kibana
spec:
  rules:
  - host: kibana.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kibana
            port:
              number: 80
```
Apply these configurations using the following commands:
```bash
kubectl apply -f kibana-service.yaml
kubectl apply -f kibana-ingress.yaml
```
## Common Mistakes
When setting up the ELK Stack for Kubernetes log management, there are several common mistakes to watch out for:
* Insufficient resources: Make sure to allocate sufficient resources (CPU, memory, storage) to the ELK Stack components to ensure smooth operation.
* Incorrect configuration: Double-check the configurations for Elasticsearch, Fluentd, and Kibana to ensure they are correct and consistent.
* Security implications: Be aware of the security implications of exposing the ELK Stack components to the outside world and take necessary measures to secure them, such as using authentication and authorization.

For more information on securing the ELK Stack, see <!-- TODO: Add internal link to: securing-elk-stack -->.

## Key Takeaways
* The ELK Stack is a powerful logging solution for Kubernetes log management
* Fluentd is a popular log collector and forwarder for sending logs to Elasticsearch
* Kibana dashboards provide a user-friendly interface for visualizing and analyzing log data
* Insufficient resources, incorrect configuration, and security implications are common mistakes to watch out for when setting up the ELK Stack
* For more information on related topics, see <!-- TODO: Add internal link to: kubernetes-logging --> and <!-- TODO: Add internal link to: elk-stack-monitoring -->