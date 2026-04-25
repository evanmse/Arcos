terraform {
  required_version = ">= 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.10"
    }
  }
}

variable "project_id" { type = string }
variable "region" { type = string }
variable "env" { type = string }
variable "github_owner" { type = string }
variable "github_repo" { type = string }
variable "secret_ids" {
  type        = list(string)
  description = "Empty Secret Manager secrets to provision (no values yet)."
  default     = []
}

locals {
  enabled_apis = [
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "serviceusage.googleapis.com",
    "storage.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "pubsub.googleapis.com",
    "cloudscheduler.googleapis.com",
    "cloudtasks.googleapis.com",
    "bigquery.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "vpcaccess.googleapis.com",
    "compute.googleapis.com",
    "aiplatform.googleapis.com",
    "dlp.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudkms.googleapis.com",
    "redis.googleapis.com",
    "cloudfunctions.googleapis.com",
    "workflows.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each                   = toset(local.enabled_apis)
  project                    = var.project_id
  service                    = each.value
  disable_dependent_services = false
  disable_on_destroy         = false
}

# ---------------------------------------------------------------------------
# Artifact Registry — Docker images
# ---------------------------------------------------------------------------
resource "google_artifact_registry_repository" "docker" {
  project       = var.project_id
  location      = var.region
  repository_id = "integreat-docker"
  description   = "INTEGREAT container images (${var.env})"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# Secret Manager — placeholder secrets (values managed out-of-band)
# ---------------------------------------------------------------------------
resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(var.secret_ids)
  project   = var.project_id
  secret_id = each.value

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# ---------------------------------------------------------------------------
# Workload Identity Federation for GitHub Actions
# ---------------------------------------------------------------------------
resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions Pool"
  description               = "WIF pool for GitHub Actions CI/CD"

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC Provider"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
    "attribute.ref"              = "assertion.ref"
  }

  attribute_condition = "assertion.repository_owner == \"${var.github_owner}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Service account assumed by GitHub Actions for deployments
resource "google_service_account" "deployer" {
  project      = var.project_id
  account_id   = "gha-deployer"
  display_name = "GitHub Actions Deployer (${var.env})"

  depends_on = [google_project_service.apis]
}

# Allow the GitHub repo to impersonate the deployer SA
resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_owner}/${var.github_repo}"
}

# Minimal project roles for CI/CD deployments
locals {
  deployer_roles = [
    "roles/run.admin",
    "roles/cloudbuild.builds.editor",
    "roles/artifactregistry.writer",
    "roles/storage.admin",
    "roles/secretmanager.secretAccessor",
    "roles/iam.serviceAccountUser",
    "roles/logging.logWriter",
  ]
}

resource "google_project_iam_member" "deployer_roles" {
  for_each = toset(local.deployer_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.deployer.email}"
}

# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------
output "artifact_registry_repo" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "wif_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account_email" {
  value = google_service_account.deployer.email
}
