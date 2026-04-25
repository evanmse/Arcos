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
variable "image" {
  type        = string
  description = "Full image URI for the pipeline-risk container, e.g. europe-west1-docker.pkg.dev/.../pipeline-risk:latest"
}
variable "vpc_connector" {
  type        = string
  description = "Serverless VPC connector resource id"
}
variable "raw_legal_bucket" { type = string }
variable "vector_search_index_legal" {
  type    = string
  default = ""
}
variable "vector_search_endpoint_id" {
  type        = string
  default     = ""
  description = "Vector Search endpoint resource id (numeric)"
}
variable "vertex_llm_model" {
  type    = string
  default = "gemini-2.5-flash"
}
variable "vertex_embedding_model" {
  type    = string
  default = "text-embedding-005"
}
variable "cloudsql_instance_connection_name" {
  type        = string
  description = "Cloud SQL instance connection name (project:region:instance)"
}
variable "cloudsql_private_ip" {
  type    = string
  default = ""
}
variable "pg_app_password_secret" {
  type        = string
  default     = "pg_app_password"
  description = "Secret Manager id holding the integreat_app password"
}
variable "schedule_cron" {
  type    = string
  default = "0 6 * * *" # 6h UTC daily
}

# ----------------------------------------------------------------------------
# Pub/Sub topic for ingestion notifications
# ----------------------------------------------------------------------------
resource "google_pubsub_topic" "legal_updates" {
  project = var.project_id
  name    = "legal-updates"
  labels  = { env = var.env }

  message_retention_duration = "604800s" # 7 days
}

# ----------------------------------------------------------------------------
# Service account for the Cloud Run Job
# ----------------------------------------------------------------------------
resource "google_service_account" "pipeline_risk" {
  project      = var.project_id
  account_id   = "pipeline-risk"
  display_name = "INTEGREAT pipeline-risk job (${var.env})"
}

locals {
  pipeline_roles = [
    "roles/storage.objectAdmin",
    "roles/aiplatform.user",
    "roles/cloudsql.client",
    "roles/pubsub.publisher",
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
  ]
}

resource "google_project_iam_member" "pipeline_risk_roles" {
  for_each = toset(local.pipeline_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.pipeline_risk.email}"
}

# ----------------------------------------------------------------------------
# Cloud Run Job — ingest legal corpus
# ----------------------------------------------------------------------------
resource "google_cloud_run_v2_job" "ingest_legal" {
  project  = var.project_id
  name     = "ingest-legal"
  location = var.region

  template {
    template {
      service_account = google_service_account.pipeline_risk.email
      timeout         = "1800s" # 30 minutes
      max_retries     = 1

      vpc_access {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [var.cloudsql_instance_connection_name]
        }
      }

      containers {
        image = var.image

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }

        resources {
          limits = {
            cpu    = "2"
            memory = "4Gi"
          }
        }

        env {
          name  = "INTEGREAT_ENV"
          value = var.env
        }
        env {
          name  = "INTEGREAT_GCP_PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "INTEGREAT_GCP_REGION"
          value = var.region
        }
        env {
          name  = "INTEGREAT_RAW_LEGAL_BUCKET"
          value = var.raw_legal_bucket
        }
        env {
          name  = "INTEGREAT_VECTOR_SEARCH_INDEX_LEGAL"
          value = var.vector_search_index_legal
        }
        env {
          name  = "INTEGREAT_VECTOR_SEARCH_ENDPOINT_ID"
          value = var.vector_search_endpoint_id
        }
        env {
          name  = "INTEGREAT_PUBSUB_TOPIC_LEGAL_UPDATES"
          value = google_pubsub_topic.legal_updates.name
        }
        env {
          name  = "INTEGREAT_VERTEX_LLM_MODEL"
          value = var.vertex_llm_model
        }
        env {
          name  = "INTEGREAT_VERTEX_EMBEDDING_MODEL"
          value = var.vertex_embedding_model
        }
        # Postgres via Cloud SQL unix socket
        env {
          name  = "INTEGREAT_PG_HOST"
          value = "/cloudsql/${var.cloudsql_instance_connection_name}"
        }
        env {
          name  = "INTEGREAT_PG_PORT"
          value = "5432"
        }
        env {
          name  = "INTEGREAT_PG_DATABASE"
          value = "integreat"
        }
        env {
          name  = "INTEGREAT_PG_USER"
          value = "integreat_app"
        }
        env {
          name = "INTEGREAT_PG_PASSWORD"
          value_source {
            secret_key_ref {
              secret  = var.pg_app_password_secret
              version = "latest"
            }
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      # Image tag updated by CI/CD; ignore drift here.
      template[0].template[0].containers[0].image,
    ]
  }
}

# ----------------------------------------------------------------------------
# Cloud Scheduler — daily at 6h UTC
# ----------------------------------------------------------------------------
resource "google_service_account" "scheduler_invoker" {
  project      = var.project_id
  account_id   = "scheduler-invoker"
  display_name = "Cloud Scheduler invoker for pipeline-risk"
}

resource "google_project_iam_member" "scheduler_invoker_run" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.scheduler_invoker.email}"
}

resource "google_cloud_scheduler_job" "ingest_legal_daily" {
  project   = var.project_id
  name      = "ingest-legal-daily"
  region    = var.region
  schedule  = var.schedule_cron
  time_zone = "Etc/UTC"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.ingest_legal.name}:run"

    oauth_token {
      service_account_email = google_service_account.scheduler_invoker.email
    }
  }
}

output "job_name" { value = google_cloud_run_v2_job.ingest_legal.name }
output "topic_name" { value = google_pubsub_topic.legal_updates.name }
output "service_account" { value = google_service_account.pipeline_risk.email }
output "migrate_job_name" { value = google_cloud_run_v2_job.migrate_risk_db.name }

# ----------------------------------------------------------------------------
# Cloud Run Job — alembic migration runner (manual exec only)
# ----------------------------------------------------------------------------
resource "google_cloud_run_v2_job" "migrate_risk_db" {
  project  = var.project_id
  name     = "migrate-risk-db"
  location = var.region

  template {
    template {
      service_account = google_service_account.pipeline_risk.email
      timeout         = "600s"
      max_retries     = 0

      vpc_access {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [var.cloudsql_instance_connection_name]
        }
      }

      containers {
        image = var.image
        # Override entrypoint to run alembic instead of ingest_corpus.
        command = ["alembic"]
        args    = ["upgrade", "head"]

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "1Gi"
          }
        }

        env {
          name  = "INTEGREAT_ENV"
          value = var.env
        }
        env {
          name  = "INTEGREAT_GCP_PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "INTEGREAT_GCP_REGION"
          value = var.region
        }
        env {
          name  = "INTEGREAT_PG_HOST"
          value = "/cloudsql/${var.cloudsql_instance_connection_name}"
        }
        env {
          name  = "INTEGREAT_PG_PORT"
          value = "5432"
        }
        env {
          name  = "INTEGREAT_PG_DATABASE"
          value = "integreat"
        }
        env {
          name  = "INTEGREAT_PG_USER"
          value = "integreat_app"
        }
        env {
          name = "INTEGREAT_PG_PASSWORD"
          value_source {
            secret_key_ref {
              secret  = var.pg_app_password_secret
              version = "latest"
            }
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].template[0].containers[0].image,
    ]
  }
}
