<!-- Last Modified: 2025-11-25 03:40 -->
# Docker Quick Reference - BollaLabz Frontend

Essential Docker commands for building, running, and debugging the containerized frontend.

## Build Commands

```bash
# Build nginx variant (production)
docker build --target production -t bollalabz-frontend:latest .

# Build Node.js variant (Railway)
docker build --target node-server -t bollalabz-frontend:node .

# Build with environment variables
docker build \
  --target production \
  --build-arg VITE_API_URL=https://api.bollalabz.com \
  --build-arg VITE_WS_URL=wss://api.bollalabz.com/ws \
  -t bollalabz-frontend:latest \
  .

# Build with no cache (clean build)
docker build --no-cache --target production -t bollalabz-frontend:latest .

# Build for specific platform
docker build --platform linux/amd64 --target production -t bollalabz-frontend:latest .

# Build with build script
./docker-build.sh
./docker-build.sh --target node-server
./docker-build.sh --push --tag v1.0.0
```

## Run Commands

```bash
# Run nginx variant
docker run -d -p 8080:80 --name bollalabz-frontend bollalabz-frontend:latest

# Run Node.js variant
docker run -d -p 8080:8080 --name bollalabz-frontend bollalabz-frontend:node

# Run with environment variables
docker run -d \
  -p 8080:80 \
  -e VITE_API_URL=https://api.bollalabz.com \
  -e VITE_WS_URL=wss://api.bollalabz.com/ws \
  --name bollalabz-frontend \
  bollalabz-frontend:latest

# Run with volume mount for debugging
docker run -d \
  -p 8080:80 \
  -v $(pwd)/nginx.frontend.conf:/etc/nginx/conf.d/default.conf \
  --name bollalabz-frontend \
  bollalabz-frontend:latest

# Run with custom network
docker run -d \
  -p 8080:80 \
  --network bollalabz-network \
  --name bollalabz-frontend \
  bollalabz-frontend:latest
```

## Docker Compose Commands

```bash
# Start nginx variant
docker-compose -f docker-compose.frontend.yml up -d frontend-nginx

# Start Node.js variant
docker-compose -f docker-compose.frontend.yml up -d frontend-node

# View logs
docker-compose -f docker-compose.frontend.yml logs -f frontend-nginx

# Stop and remove
docker-compose -f docker-compose.frontend.yml down

# Rebuild and restart
docker-compose -f docker-compose.frontend.yml up -d --build frontend-nginx

# Scale replicas
docker-compose -f docker-compose.frontend.yml up -d --scale frontend-nginx=3
```

## Container Management

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop container
docker stop bollalabz-frontend

# Start container
docker start bollalabz-frontend

# Restart container
docker restart bollalabz-frontend

# Remove container
docker rm bollalabz-frontend

# Force remove running container
docker rm -f bollalabz-frontend

# Remove all stopped containers
docker container prune
```

## Logs and Debugging

```bash
# View logs
docker logs bollalabz-frontend

# Follow logs (real-time)
docker logs -f bollalabz-frontend

# View last 100 lines
docker logs --tail 100 bollalabz-frontend

# View logs with timestamps
docker logs -t bollalabz-frontend

# Execute shell in running container
docker exec -it bollalabz-frontend sh

# Execute specific command
docker exec bollalabz-frontend ls -la /usr/share/nginx/html

# Copy files from container
docker cp bollalabz-frontend:/usr/share/nginx/html/index.html ./

# Copy files to container
docker cp ./nginx.frontend.conf bollalabz-frontend:/etc/nginx/conf.d/default.conf

# Inspect container configuration
docker inspect bollalabz-frontend

# View container resource usage
docker stats bollalabz-frontend

# View container processes
docker top bollalabz-frontend
```

## Health Checks

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' bollalabz-frontend

# View health check logs
docker inspect --format='{{json .State.Health}}' bollalabz-frontend | jq

# Test health endpoint manually
curl http://localhost:8080/health

# Check if container is running
docker ps --filter name=bollalabz-frontend
```

## Image Management

```bash
# List images
docker images

# Remove image
docker rmi bollalabz-frontend:latest

# Remove unused images
docker image prune

# View image history (layers)
docker history bollalabz-frontend:latest

# Tag image
docker tag bollalabz-frontend:latest bollalabz/frontend:v1.0.0

# Push to registry
docker push bollalabz/frontend:v1.0.0

# Pull from registry
docker pull bollalabz/frontend:latest

# Save image to tar file
docker save -o bollalabz-frontend.tar bollalabz-frontend:latest

# Load image from tar file
docker load -i bollalabz-frontend.tar

# Export container to tar
docker export bollalabz-frontend > bollalabz-frontend-export.tar

# Import from tar
docker import bollalabz-frontend-export.tar bollalabz-frontend:imported
```

## Network Management

```bash
# List networks
docker network ls

# Create network
docker network create bollalabz-network

# Connect container to network
docker network connect bollalabz-network bollalabz-frontend

# Disconnect from network
docker network disconnect bollalabz-network bollalabz-frontend

# Inspect network
docker network inspect bollalabz-network

# Remove network
docker network rm bollalabz-network

# Remove unused networks
docker network prune
```

## Volume Management

```bash
# List volumes
docker volume ls

# Create volume
docker volume create bollalabz-data

# Inspect volume
docker volume inspect bollalabz-data

# Remove volume
docker volume rm bollalabz-data

# Remove unused volumes
docker volume prune

# Run with volume
docker run -d \
  -p 8080:80 \
  -v bollalabz-data:/data \
  --name bollalabz-frontend \
  bollalabz-frontend:latest
```

## Troubleshooting Commands

```bash
# Check if port is in use
netstat -tlnp | grep 8080    # Linux
lsof -i :8080                # macOS
netstat -ano | findstr 8080  # Windows

# Check container exit code
docker inspect bollalabz-frontend --format='{{.State.ExitCode}}'

# View container configuration
docker inspect bollalabz-frontend | jq '.[0].Config'

# Test nginx configuration
docker exec bollalabz-frontend nginx -t

# Reload nginx configuration
docker exec bollalabz-frontend nginx -s reload

# Check disk usage
docker system df

# Check container resource limits
docker inspect bollalabz-frontend --format='{{.HostConfig.Memory}}'

# View environment variables
docker exec bollalabz-frontend env

# Check DNS resolution
docker exec bollalabz-frontend nslookup backend

# Test connectivity to backend
docker exec bollalabz-frontend wget -O- http://backend:3001/api/v1/health
```

## Cleanup Commands

```bash
# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f

# Clean everything (nuclear option)
docker system prune -a --volumes -f

# Remove specific containers and images
docker rm -f bollalabz-frontend
docker rmi -f bollalabz-frontend:latest
```

## Performance Analysis

```bash
# Real-time stats
docker stats bollalabz-frontend

# Export stats to file
docker stats --no-stream bollalabz-frontend > stats.txt

# Measure build time
time docker build --target production -t bollalabz-frontend:latest .

# Measure image size
docker images bollalabz-frontend:latest --format "{{.Size}}"

# Analyze image layers
docker history bollalabz-frontend:latest --human --no-trunc

# Check for security vulnerabilities
docker scan bollalabz-frontend:latest
```

## Multi-Platform Builds

```bash
# Create builder instance
docker buildx create --name bollalabz-builder --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target production \
  -t bollalabz/frontend:latest \
  --push \
  .

# Build without pushing
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target production \
  -t bollalabz/frontend:latest \
  --load \
  .
```

## Registry Operations

```bash
# Login to Docker Hub
docker login

# Login to private registry
docker login registry.bollalabz.com

# Tag for registry
docker tag bollalabz-frontend:latest registry.bollalabz.com/frontend:latest

# Push to registry
docker push registry.bollalabz.com/frontend:latest

# Pull from registry
docker pull registry.bollalabz.com/frontend:latest

# Logout
docker logout
```

## Quick Testing Workflow

```bash
# 1. Build
docker build --target production -t bollalabz-frontend:test .

# 2. Run
docker run -d -p 8080:80 --name test-frontend bollalabz-frontend:test

# 3. Test
curl http://localhost:8080/health
curl http://localhost:8080/

# 4. Check logs
docker logs test-frontend

# 5. Cleanup
docker rm -f test-frontend
docker rmi bollalabz-frontend:test
```

## Production Deployment Workflow

```bash
# 1. Build with version tag
docker build --target production -t bollalabz/frontend:v1.0.0 .
docker tag bollalabz/frontend:v1.0.0 bollalabz/frontend:latest

# 2. Push to registry
docker push bollalabz/frontend:v1.0.0
docker push bollalabz/frontend:latest

# 3. Deploy on production server
ssh user@production-server
docker pull bollalabz/frontend:v1.0.0
docker-compose up -d --no-deps frontend

# 4. Verify deployment
curl https://bollalabz.com/health
docker logs bollalabz-frontend

# 5. Monitor
docker stats bollalabz-frontend
```

---

**Tip:** Save this file as a quick reference and customize commands based on your specific needs.
