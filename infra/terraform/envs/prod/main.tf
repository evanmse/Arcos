terraform {
  required_version = ">= 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.10"
    }
  }

  backend "gcs" {
    bucket = "arcos-prod-tf-state"
    prefix = "envs/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" { default = "arcos-prod" }
variable "region" { default = "europe-west1" }
variable "github_owner" { default = "evanmse" }
variable "github_repo" { default = "arcos" }

module "bootstrap" {
  source = "../../modules/bootstrap"

  project_id   = var.project_id
  region       = var.region
  env          = "prod"
  github_owner = var.github_owner
  github_repo  = var.github_repo

  secret_ids = [
    "anthropic_api_key",
    "neo4j_uri",
    "neo4j_password",
    "clerk_secret",
    "langfuse_public_key",
    "langfuse_secret_key",
    "oauth_jira",
    "oauth_google",
    "oauth_microsoft",
    "oauth_github",
    "oauth_slack",
  ]
}

output "artifact_registry_repo" {
  value = module.bootstrap.artifact_registry_repo
}

output "wif_provider" {
  value = module.bootstrap.wif_provider
}

output "deployer_service_account_email" {
  value = module.bootstrap.deployer_service_account_email
}
