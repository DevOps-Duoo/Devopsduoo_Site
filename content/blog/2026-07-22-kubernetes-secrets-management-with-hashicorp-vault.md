---
title: "Kubernetes Secrets Management with HashiCorp Vault"
description: "Kubernetes secrets management is a critical aspect of deploying and managing applications in production environments. As DevOps engineers, we need to en..."
date: "2026-07-22"
lastModified: "2026-07-22"
author: "DevOps Duoo"
category: "security"
tags:
  - "kubernetes secrets vault"
  - "hashicorp vault kubernetes"
  - "secret injection"
  - "vault agent"
  - "external secrets operator"
readTime: 4
featured: false
draft: false
seo:
  title: "Kubernetes Secrets Management with HashiCorp Vault | DevOps Duoo"
  description: "Kubernetes secrets management is a critical aspect of deploying and managing applications in production environments. As DevOps engineers, we need to en..."
  keywords: "kubernetes secrets vault, hashicorp vault kubernetes, secret injection, vault agent, external secrets operator"
  canonical: "/blog/kubernetes-secrets-management-with-hashicorp-vault"
---

# Kubernetes Secrets Management with HashiCorp Vault
## TL;DR
* Learn how to integrate HashiCorp Vault with Kubernetes for secure secrets management
* Discover how to use the Vault Agent and External Secrets Operator for secret injection
* Implement a production-ready secrets management solution using Kubernetes and Vault

## The Problem
Kubernetes secrets management is a critical aspect of deploying and managing applications in production environments. As DevOps engineers, we need to ensure that sensitive data such as API keys, database credentials, and certificates are handled securely and efficiently. However, managing secrets in Kubernetes can be challenging, especially in large-scale deployments. This is where HashiCorp Vault comes in – a popular secrets management tool that can be integrated with Kubernetes to provide a robust and scalable solution.

## Integrating HashiCorp Vault with Kubernetes
To integrate HashiCorp Vault with Kubernetes, we'll use the Vault Agent and the External Secrets Operator. The Vault Agent is a lightweight, standalone binary that can be used to authenticate with Vault and retrieve secrets. The External Secrets Operator is a Kubernetes operator that allows us to manage external secrets, including those stored in Vault.

### Installing the External Secrets Operator
First, we need to install the External Secrets Operator in our Kubernetes cluster. We can do this using the following command:
```bash
# Install the External Secrets Operator
kubectl apply -f https://github.com/external-secrets/external-secrets/releases/latest/download/install.yaml
```
This command installs the External Secrets Operator in our cluster, which will allow us to manage external secrets.

### Configuring the Vault Agent
Next, we need to configure the Vault Agent to authenticate with our Vault instance. We can do this by creating a `vault-agent-config` file with the following contents:
```yml
# vault-agent-config.yml
vault:
  address: "https://vault.example.com"
  auth:
    auth_url: "/v1/auth/kubernetes/login"
    client_token: "s.vault-token"
    kubernetes:
      mount_path: "kubernetes"
      service_account_jwt: "/var/run/secrets/kubernetes.io/serviceaccount/token"
      role: "example-role"
```
This configuration file tells the Vault Agent to authenticate with our Vault instance using the Kubernetes authentication backend.

### Creating a SecretStore
Now that we have the External Secrets Operator installed and the Vault Agent configured, we can create a `SecretStore` object to manage our external secrets. We can do this using the following YAML file:
```yml
# secretstore.yml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-secret-store
spec:
  provider:
    vault:
      auth:
        kubernetes:
          mount_path: "kubernetes"
          role: "example-role"
          service_account_jwt: "/var/run/secrets/kubernetes.io/serviceaccount/token"
      url: "https://vault.example.com"
```
This `SecretStore` object tells the External Secrets Operator to use our Vault instance as the external secrets store.

## Using the External Secrets Operator
Now that we have our `SecretStore` object created, we can use the External Secrets Operator to inject secrets into our Kubernetes pods. We can do this by creating a `Secret` object that references our `SecretStore` object. For example:
```yml
# secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: example-secret
type: Opaque
stringData:
  foo: ${vault kv get -mount=secret/data/example/secret foo}
```
This `Secret` object tells the External Secrets Operator to inject the `foo` secret from our Vault instance into our Kubernetes pod.

## Common Mistakes
When using the External Secrets Operator and Vault Agent, there are several common mistakes to watch out for:

* **Incorrect authentication configuration**: Make sure that your Vault Agent configuration file is correct and that you have the correct authentication settings.
* **Insufficient permissions**: Ensure that your Kubernetes service account has the necessary permissions to authenticate with Vault and retrieve secrets.
* **Incorrect secretstore configuration**: Double-check that your `SecretStore` object is configured correctly and that you have the correct Vault instance URL and authentication settings.

## Troubleshooting
If you encounter issues with the External Secrets Operator or Vault Agent, here are some troubleshooting steps you can take:

* **Check the External Secrets Operator logs**: Run `kubectl logs -f <external-secrets-operator-pod>` to check the operator logs for any errors.
* **Check the Vault Agent logs**: Run `kubectl logs -f <vault-agent-pod>` to check the Vault Agent logs for any errors.
* **Verify Vault authentication**: Use the `vault kv get` command to verify that you can authenticate with Vault and retrieve secrets.

## Key Takeaways
* Integrate HashiCorp Vault with Kubernetes using the Vault Agent and External Secrets Operator for secure secrets management
* Use the External Secrets Operator to inject secrets into your Kubernetes pods
* Configure the Vault Agent to authenticate with your Vault instance using the Kubernetes authentication backend
* <!-- TODO: Add internal link to: related-topic --> Learn more about Kubernetes secrets management and best practices for securing your applications
* <!-- TODO: Add internal link to: related-topic --> Discover how to use other secrets management tools, such as AWS Secrets Manager and Google Cloud Secret Manager, with Kubernetes
* Use production-tested configurations and consider performance and security implications when implementing secrets management solutions in your Kubernetes environment