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
}

variable "project_id" { type = string }
variable "region" { type = string }
variable "env" { type = string }
variable "vpc_id" { type = string }
variable "psa_dependency" {
  description = "Pass google_service_networking_connection.psa.id from network module to enforce ordering."
  type        = string
}

variable "cloudsql_tier" {
  type        = string
  description = "Cloud SQL machine tier"
  default     = "db-custom-2-7680"
}

variable "cloudsql_availability_type" {
  type        = string
  description = "ZONAL (dev) or REGIONAL (prod HA)"
  default     = "ZONAL"
}

variable "cloudsql_deletion_protection" {
  type    = bool
  default = true
}

variable "enable_vector_search" {
  type        = bool
  description = "Provision Vertex AI Vector Search index endpoint + indexes (costly, ~150€/mo idle)."
  default     = true
}

variable "audit_log_retention_days" {
  type    = number
  default = 2557 # 7 years
}

# ----------------------------------------------------------------------------
# Cloud SQL Postgres 16 + pgvector
# ----------------------------------------------------------------------------
resource "random_password" "pg_app" {
  length           = 32
  special          = true
  override_special = "!@#%&*-_=+:?"
}

resource "random_password" "pg_migrator" {
  length           = 32
  special          = true
  override_special = "!@#%&*-_=+:?"
}

resource "google_sql_database_instance" "main" {
  project          = var.project_id
  name             = "arcos-${var.env}-pg"
  database_version = "POSTGRES_16"
  region           = var.region

  deletion_protection = var.cloudsql_deletion_protection

  settings {
    tier              = var.cloudsql_tier
    edition           = "ENTERPRISE"
    availability_type = var.cloudsql_availability_type
    disk_type         = "PD_SSD"
    disk_size         = 20
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "02:00"
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.vpc_id
      enable_private_path_for_google_cloud_services = true
      ssl_mode                                      = "ENCRYPTED_ONLY"
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    insights_config {
      query_insights_enabled = true
      query_string_length    = 1024
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 3
      update_track = "stable"
    }
  }

  depends_on = [var.psa_dependency]
}

resource "google_sql_database" "arcos" {
  project  = var.project_id
  name     = "arcos"
  instance = google_sql_database_instance.main.name
  charset  = "UTF8"
}

resource "google_sql_user" "app" {
  project  = var.project_id
  name     = "arcos_app"
  instance = google_sql_database_instance.main.name
  password = random_password.pg_app.result
}

resource "google_sql_user" "migrator" {
  project  = var.project_id
  name     = "arcos_migrator"
  instance = google_sql_database_instance.main.name
  password = random_password.pg_migrator.result
}

# Store generated passwords in Secret Manager
resource "google_secret_manager_secret" "pg_app_password" {
  project   = var.project_id
  secret_id = "pg_app_password"
  replication {
    user_managed {
      replicas { location = var.region }
    }
  }
}

resource "google_secret_manager_secret_version" "pg_app_password_v" {
  secret      = google_secret_manager_secret.pg_app_password.id
  secret_data = random_password.pg_app.result
}

resource "google_secret_manager_secret" "pg_migrator_password" {
  project   = var.project_id
  secret_id = "pg_migrator_password"
  replication {
    user_managed {
      replicas { location = var.region }
    }
  }
}

resource "google_secret_manager_secret_version" "pg_migrator_password_v" {
  secret      = google_secret_manager_secret.pg_migrator_password.id
  secret_data = random_password.pg_migrator.result
}

# ----------------------------------------------------------------------------
# Cloud Storage — data buckets
# ----------------------------------------------------------------------------
locals {
  buckets = {
    raw_legal  = "arcos-${var.env}-raw-legal"
    exports    = "arcos-${var.env}-exports"
    vs_staging = "arcos-${var.env}-vs-staging"
  }
}

resource "google_storage_bucket" "data" {
  for_each = local.buckets

  project                     = var.project_id
  name                        = each.value
  location                    = var.region
  force_destroy               = false
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition { num_newer_versions = 5 }
    action { type = "Delete" }
  }
}

# ----------------------------------------------------------------------------
# BigQuery — audit log (append-only)
# ----------------------------------------------------------------------------
resource "google_bigquery_dataset" "audit" {
  project                    = var.project_id
  dataset_id                 = "arcos_audit"
  location                   = var.region
  description                = "ARCOS immutable audit log (${var.env})"
  delete_contents_on_destroy = false

  default_table_expiration_ms = null
}

resource "google_bigquery_table" "audit_log" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.audit.dataset_id
  table_id   = "audit_log"

  deletion_protection      = true
  require_partition_filter = false

  time_partitioning {
    type          = "DAY"
    field         = "event_time"
    expiration_ms = var.audit_log_retention_days * 24 * 60 * 60 * 1000
  }

  clustering = ["tenant_id", "actor_type", "agent_name"]

  schema = jsonencode([
    { name = "event_id", type = "STRING", mode = "REQUIRED", description = "ULID/UUID of the event" },
    { name = "event_time", type = "TIMESTAMP", mode = "REQUIRED", description = "Event timestamp (UTC)" },
    { name = "tenant_id", type = "STRING", mode = "REQUIRED" },
    { name = "actor_type", type = "STRING", mode = "REQUIRED", description = "user|agent|system" },
    { name = "actor_id", type = "STRING", mode = "NULLABLE" },
    { name = "agent_name", type = "STRING", mode = "NULLABLE", description = "Watcher|Analyzer|GapAssessor|PlanGenerator|null" },
    { name = "assessment_id", type = "STRING", mode = "NULLABLE" },
    { name = "regulation_id", type = "STRING", mode = "NULLABLE" },
    { name = "action", type = "STRING", mode = "REQUIRED", description = "Action verb, e.g. assessment.started" },
    { name = "resource_type", type = "STRING", mode = "NULLABLE" },
    { name = "resource_id", type = "STRING", mode = "NULLABLE" },
    { name = "status", type = "STRING", mode = "NULLABLE", description = "success|failure|in_progress" },
    { name = "request_id", type = "STRING", mode = "NULLABLE" },
    { name = "trace_id", type = "STRING", mode = "NULLABLE", description = "Langfuse trace id" },
    { name = "ip_address", type = "STRING", mode = "NULLABLE" },
    { name = "user_agent", type = "STRING", mode = "NULLABLE" },
    { name = "metadata", type = "JSON", mode = "NULLABLE" },
    { name = "schema_version", type = "STRING", mode = "REQUIRED", defaultValueExpression = "'v1'" },
  ])
}

# ----------------------------------------------------------------------------
# Vertex AI Vector Search — endpoint + 2 indexes (legal + corporate)
# ----------------------------------------------------------------------------
resource "google_vertex_ai_index_endpoint" "main" {
  count = var.enable_vector_search ? 1 : 0

  project      = var.project_id
  region       = var.region
  display_name = "arcos-${var.env}-endpoint"
  description  = "ARCOS Vector Search endpoint (${var.env})"

  public_endpoint_enabled = true
}

resource "google_vertex_ai_index" "legal" {
  count = var.enable_vector_search ? 1 : 0

  project      = var.project_id
  region       = var.region
  display_name = "arcos_legal_${var.env}"
  description  = "Legal corpus chunks (DORA, MiCA, AI Act, RGPD)"

  index_update_method = "STREAM_UPDATE"

  metadata {
    config {
      dimensions                  = 768
      approximate_neighbors_count = 50
      distance_measure_type       = "DOT_PRODUCT_DISTANCE"
      shard_size                  = "SHARD_SIZE_SMALL"

      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count    = 500
          leaf_nodes_to_search_percent = 7
        }
      }
    }
  }
}

resource "google_vertex_ai_index" "corp" {
  count = var.enable_vector_search ? 1 : 0

  project      = var.project_id
  region       = var.region
  display_name = "arcos_corp_${var.env}"
  description  = "Corporate documents per tenant (filtered via restricts)"

  index_update_method = "STREAM_UPDATE"

  metadata {
    config {
      dimensions                  = 768
      approximate_neighbors_count = 50
      distance_measure_type       = "DOT_PRODUCT_DISTANCE"
      shard_size                  = "SHARD_SIZE_SMALL"

      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count    = 500
          leaf_nodes_to_search_percent = 7
        }
      }
    }
  }
}

# NOTE: index deployment to the endpoint is NOT created here on purpose —
# deploying triggers paid serving compute. Deploy via gcloud / Phase 2 when
# the first batch of vectors is ready.

# ----------------------------------------------------------------------------
# Outputs
# ----------------------------------------------------------------------------
output "cloudsql_instance_connection_name" {
  value = google_sql_database_instance.main.connection_name
}
output "cloudsql_private_ip" {
  value = google_sql_database_instance.main.private_ip_address
}
output "cloudsql_database" {
  value = google_sql_database.arcos.name
}
output "bucket_raw_legal" {
  value = google_storage_bucket.data["raw_legal"].name
}
output "bucket_exports" {
  value = google_storage_bucket.data["exports"].name
}
output "bigquery_audit_table" {
  value = "${var.project_id}.${google_bigquery_dataset.audit.dataset_id}.${google_bigquery_table.audit_log.table_id}"
}
output "vector_search_endpoint" {
  value       = var.enable_vector_search ? google_vertex_ai_index_endpoint.main[0].name : null
  description = "Vector Search index endpoint resource name (null if disabled)."
}
output "vector_search_index_legal" {
  value = var.enable_vector_search ? google_vertex_ai_index.legal[0].name : null
}
output "vector_search_index_corp" {
  value = var.enable_vector_search ? google_vertex_ai_index.corp[0].name : null
}
