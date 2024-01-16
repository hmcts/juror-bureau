provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

locals {
  resourceName = "${var.product}-${var.env}-rg"
  vaultName    = "${var.product}-${var.env}"
}

