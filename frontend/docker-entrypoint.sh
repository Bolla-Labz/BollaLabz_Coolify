#!/bin/sh
# Last Modified: 2025-11-25 00:00
# BollaLabz Frontend Docker Entrypoint
# Injects runtime environment variables into built frontend bundle

set -e

echo "=== BollaLabz Frontend Docker Entrypoint ==="
echo "Starting frontend service with runtime environment injection..."

# Default values if not provided
export API_URL="${API_URL:-${VITE_API_URL:-http://localhost:3001/api/v1}}"
export WS_URL="${WS_URL:-${VITE_WS_URL:-ws://localhost:3001}}"
export ENVIRONMENT="${ENVIRONMENT:-${VITE_ENVIRONMENT:-production}}"
export USE_MOCKS="${USE_MOCKS:-${VITE_USE_MOCKS:-false}}"

echo "Configuration:"
echo "  API_URL: $API_URL"
echo "  WS_URL: $WS_URL"
echo "  ENVIRONMENT: $ENVIRONMENT"
echo "  USE_MOCKS: $USE_MOCKS"

# Path to the built index.html
DIST_DIR="/app/dist"
INDEX_FILE="$DIST_DIR/index.html"

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "ERROR: dist/ directory not found at $DIST_DIR"
    echo "Build artifacts are missing. Did the build step complete successfully?"
    exit 1
fi

# Check if index.html exists
if [ ! -f "$INDEX_FILE" ]; then
    echo "ERROR: index.html not found at $INDEX_FILE"
    echo "Build artifacts are missing. Did the build step complete successfully?"
    exit 1
fi

echo "Found build artifacts in $DIST_DIR"

# Create runtime config file that can override build-time values
# This approach uses a runtime-loaded config instead of modifying HTML
cat > "$DIST_DIR/runtime-config.js" <<EOF
// Runtime environment configuration
// Generated at container startup: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
window.__RUNTIME_CONFIG__ = {
  API_URL: '${API_URL}',
  WS_URL: '${WS_URL}',
  ENVIRONMENT: '${ENVIRONMENT}',
  USE_MOCKS: ${USE_MOCKS}
};

// Log runtime configuration (only in development)
if (window.__RUNTIME_CONFIG__.ENVIRONMENT !== 'production') {
  console.log('Runtime Config:', window.__RUNTIME_CONFIG__);
}
EOF

echo "Created runtime-config.js with environment-specific settings"

# Inject runtime config script into index.html head (if not already present)
if ! grep -q "runtime-config.js" "$INDEX_FILE"; then
    echo "Injecting runtime-config.js into index.html..."

    # Create backup
    cp "$INDEX_FILE" "$INDEX_FILE.backup"

    # Inject script tag into head section
    sed -i 's|</head>|  <script src="/runtime-config.js"></script>\n  </head>|' "$INDEX_FILE"

    echo "Runtime config injection complete"
else
    echo "Runtime config already injected, skipping..."
fi

# List files in dist for debugging
echo ""
echo "Build artifacts:"
ls -lh "$DIST_DIR" | head -20

# Check if key files exist
echo ""
echo "Verifying critical files:"
for file in index.html runtime-config.js sw.js; do
    if [ -f "$DIST_DIR/$file" ]; then
        echo "  ✓ $file exists ($(stat -c%s "$DIST_DIR/$file") bytes)"
    else
        echo "  ✗ $file missing"
    fi
done

# Start the Node.js server
echo ""
echo "Starting Node.js static file server..."
echo "Listening on port ${PORT:-8080}"
echo ""

exec node serve-frontend.js
