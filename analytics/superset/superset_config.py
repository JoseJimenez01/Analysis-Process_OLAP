# Superset config — montado como /app/superset_config.py en el contenedor

import os

SECRET_KEY = os.getenv("SUPERSET_SECRET_KEY", "change_me_superset_123")

# Permitir conexiones desde cualquier host (dev)
ENABLE_PROXY_FIX = True

# Metadata database: SQLite local (para desarrollo)
SQLALCHEMY_DATABASE_URI = "sqlite:////app/superset.db"

# Cache: deshabilitado para desarrollo
CACHE_CONFIG = {"CACHE_TYPE": "NullCache"}

# Tiempo de expiración de resultados de consultas (segundos)
RESULTS_BACKEND = None

# Habilitar importación/exportación de dashboards vía API
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "ALERT_REPORT_TABS": True,
}

# Row-level security deshabilitado
ROW_LEVEL_SECURITY = False

# Tiempo máximo de consulta (segundos)
SQLLAB_ASYNC_TIME_LIMIT_SEC = 300

# Mostrar ejemplos SQL
DISPLAY_SQL = True
