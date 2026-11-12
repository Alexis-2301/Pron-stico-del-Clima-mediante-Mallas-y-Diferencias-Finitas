# 🚀 Guía de Deployment - Producción

## 📋 Tabla de Contenidos
1. [Deployment Local (Docker Compose)](#deployment-local)
2. [Deployment en la Nube](#deployment-en-la-nube)
3. [Configuración SSL/TLS](#configuración-ssltls)
4. [Scaling Horizontal](#scaling-horizontal)
5. [Monitoring y Logging](#monitoring-y-logging)
6. [Troubleshooting](#troubleshooting)

---

## Deployment Local

### Prerrequisitos
```bash
# Instalar Docker y Docker Compose
docker --version  # >= 24.0
docker-compose --version  # >= 2.20

# Clonar repositorio
git clone https://github.com/yourusername/clima-app.git
cd clima-app
```

### Configuración

**1. Crear archivo `.env` en raíz:**
```bash
cat > .env << 'EOF'
# APIs Externas
OPENWEATHER_API_KEY=sk_live_xxxxxxxx
AEMET_API_KEY=your_aemet_key
NOAA_API_KEY=your_noaa_key

# Redis
REDIS_PASSWORD=secure_redis_password_here
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0

# Backend
BACKEND_PORT=8000
LOG_LEVEL=INFO
WORKERS=4

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8000

# Caché
CACHE_TTL_DEFAULT=3600
CACHE_TTL_WEATHER=1800
EOF
```

### 2. Iniciar servicios

```bash
# Desarrollo (con hot-reload)
docker-compose -f docker-compose.yml up

# Producción
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

**Esperar a que estén healthy:**
```bash
docker-compose ps
# NAME              STATUS
# clima_redis       Up (healthy)
# clima_backend     Up (healthy)
# clima_frontend    Up (healthy)
```

**Acceso:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Redis: localhost:6379

---

## Deployment en la Nube

### Opción 1: Railway (Recomendado para rápido)

**1. Conectar repositorio:**
```bash
# Instalar CLI de Railway
npm i -g @railway/cli

# Hacer login
railway login

# Inicializar proyecto
railway init
```

**2. Archivo `railway.toml`:**
```toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "python -m uvicorn backend.api.app:app --host 0.0.0.0 --port $PORT"

[[services]]
name = "backend"
dockerfile = "./Dockerfile.backend"
port = 8000

[[services]]
name = "frontend"
dockerfile = "./Dockerfile.frontend"
port = 3000

[[services]]
name = "redis"
image = "redis:7-alpine"
port = 6379
```

**3. Desplegar:**
```bash
railway up
```

### Opción 2: AWS (ECS + RDS + ElastiCache)

**Arquitectura:**
```
┌─────────────────────────────────┐
│    CloudFront (CDN)             │
├─────────────────────────────────┤
│    Application Load Balancer    │
├──────────────┬──────────────────┤
│  ECS Cluster │  Auto Scaling    │
│  (Backend)   │  Group           │
├──────────────┴──────────────────┤
│    ElastiCache (Redis)          │
├─────────────────────────────────┤
│    RDS (PostgreSQL opcional)    │
└─────────────────────────────────┘
```

**Scripts CloudFormation:**

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'

Resources:
  # ECR Repository para imágenes Docker
  BackendRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: clima-backend
      ImageScanningConfiguration:
        ScanOnPush: true

  # ECS Cluster
  ClimaCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: clima-production

  # Task Definition
  BackendTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: clima-backend
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '512'
      Memory: '1024'
      ContainerDefinitions:
        - Name: backend
          Image: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/clima-backend:latest'
          PortMappings:
            - ContainerPort: 8000
          Environment:
            - Name: REDIS_URL
              Value: !Sub 'redis://${RedisCluster.RedisEndpoint.Address}:6379'
            - Name: LOG_LEVEL
              Value: INFO
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref LogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: backend

  # Auto Scaling Service
  BackendService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: clima-backend
      Cluster: !Ref ClimaCluster
      TaskDefinition: !Ref BackendTaskDefinition
      DesiredCount: 3
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          SecurityGroups:
            - !Ref BackendSecurityGroup

  # ElastiCache Redis
  RedisCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheNodes: 1
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup
```

**Desplegar:**
```bash
aws cloudformation create-stack \
  --stack-name clima-production \
  --template-body file://template.yaml \
  --capabilities CAPABILITY_IAM
```

### Opción 3: Heroku (Deprecated pero simple)

```bash
# Crear app
heroku create clima-weather-app

# Agregar Redis
heroku addons:create heroku-redis:premium-0

# Establecer variables de entorno
heroku config:set OPENWEATHER_API_KEY=sk_live_xxx

# Desplegar
git push heroku main

# Logs
heroku logs --tail
```

---

## Configuración SSL/TLS

### Con Let's Encrypt + Nginx

**Archivo `docker-compose.prod.yml`:**

```yaml
services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl/certs:/etc/nginx/certs:ro
      - ./ssl/keys:/etc/nginx/private_keys:ro
    depends_on:
      - frontend
      - backend

  certbot:
    image: certbot/certbot
    volumes:
      - ./ssl/certs:/etc/letsencrypt/live
      - ./ssl/keys:/etc/letsencrypt/private
    entrypoint: "certbot renew --quiet"
```

**Nginx Config:**
```nginx
# nginx.conf
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name clima.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name clima.example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/private_keys/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_buffering off;
    }
}
```

**Obtener certificado:**
```bash
docker run --rm -it -v $(pwd)/ssl:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d clima.example.com \
  --email admin@example.com
```

---

## Scaling Horizontal

### Auto Scaling con Kubernetes

**Deployments Kubernetes:**

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clima-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: clima-backend
  template:
    metadata:
      labels:
        app: clima-backend
    spec:
      containers:
      - name: backend
        image: clima-backend:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "500m"
            memory: "1024Mi"
        env:
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: clima-config
              key: redis_url

---
apiVersion: v1
kind: Service
metadata:
  name: clima-backend-service
spec:
  selector:
    app: clima-backend
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: clima-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: clima-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Desplegar:**
```bash
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f redis-deployment.yaml

# Verificar
kubectl get pods
kubectl get svc
```

---

## Monitoring y Logging

### Prometheus + Grafana

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

**Integración en FastAPI:**
```python
from prometheus_client import Counter, Histogram, make_wsgi_app
from fastapi.middleware.wsgi import WSGIMiddleware

# Métricas personalizadas
simulation_time = Histogram(
    'simulation_duration_seconds',
    'Tiempo de simulación',
    buckets=(0.1, 0.5, 1, 5, 10)
)

weather_api_calls = Counter(
    'weather_api_calls_total',
    'Total llamadas APIs meteorológicas',
    ['api', 'status']
)

# Agregar endpoint Prometheus
app.add_route("/metrics", make_wsgi_app())
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# docker-compose.yml agregado
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
```

**Python logging a Elasticsearch:**
```python
import logging
from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Ahora todos los logs van en JSON
logger.info("Simulación iniciada", extra={"sim_id": "123"})
```

---

## Troubleshooting

### Problema: Backend no arranca

```bash
# Ver logs
docker-compose logs backend

# Verificar estabilidad CFL
curl http://localhost:8000/stability?alpha=6000&u=8&v=3&dx=10000&dt=450

# Reiniciar
docker-compose restart backend
```

### Problema: Lentitud

```bash
# Verificar tamaño caché Redis
redis-cli INFO stats

# Limpieza Redis
redis-cli FLUSHDB

# Monitorar CPU/Memoria
docker-compose stats
```

### Problema: APIs meteorológicas fallan

```bash
# Probar conexión
curl https://api.open-meteo.com/v1/forecast?latitude=4.5&longitude=-74.1

# Verificar logs de middleware
docker-compose logs backend | grep "weather_integration"

# Activar fallback manual
# (Editar backend/api/app.py: usar synthetic_fallback())
```

---

**Generado:** Noviembre 2024 | Proyecto: Pronóstico Meteorológico v2.0
