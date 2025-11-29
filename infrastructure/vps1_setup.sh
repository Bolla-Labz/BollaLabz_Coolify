#!/bin/bash
# BollaLabz VPS1 (Control Plane) Setup Script
# Server: 31.220.55.252
# Role: Coolify Control Plane + Tailscale Mesh

set -euo pipefail

echo "========================================="
echo "BollaLabz VPS1 Control Plane Setup"
echo "========================================="

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# Step 1: System Information
echo ""
echo "📋 Step 1: Verifying System Information"
echo "-----------------------------------------"
uname -a
cat /etc/os-release
free -h
df -h
echo ""

# Step 2: Configure Swap (4GB)
echo "💾 Step 2: Configuring 4GB Swap"
echo "-----------------------------------------"

# Check if swap already exists
if [ -f /swapfile ]; then
    echo "Swap file already exists. Checking current configuration..."
    free -h
    swapon --show
else
    echo "Creating 4GB swap file..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile

    # Make swap permanent
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi

    check_status "Swap creation"
fi

# Optimize for production (low swappiness)
echo "Optimizing swap for production..."
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=50

# Make sysctl settings permanent
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
fi

if ! grep -q "vm.vfs_cache_pressure" /etc/sysctl.conf; then
    echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf
fi

echo "Swap configuration complete:"
free -h
swapon --show
echo ""

# Step 3: Install Tailscale
echo "🔐 Step 3: Installing Tailscale"
echo "-----------------------------------------"

# Check if Tailscale is already installed
if command -v tailscale &> /dev/null; then
    echo "Tailscale is already installed"
    tailscale --version
else
    echo "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
    check_status "Tailscale installation"
fi

echo ""
echo "⚠️  MANUAL ACTION REQUIRED:"
echo "Run: sudo tailscale up"
echo "Follow the URL to authenticate with your Tailscale account"
echo "After authentication, run: tailscale ip -4"
echo "Note the assigned Tailscale IP (100.x.x.x)"
echo ""

# Step 4: Verify Coolify Installation
echo "🚀 Step 4: Verifying Coolify Installation"
echo "-----------------------------------------"

# Check if Docker is running
if systemctl is-active --quiet docker; then
    echo "✅ Docker is running"
    docker version --format 'Docker version: {{.Server.Version}}'
else
    echo "❌ Docker is not running"
    echo "Attempting to start Docker..."
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Check for Coolify containers
echo ""
echo "Checking Coolify containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(coolify|traefik)" || echo "No Coolify containers found"

echo ""
echo "Checking Coolify logs (last 20 lines)..."
docker logs coolify --tail 20 2>&1 || echo "Could not retrieve Coolify logs"

# Step 5: Firewall Configuration
echo ""
echo "🔥 Step 5: Configuring Firewall"
echo "-----------------------------------------"

# Check if ufw is installed and active
if command -v ufw &> /dev/null; then
    echo "Configuring UFW firewall rules..."

    # Essential ports
    sudo ufw allow 22/tcp     # SSH
    sudo ufw allow 8000/tcp   # Coolify dashboard
    sudo ufw allow 80/tcp     # HTTP
    sudo ufw allow 443/tcp    # HTTPS
    sudo ufw allow 41641/udp  # Tailscale

    echo "Current firewall status:"
    sudo ufw status numbered
else
    echo "UFW not installed. Skipping firewall configuration."
fi

# Step 6: Memory Budget Verification
echo ""
echo "📊 Step 6: Memory Budget Analysis"
echo "-----------------------------------------"

echo "Current Memory Usage:"
free -h

echo ""
echo "Docker Container Memory Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "Top 10 Memory Consumers:"
ps aux --sort=-%mem | head -11

# Step 7: Network Connectivity Test
echo ""
echo "🌐 Step 7: Network Connectivity Tests"
echo "-----------------------------------------"

echo "Public IP verification:"
curl -s ifconfig.me && echo ""

echo ""
echo "DNS resolution test:"
nslookup google.com | head -5

echo ""
echo "Tailscale status:"
if command -v tailscale &> /dev/null; then
    tailscale status 2>/dev/null || echo "Tailscale not connected yet"
else
    echo "Tailscale not installed"
fi

# Final Summary
echo ""
echo "========================================="
echo "📝 VPS1 Setup Summary"
echo "========================================="
echo ""
echo "✅ Completed Tasks:"
echo "  • System information collected"
echo "  • 4GB swap configured with production settings"
echo "  • Tailscale installed (requires manual authentication)"
echo "  • Docker and Coolify status verified"
echo "  • Firewall rules configured"
echo "  • Memory budget analyzed"
echo ""
echo "⚠️  Required Actions:"
echo "  1. Run: sudo tailscale up"
echo "  2. Authenticate Tailscale in browser"
echo "  3. Note Tailscale IP: tailscale ip -4"
echo "  4. Access Coolify at http://31.220.55.252:8000"
echo "  5. Complete Coolify initial setup if needed"
echo ""
echo "📌 Important IPs:"
echo "  • Public IP: 31.220.55.252"
echo "  • Tailscale IP: Run 'tailscale ip -4' after auth"
echo "  • Coolify Dashboard: http://31.220.55.252:8000"
echo ""
echo "========================================="