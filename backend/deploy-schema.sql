-- Last Modified: 2025-11-23 17:30
-- BollaLabz Database Schema
-- Complete schema for PostgreSQL
-- Modified for Railway deployment
-- Date: 2025-11-22

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Tables

-- Users (Authentication) - Production-grade security
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    profile_image_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    role VARCHAR(50) DEFAULT 'user',

    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    account_locked_until TIMESTAMP,

    -- Authentication Security
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    password_changed_at TIMESTAMP,

    -- Email Verification
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,

    -- Password Reset
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,

    -- Session Management
    refresh_token_hash VARCHAR(255),
    refresh_token_expires TIMESTAMP,

    -- Two-Factor Authentication (2FA)
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_backup_codes TEXT[],

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- User Sessions (for refresh token management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phone Contacts (Master contact list)
CREATE TABLE IF NOT EXISTS phone_contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    conversation_count INTEGER DEFAULT 0,
    last_contact_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: phone number unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_contacts_user_phone_unique ON phone_contacts(user_id, phone_number);
-- Index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_phone_contacts_user_id ON phone_contacts(user_id);

-- Conversation Messages (SMS/Voice transcripts)
CREATE TABLE IF NOT EXISTS conversation_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID DEFAULT uuid_generate_v4(),
    contact_id INTEGER REFERENCES phone_contacts(id) ON DELETE CASCADE,
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(20) CHECK (message_type IN ('sms', 'voice', 'email')),
    message_content TEXT NOT NULL,
    transcript TEXT,
    sentiment VARCHAR(20),
    ai_summary TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for multi-tenant message queries
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_contact ON conversation_messages(user_id, contact_id);

-- Call Costs (Track every communication cost)
CREATE TABLE IF NOT EXISTS call_costs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    conversation_message_id INTEGER REFERENCES conversation_messages(id) ON DELETE CASCADE,
    service_provider VARCHAR(50),
    service_type VARCHAR(20) CHECK (service_type IN ('sms', 'voice', 'ai')),
    cost_amount DECIMAL(10,6) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for cost tracking queries
CREATE INDEX IF NOT EXISTS idx_call_costs_user_id ON call_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_costs_user_service ON call_costs(user_id, service_type);

-- Scheduled Tasks (Task management with dependencies)
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    task_description TEXT,
    task_type VARCHAR(50),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'failed')),
    scheduled_for TIMESTAMP,
    completed_at TIMESTAMP,
    depends_on INTEGER REFERENCES scheduled_tasks(id) ON DELETE SET NULL,
    assigned_to VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for multi-tenant task queries
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id ON scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_status ON scheduled_tasks(user_id, status);

-- Workflow Triggers (Webhook automation)
CREATE TABLE IF NOT EXISTS workflow_triggers (
    id SERIAL PRIMARY KEY,
    trigger_name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50),
    webhook_url TEXT,
    conditions JSONB,
    actions JSONB,
    is_active BOOLEAN DEFAULT true,
    hit_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extended Tables

-- People (Comprehensive relationship profiles)
CREATE TABLE IF NOT EXISTS people (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES phone_contacts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    birthday DATE,
    company VARCHAR(255),
    job_title VARCHAR(255),
    relationship_type VARCHAR(50),
    relationship_strength INTEGER CHECK (relationship_strength BETWEEN 1 AND 10),
    linkedin_url VARCHAR(500),
    twitter_handle VARCHAR(100),
    address TEXT,
    timezone VARCHAR(50),
    preferences JSONB,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationship Interactions (Track all touchpoints)
CREATE TABLE IF NOT EXISTS relationship_interactions (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50),
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    interaction_summary TEXT,
    sentiment VARCHAR(20),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Events (Calendar integration)
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_type VARCHAR(50),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(500),
    attendees JSONB,
    reminder_minutes INTEGER,
    is_all_day BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(255),
    external_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_refresh_token_hash ON users(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Phone Contacts
CREATE INDEX IF NOT EXISTS idx_phone_contacts_number ON phone_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_contacts_active ON phone_contacts(is_active);

-- Conversation Messages
CREATE INDEX IF NOT EXISTS idx_conversation_messages_contact ON conversation_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_type ON conversation_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created ON conversation_messages(created_at DESC);

-- Call Costs
CREATE INDEX IF NOT EXISTS idx_call_costs_message ON call_costs(conversation_message_id);
CREATE INDEX IF NOT EXISTS idx_call_costs_billing_date ON call_costs(billing_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_costs_service_type ON call_costs(service_type);

-- Scheduled Tasks
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled ON scheduled_tasks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_priority ON scheduled_tasks(priority DESC);

-- Workflow Triggers
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_active ON workflow_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_type ON workflow_triggers(trigger_type);

-- People
CREATE INDEX IF NOT EXISTS idx_people_contact ON people(contact_id);
CREATE INDEX IF NOT EXISTS idx_people_name ON people(full_name);
CREATE INDEX IF NOT EXISTS idx_people_tags ON people USING GIN(tags);

-- Relationship Interactions
CREATE INDEX IF NOT EXISTS idx_relationship_interactions_person ON relationship_interactions(person_id);
CREATE INDEX IF NOT EXISTS idx_relationship_interactions_date ON relationship_interactions(interaction_date DESC);

-- Calendar Events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

-- Triggers for updated_at

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phone_contacts_updated_at BEFORE UPDATE ON phone_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversation_messages_updated_at BEFORE UPDATE ON conversation_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_tasks_updated_at BEFORE UPDATE ON scheduled_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_triggers_updated_at BEFORE UPDATE ON workflow_triggers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Schema deployment completed
SELECT 'Schema deployment completed' as status;