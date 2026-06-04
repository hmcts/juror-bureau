sku_name           = "Premium"
family             = "P"
capacity           = "1"
rdb_backup_enabled = true

# Azure Managed Redis (DTSPO-32018) — match existing Premium P1 + RDB
managed_redis_sku                       = "Balanced_B1"
managed_redis_persistence_rdb_frequency = "6h"
