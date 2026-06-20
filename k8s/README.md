# Kubernetes Deployment

Manifiestos básicos para desplegar la aplicación en Kubernetes, cumpliendo con los requisitos de escalabilidad horizontal.

## Estructura

- `namespace.yaml`: Crea el namespace `restaurantes`.
- `configmap.yaml`: Variables de entorno compartidas.
- `api-deployment.yaml` y `api-service.yaml`: Despliega 3 réplicas del servicio API.
- `search-deployment.yaml` y `search-service.yaml`: Despliega 2 réplicas del servicio de búsqueda.
- `ingress.yaml`: Configura el enrutamiento equivalente a Nginx inverso, mandando tráfico a `/api` o `/search`.

## Despliegue

Asegúrese de tener dependencias externas (PostgreSQL/MongoDB, Redis, Elasticsearch) corriendo en el clúster o accesibles antes del despliegue.

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
# (Crear secret de base de datos)
kubectl create secret generic db-credentials --from-literal=database-url='postgresql://user:pass@host:5432/db' --from-literal=mongo-uri='mongodb://mongos:27017/db' -n restaurantes
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml
kubectl apply -f search-deployment.yaml
kubectl apply -f search-service.yaml
kubectl apply -f ingress.yaml
```
