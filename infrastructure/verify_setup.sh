#!/bin/bash
# BollaLabz Infrastructure Verification Script
# Run this after both VPS servers are configured

set -euo pipefail

echo "========================================="
echo "BollaLabz Infrastructure Verification"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to check requirement
check_requirement() {
    echo -n "Checking: $1... "
    if eval $2 &>/dev/null; then
        print_status 0 "PASS"
        return 0
    else
        print_status 1 "FAIL"
        return 1
    fi
}

echo ""
echo "📋 System Requirements Check"
echo "-----------------------------------------"

# Check Ubuntu version
check_requirement "Ubuntu 24.04" "lsb_release -r | grep -q '24.04'"

# Check memory
TOTAL_MEM=$(free -b | grep '^Mem:' | awk '{print $2}')
REQUIRED_MEM=$((7 * 1024 * 1024 * 1024)) # 7GB in bytes

if [ $TOTAL_MEM -ge $REQUIRED_MEM ]; then
    print_status 0 "Memory: $(free -h | grep '^Mem:' | awk '{print $2}') (≥7GB required)"
else
    print_status 1 "Memory: $(free -h | grep '^Mem:' | awk '{print $2}') (≥7GB required)"
fi

# Check swap
check_requirement "Swap configured (4GB)" "[ -f /swapfile ] && swapon --show | grep -q swapfile"

# Check swappiness
SWAPPINESS=$(cat /proc/sys/vm/swappiness)
if [ $SWAPPINESS -eq 10 ]; then
    print_status 0 "Swappiness: $SWAPPINESS (production optimized)"
else
    print_status 1 "Swappiness: $SWAPPINESS (should be 10)"
fi

echo ""
echo "🔐 Tailscale Mesh Network"
echo "-----------------------------------------"

# Check Tailscale installation
check_requirement "Tailscale installed" "command -v tailscale"

# Check Tailscale connection
if tailscale status &>/dev/null; then
    print_status 0 "Tailscale connected"
    echo "Tailscale IP: $(tailscale ip -4 2>/dev/null || echo 'Not available')"

    # Show connected nodes
    echo ""
    echo "Connected Tailscale nodes:"
    tailscale status | grep -E "bollalabz|vps" || echo "No other nodes visible yet"
else
    print_status 1 "Tailscale not connected (run: sudo tailscale up)"
fi

echo ""
echo "🐳 Docker & Container Runtime"
echo "-----------------------------------------"

# Check Docker installation
check_requirement "Docker installed" "command -v docker"

# Check Docker service
check_requirement "Docker service running" "systemctl is-active --quiet docker"

# Check Docker version
if command -v docker &>/dev/null; then
    DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "unknown")
    echo "Docker version: $DOCKER_VERSION"
fi

# For VPS1 - Check Coolify
if [[ $(hostname -I | tr ' ' '\n' | grep -c "31.220.55.252") -gt 0 ]] || [[ $(hostname) == *"vps1"* ]]; then
    echo ""
    echo "🚀 Coolify Control Plane (VPS1)"
    echo "-----------------------------------------"

    # Check Coolify containers
    COOLIFY_RUNNING=$(docker ps | grep -c coolify || echo 0)
    if [ $COOLIFY_RUNNING -gt 0 ]; then
        print_status 0 "Coolify containers running"
        docker ps --format "table {{.Names}}\t{{.Status}}" | grep coolify
    else
        print_status 1 "Coolify containers not found"
    fi

    # Check Traefik
    if docker ps | grep -q traefik; then
        print_status 0 "Traefik proxy running"
    else
        print_status 1 "Traefik not running"
    fi

    echo ""
    echo "Dashboard URL: http://31.220.55.252:8000"
fi

echo ""
echo "🔥 Firewall Configuration"
echo "-----------------------------------------"

# Check if UFW is installed
if command -v ufw &>/dev/null; then
    UFW_STATUS=$(sudo ufw status | grep -c "Status: active" || echo 0)
    if [ $UFW_STATUS -gt 0 ]; then
        print_status 0 "UFW firewall active"

        # Check critical ports
        echo ""
        echo "Open ports:"
        sudo ufw status | grep ALLOW | head -10
    else
        print_status 1 "UFW installed but not active (consider: sudo ufw enable)"
    fi
else
    echo -e "${YELLOW}⚠️  UFW not installed${NC}"
fi

echo ""
echo "🌐 Network Connectivity"
echo "-----------------------------------------"

# Check external connectivity
check_requirement "Internet connectivity" "ping -c 1 -W 2 google.com"

# Check DNS resolution
check_requirement "DNS resolution" "nslookup google.com"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unable to determine")
echo "Public IP: $PUBLIC_IP"

# Memory usage summary
echo ""
echo "💾 Memory Usage Summary"
echo "-----------------------------------------"
free -h

echo ""
echo "📊 Disk Usage Summary"
echo "-----------------------------------------"
df -h | grep -E "^/dev|^Filesystem"

# Service readiness check
echo ""
echo "🎯 Service Readiness"
echo "-----------------------------------------"

READY_COUNT=0
TOTAL_CHECKS=8

# Count passed checks
[ -f /swapfile ] && ((READY_COUNT++))
command -v docker &>/dev/null && ((READY_COUNT++))
systemctl is-active --quiet docker && ((READY_COUNT++))
command -v tailscale &>/dev/null && ((READY_COUNT++))
tailscale status &>/dev/null && ((READY_COUNT++))
[ -d ~/.ssh ] && ((READY_COUNT++))
[ -f ~/.ssh/authorized_keys ] && ((READY_COUNT++))
ping -c 1 -W 2 google.com &>/dev/null && ((READY_COUNT++))

READINESS_PERCENT=$((READY_COUNT * 100 / TOTAL_CHECKS))

if [ $READINESS_PERCENT -ge 80 ]; then
    echo -e "${GREEN}Server readiness: $READINESS_PERCENT% ($READY_COUNT/$TOTAL_CHECKS checks passed)${NC}"
elif [ $READINESS_PERCENT -ge 60 ]; then
    echo -e "${YELLOW}Server readiness: $READINESS_PERCENT% ($READY_COUNT/$TOTAL_CHECKS checks passed)${NC}"
else
    echo -e "${RED}Server readiness: $READINESS_PERCENT% ($READY_COUNT/$TOTAL_CHECKS checks passed)${NC}"
fi

# Final recommendations
echo ""
echo "========================================="
echo "📝 Next Steps"
echo "========================================="

if ! tailscale status &>/dev/null; then
    echo "1. Connect Tailscale: sudo tailscale up"
fi

if [[ $(hostname -I | tr ' ' '\n' | grep -c "31.220.55.252") -gt 0 ]]; then
    echo "2. Access Coolify dashboard at http://31.220.55.252:8000"
    echo "3. Add VPS2 as remote server using its Tailscale IP"
fi

if [[ $(hostname -I | tr ' ' '\n' | grep -c "93.127.197.222") -gt 0 ]]; then
    echo "2. Add Coolify's SSH key to ~/.ssh/authorized_keys"
    echo "3. Test connection from Coolify dashboard"
fi

echo ""
echo "========================================="