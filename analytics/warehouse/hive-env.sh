# Hive environment overrides
# Override HADOOP_CLIENT_OPTS to reduce JVM heap (prevent OOM)
export HADOOP_CLIENT_OPTS="-Xmx512m -XX:MaxMetaspaceSize=256m -XX:+UseSerialGC"