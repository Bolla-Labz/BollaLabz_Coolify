#!/bin/bash
# Migration Execution Script for Railway
# Last Modified: 2025-11-23 18:40

echo "🚀 Running composite indexes migration..."
node backend/migrations/run-migration.js
