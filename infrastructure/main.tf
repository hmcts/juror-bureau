provider "azurerm" {
  features {}
}

locals {
  resourceName = "${var.product}-${var.env}-rg"
  vaultName    = "${var.product}-${var.env}"
  cacheName    = "${var.product}-${var.component}-redis-cache"
}

module "juror-bureau-redis" {
  source                        = "git@github.com:hmcts/cnp-module-redis?ref=master"
  product                       = local.cacheName
  location                      = var.location
  env                           = var.env
  common_tags                   = var.common_tags
  private_endpoint_enabled      = true
  redis_version                 = "6"
  business_area                 = "sds"
  public_network_access_enabled = false
  sku_name                      = var.sku_name
  family                        = var.family
  capacity                      = var.capacity
}

data "azurerm_key_vault" "juror" {
  name                = local.vaultName
  resource_group_name = local.resourceName
}

resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "${var.component}-redisConnection"
  value        = "rediss://:${urlencode(module.juror-bureau-redis.access_key)}@${module.juror-bureau-redis.host_name}:${module.juror-bureau-redis.redis_port}"
  key_vault_id = data.azurerm_key_vault.juror.id
}

data "azurerm_redis_cache" "juror" {
  name                = local.cacheName
  resource_group_name = local.resourceName
}

resource "azurerm_monitor_diagnostic_setting" "cache-ds" {
  name                       = local.cacheName
  target_resource_id         = data.azurerm_redis_cache.juror.id
  log_analytics_workspace_id = module.log_analytics_workspace.workspace_id

  enabled_log {
    category = "AuditEvent"
  }

  lifecycle {
    ignore_changes = [
      metric,
    ]
  }
}

module "log_analytics_workspace" {
  source      = "git@github.com:hmcts/terraform-module-log-analytics-workspace-id.git?ref=master"
  environment = var.env
}
