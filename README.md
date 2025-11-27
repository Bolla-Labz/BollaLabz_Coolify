# BollaLabz Coolify Deployment

Clean deployment repository for BollaLabz application via Coolify v4.0.0.

## 🏗️ Architecture

- **Control Plane**: VPS #1 (31.220.55.252) - Coolify Dashboard
- **Worker Node**: VPS #2 (93.127.197.222) - Application Containers
- **Database**: PostgreSQL (Coolify Managed)
- **Cache**: Redis Cloud (External)
- **Proxy**: Traefik (Auto-configured)

## 📁 Structure

```
BollaLabz_Coolify/
├── backend/            # Node.js Express API
├── frontend/           # React TypeScript application
├── database/           # PostgreSQL schema and migrations
├── docker-compose.yml  # Production Docker configuration
├── .env.example        # Environment variable template
└── README.md          # This file
```

## 🚀 Deployment Process

### 1. Prerequisites
- Coolify installed on VPS #1
- VPS #2 configured as worker node
- GitHub repository created
- DNS pointing to VPS #2

### 2. Environment Setup
1. Copy `.env.example` to `.env` locally (for reference)
2. Configure all variables in Coolify Dashboard UI
3. Generate new secrets for production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Coolify Configuration
1. Add application in Coolify dashboard
2. Point to this GitHub repository
3. Set build pack to "Docker Compose"
4. Configure environment variables
5. Set domain (e.g., bollalabz.com)

### 4. Database Setup
1. Create PostgreSQL database via Coolify UI
2. Note connection string
3. Add to environment variables

### 5. Deploy
1. Push code to GitHub
2. Click "Deploy" in Coolify
3. Monitor build logs (~10-15 minutes)
4. Verify health checks pass

## 📋 Environment Variables

See `.env.example` for complete list. Critical variables:
- `DATABASE_URL` - PostgreSQL connection from Coolify
- `REDIS_*` - Redis Cloud credentials
- `JWT_SECRET` - Generate unique secret
- `DOMAIN` - Your production domain

## 🔧 Build Process

Coolify automatically:
1. Clones this repository on VPS #2
2. Builds Docker images from Dockerfiles
3. Runs docker-compose with environment variables
4. Configures Traefik for SSL and routing
5. Monitors health checks

## 📊 Services

- **Backend**: Node.js API on port 3001
- **Frontend**: React app on port 80
- **PostgreSQL**: Managed by Coolify
- **Redis**: External Redis Cloud
- **Traefik**: Reverse proxy with SSL

## 🔒 Security

- All secrets in Coolify UI (not in repository)
- Automatic SSL via Let's Encrypt
- Health checks for availability
- Isolated Docker networks per application

## 📝 Notes

- This repository contains ONLY production code
- No development files or test data included
- Optimized for Coolify deployment workflow
- Builds happen on VPS #2, not locally

## 🆘 Troubleshooting

1. **504 Gateway Timeout**: Check Traefik labels in docker-compose.yml
2. **Database Connection Failed**: Verify DATABASE_URL in Coolify
3. **Build Failed**: Check Dockerfile syntax and paths
4. **SSL Not Working**: Ensure DNS points to VPS #2

## 📚 Documentation

For detailed deployment guide, see:
- Coolify Dashboard: http://31.220.55.252:3000
- Main Project Docs: [Development Repository]