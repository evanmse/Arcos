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
    bucket = "arcos-hasfy-dev-tf-state"
    prefix = "envs/dev"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" { default = "arcos-hasfy-dev" }
variable "region" { default = "europe-west1" }
variable "github_owner" { default = "evanmse" }
variable "github_repo" { default = "arcos" }

module "bootstrap" {
  source = "../../modules/bootstrap"

  project_id   = var.project_id
  region       = var.region
  env          = "dev"
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
  enable_vector_search         = true

  depends_on = [module.bootstrap]
}

output "artifact_registry_repo" { value = module.bootstrap.artifact_registry_repo }
output "wif_provider" { value = module.bootstrap.wif_provider }
output "deployer_service_account_email" { value = module.bootstrap.deployer_service_account_email }
output "vpc_name" { value = module.network.vpc_name }
output "vpc_connector" { value = module.network.connector_name }
output "cloudsql_connection_name" { value = module.data.cloudsql_instance_connection_name }
output "cloudsql_private_ip" { value = module.data.cloudsql_private_ip }
output "bucket_raw_legal" { value = module.data.bucket_raw_legal }
output "bucket_exports" { value = module.data.bucket_exports }
output "bigquery_audit_table" { value = module.data.bigquery_audit_table }
output "vector_search_endpoint" { value = module.data.vector_search_endpoint }
output "vector_search_index_legal" { value = module.data.vector_search_index_legal }
output "vector_search_index_corp" { value = module.data.vector_search_index_corp }
