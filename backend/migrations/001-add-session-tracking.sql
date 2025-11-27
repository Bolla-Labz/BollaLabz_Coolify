-- Last Modified: 2025-11-23 17:30
-- Migration: Add IP address and user agent tracking to user sessions
-- Date: 2025-11-11
-- Purpose: Security enhancement - track session origin for anomaly detection

-- Add columns for session tracking
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),  -- IPv6 max length
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add index for IP-based queries (security monitoring)
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON user_sessions(ip_address);

-- Add index for finding sessions by user+IP combination
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_ip ON user_sessions(user_id, ip_address);

COMMENT ON COLUMN user_sessions.ip_address IS 'IP address from which session was created (for security monitoring)';
COMMENT ON COLUMN user_sessions.user_agent IS 'User agent string (for device tracking and security)';
