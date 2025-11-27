#!/bin/bash
# Last Modified: 2025-11-25 03:30
# BollaLabz Frontend Docker Build Script
# Automates building and pushing Docker images with proper tagging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="${IMAGE_NAME:-bollalabz/frontend}"
REGISTRY="${REGISTRY:-docker.io}"
BUILD_TARGET="${BUILD_TARGET:-production}"

# Parse command line arguments
PUSH_IMAGE=false
TAG="latest"
PLATFORM="linux/amd64"

while [[ $# -gt 0 ]]; do
  case $1 in
    --push)
      PUSH_IMAGE=true
      shift
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    --target)
      BUILD_TARGET="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --help)
      echo "Usage: ./docker-build.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --push           Push image to registry after build"
      echo "  --tag TAG        Tag for the image (default: latest)"
      echo "  --target TARGET  Build target (production or node-server, default: production)"
      echo "  --platform PLAT  Platform to build for (default: linux/amd64)"
      echo "  --help           Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./docker-build.sh                        # Build nginx version locally"
      echo "  ./docker-build.sh --target node-server   # Build Node.js version"
      echo "  ./docker-build.sh --push --tag v1.0.0    # Build and push with tag"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Print configuration
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}BollaLabz Frontend Docker Build${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Image: ${GREEN}${IMAGE_NAME}:${TAG}${NC}"
echo -e "Target: ${GREEN}${BUILD_TARGET}${NC}"
echo -e "Platform: ${GREEN}${PLATFORM}${NC}"
echo -e "Push: ${GREEN}${PUSH_IMAGE}${NC}"
echo ""

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo -e "${YELLOW}Loading environment variables from .env${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Build arguments
BUILD_ARGS=(
  --build-arg VITE_API_URL="${VITE_API_URL:-/api}"
  --build-arg VITE_WS_URL="${VITE_WS_URL:-/ws}"
  --build-arg VITE_USE_MOCKS="${VITE_USE_MOCKS:-false}"
  --build-arg VITE_ENVIRONMENT="${VITE_ENVIRONMENT:-production}"
)

# Add Sentry args if available
if [ -n "$VITE_SENTRY_DSN" ]; then
  BUILD_ARGS+=(--build-arg VITE_SENTRY_DSN="$VITE_SENTRY_DSN")
fi

if [ -n "$SENTRY_AUTH_TOKEN" ]; then
  BUILD_ARGS+=(--build-arg SENTRY_AUTH_TOKEN="$SENTRY_AUTH_TOKEN")
fi

if [ -n "$SENTRY_ORG" ]; then
  BUILD_ARGS+=(--build-arg SENTRY_ORG="$SENTRY_ORG")
fi

# Build the image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build \
  --target "$BUILD_TARGET" \
  --platform "$PLATFORM" \
  --tag "${IMAGE_NAME}:${TAG}" \
  --tag "${IMAGE_NAME}:latest" \
  "${BUILD_ARGS[@]}" \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build successful!${NC}"
else
  echo -e "${RED}✗ Build failed!${NC}"
  exit 1
fi

# Show image details
echo ""
echo -e "${YELLOW}Image details:${NC}"
docker images "${IMAGE_NAME}" | grep -E "REPOSITORY|${TAG}|latest"

# Push to registry if requested
if [ "$PUSH_IMAGE" = true ]; then
  echo ""
  echo -e "${YELLOW}Pushing image to registry...${NC}"

  docker push "${IMAGE_NAME}:${TAG}"
  if [ "$TAG" != "latest" ]; then
    docker push "${IMAGE_NAME}:latest"
  fi

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Push successful!${NC}"
  else
    echo -e "${RED}✗ Push failed!${NC}"
    exit 1
  fi
fi

# Print next steps
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  ${YELLOW}Test locally:${NC}"
echo -e "    docker run -p 8080:80 ${IMAGE_NAME}:${TAG}"
echo -e "    # Visit http://localhost:8080"
echo ""
echo -e "  ${YELLOW}Run with docker-compose:${NC}"
echo -e "    docker-compose -f docker-compose.frontend.yml up -d"
echo ""
echo -e "  ${YELLOW}Push to registry:${NC}"
echo -e "    ./docker-build.sh --push --tag ${TAG}"
echo ""
