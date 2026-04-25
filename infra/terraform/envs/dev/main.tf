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
    bucket = "integreat-dev-tf-state"
    prefix = "envs/dev"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" { default = "integreat-dev" }
variable "region" { default = "europe-west1" }
variable "github_owner" { default = "evanmse" }
variable "github_repo" { default = "integreat" }

locals {
  # Aligné avec le brief INTEGREAT (Phases 1-6).
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
  env          = "dev"
  github_owner = var.github_owner
  github_repo  = var.github_repo

  secret_ids = local.secret_ids
}

module "network" {
  source = "../../modules/network"

  project_id = var.project_id
  region     = var.region
  env        = "dev"

  depends_on = [module.bootstrap]
}

module "data" {
  source = "../../modules/data"

  project_id     = var.project_id
  region         = var.region
  env            = "dev"
  vpc_id         = module.network.vpc_id
  psa_dependency = module.network.psa_connection

  cloudsql_tier                = "db-custom-2-7680"
  cloudsql_availability_type   = "ZONAL"
  cloudsql_deletion_protection = false

  # Profil "hackathon" : Vector Search activé sur dev mais en pratique
  # un seul index est déployé sur l'endpoint pour limiter le coût (~150€/mo
  # par déploiement). Voir docs/RUNBOOKS.md pour le déploiement gcloud.
  enable_vector_search = true

  redis_tier           = "BASIC"
  redis_memory_size_gb = 1

  depends_on = [module.bootstrap]
}

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
output "vector_search_endpoint" { value = module.data.vector_search_endpoint }
output "vector_search_index_risk" { value = module.data.vector_search_index_risk }
output "vector_search_index_corp" { value = module.data.vector_search_index_corp }
output "redis_host" { value = module.data.redis_host }
output "redis_port" { value = module.data.redis_port }

# ----------------------------------------------------------------------------
# Phase 2 — Pipeline risk (opt-in: requires built Docker image)
# ----------------------------------------------------------------------------
variable "pipeline_risk_image" {
  type        = string
  default     = ""
  description = "Full image URI; leave empty to skip Cloud Run Job creation."
}

module "pipeline_risk" {
  count  = var.pipeline_risk_image == "" ? 0 : 1
  source = "../../modules/pipeline-risk"

  project_id                        = var.project_id
  region                            = var.region
  env                               = "dev"
  image                             = var.pipeline_risk_image
  vpc_connector                     = module.network.connector_id
  raw_legal_bucket                  = module.data.bucket_raw_risk
  vector_search_index_legal         = module.data.vector_search_index_risk == null ? "" : module.data.vector_search_index_risk
  vector_search_endpoint_id         = module.data.vector_search_endpoint == null ? "" : module.data.vector_search_endpoint
  cloudsql_instance_connection_name = module.data.cloudsql_instance_connection_name
  cloudsql_private_ip               = module.data.cloudsql_private_ip
  vertex_llm_model                  = "gemini-2.5-flash"
  vertex_embedding_model            = "text-embedding-005"
}

output "pipeline_risk_job" {
  value = length(module.pipeline_risk) > 0 ? module.pipeline_risk[0].job_name : null
}
output "pipeline_risk_topic" {
  value = length(module.pipeline_risk) > 0 ? module.pipeline_risk[0].topic_name : null
}
