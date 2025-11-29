#!/bin/bash
# BollaLabz VPS2 (Application Workloads) Setup Script
# Server: 93.127.197.222
# Role: Application Services + Database

set -euo pipefail

echo "========================================="
echo "BollaLabz VPS2 Application Server Setup"
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

# Step 3: Install Docker (if not present)
echo "🐳 Step 3: Installing Docker"
echo "-----------------------------------------"

if command -v docker &> /dev/null; then
    echo "Docker is already installed"
    docker --version

    # Ensure Docker is running
    if systemctl is-active --quiet docker; then
        echo "✅ Docker service is running"
    else
        echo "Starting Docker service..."
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
else
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    check_status "Docker installation"

    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker

    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo "Note: You may need to log out and back in for docker group changes to take effect"
fi

# Verify Docker installation
docker version
echo ""

# Step 4: Install Tailscale
echo "🔐 Step 4: Installing Tailscale"
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

# Step 5: Prepare for Coolify Remote Connection
echo "🔑 Step 5: Preparing for Coolify Remote Connection"
echo "-----------------------------------------"

# Ensure SSH is properly configured
echo "Checking SSH configuration..."
if systemctl is-active --quiet sshd; then
    echo "✅ SSH service is running"
else
    echo "Starting SSH service..."
    sudo systemctl start sshd
    sudo systemctl enable sshd
fi

# Ensure .ssh directory exists with correct permissions
if [ ! -d ~/.ssh ]; then
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
fi

# Create authorized_keys if it doesn't exist
if [ ! -f ~/.ssh/authorized_keys ]; then
    touch ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
fi

echo "SSH is configured and ready for Coolify connection"
echo ""
echo "⚠️  IMPORTANT: After Tailscale is connected, you'll need to:"
echo "1. Get the SSH public key from Coolify dashboard"
echo "2. Add it to ~/.ssh/authorized_keys on this server"
echo ""

# Step 6: Firewall Configuration
echo "🔥 Step 6: Configuring Firewall"
echo "-----------------------------------------"

# Check if ufw is installed
if command -v ufw &> /dev/null; then
    echo "Configuring UFW firewall rules..."

    # Essential ports
    sudo ufw allow 22/tcp     # SSH
    sudo ufw allow 80/tcp     # HTTP
    sudo ufw allow 443/tcp    # HTTPS
    sudo ufw allow 3000/tcp   # Next.js app
    sudo ufw allow 4000/tcp   # Hono API
    sudo ufw allow 5432/tcp   # PostgreSQL (for internal access)
    sudo ufw allow 6379/tcp   # Redis (for internal access)
    sudo ufw allow 41641/udp  # Tailscale

    echo "Current firewall status:"
    sudo ufw status numbered
else
    echo "UFW not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y ufw

    # Configure after installation
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 3000/tcp
    sudo ufw allow 4000/tcp
    sudo ufw allow 5432/tcp
    sudo ufw allow 6379/tcp
    sudo ufw allow 41641/udp

    echo "UFW installed and configured (not enabled by default)"
fi

# Step 7: Install essential tools
echo ""
echo "🛠️  Step 7: Installing Essential Tools"
echo "-----------------------------------------"

# Update package list
sudo apt-get update

# Install useful tools
TOOLS="htop ncdu net-tools curl wget git vim nano"
echo "Installing: $TOOLS"
sudo apt-get install -y $TOOLS

# Step 8: Memory Budget Verification
echo ""
echo "📊 Step 8: Memory Budget Analysis"
echo "-----------------------------------------"

echo "Current Memory Usage:"
free -h

echo ""
echo "Disk Usage:"
df -h

echo ""
echo "Top 10 Memory Consumers:"
ps aux --sort=-%mem | head -11

# Step 9: Network Connectivity Test
echo ""
echo "🌐 Step 9: Network Connectivity Tests"
echo "-----------------------------------------"

echo "Public IP verification:"
curl -s ifconfig.me && echo ""

echo ""
echo "DNS resolution test:"
nslookup google.com | head -5

echo ""
echo "Docker network status:"
docker network ls

echo ""
echo "Tailscale status:"
if command -v tailscale &> /dev/null; then
    tailscale status 2>/dev/null || echo "Tailscale not connected yet"
else
    echo "Tailscale not installed"
fi

# Step 10: Prepare directories for services
echo ""
echo "📁 Step 10: Preparing Service Directories"
echo "-----------------------------------------"

# Create directories for persistent data
sudo mkdir -p /opt/bollalabz/{postgres,redis,apps}
sudo chown -R $USER:$USER /opt/bollalabz

echo "Created service directories:"
ls -la /opt/bollalabz/

# Final Summary
echo ""
echo "========================================="
echo "📝 VPS2 Setup Summary"
echo "========================================="
echo ""
echo "✅ Completed Tasks:"
echo "  • System information collected"
echo "  • 4GB swap configured with production settings"
echo "  • Docker installed and running"
echo "  • Tailscale installed (requires manual authentication)"
echo "  • SSH configured for remote access"
echo "  • Firewall rules configured"
echo "  • Essential tools installed"
echo "  • Service directories prepared"
echo ""
echo "⚠️  Required Actions:"
echo "  1. Run: sudo tailscale up"
echo "  2. Authenticate Tailscale in browser"
echo "  3. Note Tailscale IP: tailscale ip -4"
echo "  4. Add Coolify SSH key to ~/.ssh/authorized_keys"
echo "  5. Test connection from Coolify dashboard"
echo ""
echo "📌 Important Information:"
echo "  • Public IP: 93.127.197.222"
echo "  • Tailscale IP: Run 'tailscale ip -4' after auth"
echo "  • Docker: Installed and ready"
echo "  • Service Directory: /opt/bollalabz/"
echo ""
echo "💾 Memory Allocation Plan:"
echo "  • PostgreSQL: 2GB"
echo "  • Redis: 512MB"
echo "  • Next.js: 512MB"
echo "  • Hono API: 128MB"
echo "  • FastAPI: 512MB"
echo "  • Windmill: 300MB"
echo "  • Buffer: ~3.4GB"
echo ""
echo "========================================="