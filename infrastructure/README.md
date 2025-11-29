# BollaLabz Infrastructure Setup Guide

## Mission: Configure Dual VPS Infrastructure

This guide provides step-by-step instructions for setting up the BollaLabz infrastructure across two VPS servers.

## Server Architecture

| Server | IP | Role | Resources |
|--------|-----|------|-----------|
| **VPS1** | 31.220.55.252 | Control Plane | 8GB RAM, Coolify pre-installed |
| **VPS2** | 93.127.197.222 | Application Workloads | 8GB RAM, Docker |

## Setup Process

### Phase 1: VPS1 Configuration (Control Plane)

1. **Connect to VPS1:**
   ```bash
   ssh root@31.220.55.252
   ```

2. **Run the setup script:**
   ```bash
   # Upload the script
   scp infrastructure/vps1_setup.sh root@31.220.55.252:/tmp/

   # Execute
   ssh root@31.220.55.252 "chmod +x /tmp/vps1_setup.sh && /tmp/vps1_setup.sh"
   ```

3. **Complete Tailscale authentication:**
   ```bash
   sudo tailscale up
   # Follow the URL to authenticate
   # Note the assigned Tailscale IP
   tailscale ip -4
   ```

### Phase 2: VPS2 Configuration (Application Server)

1. **Connect to VPS2:**
   ```bash
   ssh root@93.127.197.222
   ```

2. **Run the setup script:**
   ```bash
   # Upload the script
   scp infrastructure/vps2_setup.sh root@93.127.197.222:/tmp/

   # Execute
   ssh root@93.127.197.222 "chmod +x /tmp/vps2_setup.sh && /tmp/vps2_setup.sh"
   ```

3. **Complete Tailscale authentication:**
   ```bash
   sudo tailscale up
   # Follow the URL to authenticate
   # Note the assigned Tailscale IP
   tailscale ip -4
   ```

### Phase 3: Mesh Network Integration

1. **Test connectivity between servers:**
   ```bash
   # From VPS1
   ping [VPS2-Tailscale-IP]

   # From VPS2
   ping [VPS1-Tailscale-IP]
   ```

2. **Add VPS2 to Coolify:**
   - Access Coolify: http://31.220.55.252:8000
   - Follow the guide in `coolify_remote_setup.md`

### Phase 4: Verification

Run the verification script on both servers:

```bash
# Upload verification script
scp infrastructure/verify_setup.sh root@31.220.55.252:/tmp/
scp infrastructure/verify_setup.sh root@93.127.197.222:/tmp/

# Run on VPS1
ssh root@31.220.55.252 "chmod +x /tmp/verify_setup.sh && /tmp/verify_setup.sh"

# Run on VPS2
ssh root@93.127.197.222 "chmod +x /tmp/verify_setup.sh && /tmp/verify_setup.sh"
```

## Configuration Files

| File | Purpose |
|------|---------|
| `vps1_setup.sh` | Automated setup for VPS1 (Control Plane) |
| `vps2_setup.sh` | Automated setup for VPS2 (Application Server) |
| `verify_setup.sh` | Verification script for both servers |
| `coolify_remote_setup.md` | Guide for connecting VPS2 to Coolify |

## Memory Budget Allocation

### VPS1 (Control Plane - 8GB)
- OS: 300MB
- Coolify + DB + Redis: 1GB
- Traefik: 50MB
- Tailscale: 50MB
- Uptime Kuma: 300MB
- Build headroom: 2GB
- **Buffer**: 4.3GB

### VPS2 (Applications - 8GB)
- OS: 300MB
- Docker: 200MB
- Tailscale: 50MB
- PostgreSQL + pgvector: 2GB
- Redis: 512MB
- Windmill: 300MB
- Next.js: 512MB
- Hono API: 128MB
- FastAPI: 512MB
- **Buffer**: 3.4GB

## Verification Checklist

### Infrastructure Ready
- [ ] Both VPS accessible via SSH
- [ ] 4GB swap configured on each server
- [ ] Tailscale mesh network operational
- [ ] Servers can ping each other via Tailscale IPs
- [ ] Coolify dashboard accessible at http://31.220.55.252:8000
- [ ] VPS2 added as remote server in Coolify
- [ ] SSH connection test passes in Coolify
- [ ] Memory budgets validated

### Network Configuration
- [ ] Firewall rules configured (ports 22, 80, 443, 8000, 3000, 4000)
- [ ] Tailscale UDP port 41641 open
- [ ] Docker networks created
- [ ] No public exposure of internal services

## Troubleshooting

### Tailscale Connection Issues
```bash
# Check status
tailscale status

# View network diagnostics
tailscale netcheck

# Check firewall
sudo ufw status
```

### Coolify Connection Issues
```bash
# Check SSH on VPS2
sudo systemctl status sshd

# View SSH logs
sudo journalctl -u ssh -f

# Test Docker
docker version
```

### Memory Issues
```bash
# Check current usage
free -h

# View swap usage
swapon --show

# Monitor containers
docker stats
```

## Important IPs & URLs

| Service | URL/IP |
|---------|--------|
| VPS1 Public IP | 31.220.55.252 |
| VPS2 Public IP | 93.127.197.222 |
| VPS1 Tailscale IP | Run `tailscale ip -4` on VPS1 |
| VPS2 Tailscale IP | Run `tailscale ip -4` on VPS2 |
| Coolify Dashboard | http://31.220.55.252:8000 |

## Security Notes

1. **Use Tailscale IPs** for all inter-VPS communication
2. **Never expose** database or Redis ports publicly
3. **Keep swap** optimized with low swappiness (10)
4. **Monitor memory** usage to prevent OOM kills
5. **Regular backups** before major deployments

## Next Steps

After infrastructure setup is complete:

1. Deploy PostgreSQL 17 + pgvector to VPS2
2. Deploy Redis for job queues
3. Configure Windmill workflow engine
4. Deploy application containers
5. Set up Uptime Kuma monitoring

## Support

For issues or questions:
- Check logs: `docker logs [container-name]`
- Review Coolify dashboard for deployment status
- Monitor resources: `htop` or `docker stats`
- Verify network: `tailscale status`