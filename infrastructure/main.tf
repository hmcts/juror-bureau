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
  name                = "${local.cacheName}-${var.env}"
  resource_group_name = "${local.cacheName}-cache-${var.env}"
}

resource "azurerm_monitor_diagnostic_setting" "cache-ds" {
  name                       = "${local.cacheName}-${var.env}"
  target_resource_id         = data.azurerm_redis_cache.juror.id
  log_analytics_workspace_id = module.log_analytics_workspace.workspace_id

  enabled_log {
    category = "ConnectedClientList"
  }

  enabled_log {
    category = "MSEntraAuthenticationAuditLog"
  }

  lifecycle {
    ignore_changes = [
      metric,
    ]
  }
}

# region: Azure Managed Redis (DTSPO-32018)
# Provisioned alongside the existing classic cache during migration.
# The classic cache is intentionally NOT removed by this PR — cutover happens
# via cnp-flux-config, with this resource decommissioned in a follow-up PR
# once all environments have soaked successfully.

data "azurerm_subnet" "redis_private_endpoint" {
  name                 = "core-infra-subnet-2-${var.env}"
  resource_group_name  = "core-infra-${var.env}"
  virtual_network_name = "core-infra-vnet-${var.env}"
}

module "managed_redis" {
  source = "git@github.com:hmcts/terraform-module-azure-managed-redis?ref=main"

  product     = var.product
  component   = var.component
  env         = var.env
  location    = var.location
  common_tags = var.common_tags

  sku_name = var.managed_redis_sku

  public_network_access   = "Disabled"
  create_private_endpoint = true
  subnet_id               = data.azurerm_subnet.redis_private_endpoint.id
  private_dns_zone_ids = [
    "/subscriptions/${var.private_dns_subscription_id}/resourceGroups/core-infra-intsvc-rg/providers/Microsoft.Network/privateDnsZones/privatelink.redis.azure.net"
  ]

  access_keys_authentication_enabled = true
  persistence_rdb_backup_frequency   = var.managed_redis_persistence_rdb_frequency
}

resource "azurerm_key_vault_secret" "managed_redis_connection_string" {
  name         = "azure-managed-redis-connection-string"
  value        = "rediss://default:${urlencode(module.managed_redis.primary_access_key)}@${module.managed_redis.hostname}:${module.managed_redis.port}"
  key_vault_id = data.azurerm_key_vault.juror.id
}
# endregion

module "log_analytics_workspace" {
  source      = "git@github.com:hmcts/terraform-module-log-analytics-workspace-id.git?ref=master"
  environment = var.env
}
