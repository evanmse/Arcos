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

locals {
  vpc_name           = "arcos-vpc"
  subnet_name        = "arcos-${var.env}-subnet"
  subnet_cidr        = "10.10.0.0/20"
  connector_name     = "arcos-${var.env}-vpcc"
  connector_cidr     = "10.20.0.0/28"
  psa_range_name     = "arcos-psa-range"
  psa_address_cidr   = "10.30.0.0"
  psa_address_prefix = 16
}

# ----------------------------------------------------------------------------
# VPC + private subnet
# ----------------------------------------------------------------------------
resource "google_compute_network" "vpc" {
  project                 = var.project_id
  name                    = local.vpc_name
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "subnet" {
  project                  = var.project_id
  name                     = local.subnet_name
  ip_cidr_range            = local.subnet_cidr
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# ----------------------------------------------------------------------------
# Serverless VPC Access connector (Cloud Run -> private services)
# ----------------------------------------------------------------------------
resource "google_vpc_access_connector" "connector" {
  project       = var.project_id
  name          = local.connector_name
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = local.connector_cidr
  min_instances = 2
  max_instances = 3
  machine_type  = "e2-micro"
}

# ----------------------------------------------------------------------------
# Private Services Access (Cloud SQL private IP)
# ----------------------------------------------------------------------------
resource "google_compute_global_address" "psa_range" {
  project       = var.project_id
  name          = local.psa_range_name
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  address       = local.psa_address_cidr
  prefix_length = local.psa_address_prefix
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "psa" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.psa_range.name]
  deletion_policy         = "ABANDON"
}

# ----------------------------------------------------------------------------
# Outputs
# ----------------------------------------------------------------------------
output "vpc_id" { value = google_compute_network.vpc.id }
output "vpc_name" { value = google_compute_network.vpc.name }
output "subnet_id" { value = google_compute_subnetwork.subnet.id }
output "connector_id" { value = google_vpc_access_connector.connector.id }
output "connector_name" { value = google_vpc_access_connector.connector.name }
output "psa_connection" { value = google_service_networking_connection.psa.id }
