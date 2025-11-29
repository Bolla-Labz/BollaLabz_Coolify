# Coolify Remote Server Configuration Guide

## Adding VPS2 as Remote Server in Coolify

After both VPS servers are configured with Tailscale, follow these steps to connect VPS2 to Coolify.

### Prerequisites Checklist

- [ ] VPS1 (31.220.55.252) has Tailscale connected
- [ ] VPS2 (93.127.197.222) has Tailscale connected
- [ ] Both servers can ping each other via Tailscale IPs
- [ ] Docker is installed and running on VPS2
- [ ] SSH is accessible on VPS2

### Step 1: Get Tailscale IPs

On **VPS1** (Control Plane):
```bash
tailscale ip -4
# Note this IP (e.g., 100.64.1.1)
```

On **VPS2** (Application Server):
```bash
tailscale ip -4
# Note this IP (e.g., 100.64.1.2)
```

### Step 2: Test Connectivity

From **VPS1**, test connection to VPS2:
```bash
# Replace with actual VPS2 Tailscale IP
ping 100.64.1.2

# Test SSH connectivity
ssh root@100.64.1.2
```

### Step 3: Configure Coolify

1. Access Coolify dashboard: http://31.220.55.252:8000

2. Navigate to **Servers** → **Add Server**

3. Select **"Remote Server"**

4. Configure with these settings:

   ```yaml
   Server Details:
     Name: bollalabz-app
     Description: VPS2 Application Workloads

   Connection:
     IP Address: [VPS2 Tailscale IP - e.g., 100.64.1.2]
     Port: 22
     User: root

   Advanced:
     Proxy: Disabled (Coolify manages from VPS1)
     Docker Network: bollalabz_default
   ```

### Step 4: SSH Key Setup

1. In Coolify, after entering server details, it will show an SSH public key

2. Copy the entire SSH key (starts with `ssh-ed25519` or `ssh-rsa`)

3. On **VPS2**, add the key:
   ```bash
   # Open the authorized_keys file
   nano ~/.ssh/authorized_keys

   # Paste the Coolify SSH key on a new line
   # Save and exit (Ctrl+X, Y, Enter)

   # Verify permissions
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```

### Step 5: Test Connection

1. In Coolify dashboard, click **"Test Connection"**

2. You should see:
   - ✅ SSH connection successful
   - ✅ Docker detected
   - ✅ Docker version: [version]

3. If connection fails, check:
   ```bash
   # On VPS2, check SSH logs
   sudo journalctl -u ssh -f

   # Verify Tailscale is running
   tailscale status

   # Check firewall isn't blocking
   sudo ufw status
   ```

### Step 6: Verify Server in Coolify

After successful connection:

1. The server should appear in the **Servers** list
2. Status should show as **"Online"**
3. Resource usage should be visible

### Troubleshooting Common Issues

#### Connection Timeout

```bash
# On VPS2, ensure SSH is listening on all interfaces
sudo nano /etc/ssh/sshd_config

# Check these settings:
ListenAddress 0.0.0.0
PermitRootLogin yes
PubkeyAuthentication yes

# Restart SSH if changed
sudo systemctl restart sshd
```

#### Docker Not Detected

```bash
# On VPS2, verify Docker
docker version
sudo systemctl status docker

# If not running
sudo systemctl start docker
sudo systemctl enable docker
```

#### Tailscale Routing Issues

```bash
# On both servers, check Tailscale ACLs
tailscale status
tailscale ping [other-server-tailscale-ip]

# Ensure both are on same Tailscale network
tailscale netcheck
```

### Step 7: Deploy Test Application

Once VPS2 is connected:

1. Create new **Project** in Coolify
2. Add **Resource** → **Application**
3. Select **bollalabz-app** as deployment server
4. Deploy a simple test app to verify

### Memory Allocation Reminder

When deploying services to VPS2, respect these limits:

| Service | Memory Limit |
|---------|-------------|
| PostgreSQL | 2048MB |
| Redis | 512MB |
| Next.js | 512MB |
| Hono API | 128MB |
| FastAPI | 512MB |
| Windmill | 300MB |
| **Total** | ~4GB |
| **Buffer** | ~3.4GB |

### Post-Setup Verification

Run on **VPS2**:
```bash
# Check Docker containers deployed by Coolify
docker ps

# Monitor resource usage
docker stats

# Check available memory
free -h

# Verify Coolify network
docker network ls | grep coolify
```

## Success Indicators

✅ VPS2 shows as "Online" in Coolify dashboard
✅ Can deploy containers to VPS2 from Coolify
✅ Containers run on Tailscale network
✅ Resource monitoring works in Coolify
✅ No public IP exposure for internal services

## Next Steps

1. Deploy PostgreSQL + pgvector to VPS2
2. Deploy Redis for caching/queues
3. Deploy application containers
4. Configure Traefik routing from VPS1
5. Set up monitoring with Uptime Kuma