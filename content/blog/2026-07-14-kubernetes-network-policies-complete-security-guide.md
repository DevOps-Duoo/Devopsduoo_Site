---
title: "Kubernetes Network Policies - Complete Security Guide"
description: "A complete guide to Kubernetes Network Policies for securing your cluster. Learn how to implement ingress and egress rules, restrict pod-to-pod communication, and enforce zero-trust networking in production environments."
date: "2026-07-14"
lastModified: "2026-07-14"
author: "DevOps Duoo"
category: "security"
tags:
  - "kubernetes network policies"
  - "pod network security"
  - "calico network policy"
  - "cilium network policy"
  - "zero trust kubernetes"
readTime: 4
featured: false
draft: false
seo:
  title: "Kubernetes Network Policies - Complete Security Guide | DevOps Duoo"
  description: "Complete guide to Kubernetes Network Policies. Learn to implement ingress and egress rules, restrict pod communication, and enforce zero-trust networking in production."
  keywords: "kubernetes network policies, pod network security, calico network policy, cilium network policy, zero trust kubernetes"
  canonical: "/blog/kubernetes-network-policies-complete-security-guide"
---

## What You'll Learn

Kubernetes network policies are a crucial component of securing your cluster. In this guide, you'll learn how to implement network policies to restrict pod-to-pod communication, allow incoming traffic, and enforce a zero-trust security model. We'll cover the basics of network policies, provide step-by-step instructions for implementation, and discuss common mistakes to avoid.

## Understanding Network Policies

Kubernetes network policies are used to control traffic flow between pods. By default, pods can communicate with each other without restrictions. Network policies allow you to define rules for incoming and outgoing traffic, ensuring that only authorized pods can communicate with each other.

### Network Policy Components

A network policy consists of the following components:

* `podSelector`: specifies the pods to which the policy applies

* `ingress`: defines the incoming traffic rules

* `egress`: defines the outgoing traffic rules

### Example Network Policy

Here's an example network policy that allows incoming traffic from pods with the label `app: frontend`:
```yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-traffic
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - 80
```
This policy applies to pods with the label `app: backend` and allows incoming traffic on port 80 from pods with the label `app: frontend`.

## Implementing Network Policies with Calico

Calico is a popular network policy tool for Kubernetes. To implement network policies with Calico, follow these steps:

1. Install Calico (v3.20.2) using the following command:
```bash
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.20.2/manifests/calico.yaml
```
2. Create a network policy using the following command:
```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-traffic
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - 80
EOF
```
3. Verify the network policy using the following command:
```bash
kubectl get networkpolicy allow-frontend-traffic -o yaml
```

## Implementing Network Policies with Cilium

Cilium is another popular network policy tool for Kubernetes. To implement network policies with Cilium, follow these steps:

1. Install Cilium (v1.11.5) using the following command:
```bash
kubectl apply -f https://raw.githubusercontent.com/cilium/cilium/v1.11.5/install/kubernetes/quick-install.yaml
```
2. Create a network policy using the following command:
```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-traffic
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - 80
EOF
```
3. Verify the network policy using the following command:
```bash
kubectl get networkpolicy allow-frontend-traffic -o yaml
```

## Common Mistakes and Troubleshooting

When implementing network policies, be aware of the following common mistakes:

* **Insufficient pod selectors**: Make sure to specify the correct pod selectors to avoid applying the policy to the wrong pods.

* **Incorrect port numbers**: Double-check the port numbers to ensure that the policy allows traffic on the correct ports.

* **Policy ordering**: Be aware of the policy ordering, as policies are evaluated in a specific order.

To troubleshoot network policy issues, use the following commands:

* `kubectl get networkpolicy` to list all network policies

* `kubectl describe networkpolicy` to describe a specific network policy

* `kubectl logs` to check the logs of the Calico or Cilium pods

For more information on troubleshooting network policy issues.

## Key Takeaways

* Implement Kubernetes network policies to secure pod-to-pod communication and enforce a zero-trust security model.

* Use network policy tools like Calico (v3.20.2) or Cilium (v1.11.5) to define and enforce network policies.

* Follow best practices to avoid common mistakes and ensure optimal performance.

* Use the `kubectl` command to create, verify, and troubleshoot network policies.

* For more information on Kubernetes network policies, see and.