provider "azurerm" {
  features {}
}

locals {
  resourceName = "${var.product}-${var.env}-rg"
  vaultName    = "${var.product}-${var.env}"
}

