terraform {
  required_version = ">= 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.10"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "gcs" {
    bucket = "integreat-prod-tf-state"
    prefix = "envs/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" { default = "integreat-prod" }
variable "region" { default = "europe-west1" }
variable "github_owner" { default = "evanmse" }
variable "github_repo" { default = "integreat" }

locals {
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
    "munichre_api_key",
    "hiscox_api_key",
    "axaxl_api_key",
  ]
}

module "bootstrap" {
  source = "../../modules/bootstrap"

  project_id   = var.project_id
  region       = var.region
  env          = "prod"
  github_owner = var.github_owner
  github_repo  = var.github_repo

  secret_ids = local.secret_ids
}

module "network" {
  source = "../../modules/network"

  project_id = var.project_id
  region     = var.region
  env        = "prod"

  depends_on = [module.bootstrap]
}

module "data" {
  source = "../../modules/data"

  project_id     = var.project_id
  region         = var.region
  env            = "prod"
  vpc_id         = module.network.vpc_id
  psa_dependency = module.network.psa_connection

  cloudsql_tier                = "db-custom-2-7680"
  cloudsql_availability_type   = "REGIONAL"
  cloudsql_deletion_protection = true

  # Vector Search en prod : opt-in manuel pour éviter ~150€/mois sans usage.
  enable_vector_search = false

  redis_tier           = "STANDARD_HA"
  redis_memory_size_gb = 1

  depends_on = [module.bootstrap]
}

# NOTE: pas de module pipeline-risk en prod (réservé dev pour le hackathon).

output "artifact_registry_repo" { value = module.bootstrap.artifact_registry_repo }
output "wif_provider" { value = module.bootstrap.wif_provider }
output "deployer_service_account_email" { value = module.bootstrap.deployer_service_account_email }
output "vpc_name" { value = module.network.vpc_name }
output "vpc_connector" { value = module.network.connector_name }
output "sandbox_subnet_id" { value = module.network.sandbox_subnet_id }
output "sandbox_connector_name" { value = module.network.sandbox_connector_name }
output "cloudsql_connection_name" { value = module.data.cloudsql_instance_connection_name }
output "cloudsql_private_ip" { value = module.data.cloudsql_private_ip }
output "bucket_raw_risk" { value = module.data.bucket_raw_risk }
output "bucket_exports" { value = module.data.bucket_exports }
output "bucket_sandbox_images" { value = module.data.bucket_sandbox_images }
output "bigquery_audit_table" { value = module.data.bigquery_audit_table }
output "bigquery_sandbox_metrics_table" { value = module.data.bigquery_sandbox_metrics_table }
output "bigquery_trust_scores_table" { value = module.data.bigquery_trust_scores_table }
output "redis_host" { value = module.data.redis_host }
output "redis_port" { value = module.data.redis_port }
