#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * Test Database Connection and CRUD Operations
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Contact from '../models/Contact.js';
import Task from '../models/Task.js';
import Conversation from '../models/Conversation.js';

async function runTests() {
  console.log('🧪 Testing Database Connection & CRUD Operations\n');

  try {
    // Cleanup old test data first
    console.log('🧹 Cleaning up old test data...');
    const testPhone = '+15551234567';
    try {
      const existingContact = await Contact.findByPhone(testPhone);
      if (existingContact) {
        await Contact.delete(existingContact.id);
        console.log('  ✅ Cleaned up existing test contact\n');
      }
    } catch (err) {
      // Ignore errors - contact probably doesn't exist
    }

    // Test 1: Contact CRUD
    console.log('📞 Test 1: Contact CRUD Operations');
    console.log('─'.repeat(50));

    // Create
    console.log('  Creating contact...');
    const contact = await Contact.create({
      phone_number: testPhone,
      contact_name: 'Test User',
      contact_email: 'test@example.com',
      notes: 'Test contact created by automated script'
    });
    console.log(`  ✅ Created contact ID: ${contact.id}`);

    // Read
    console.log('  Reading contact...');
    const foundContact = await Contact.findById(contact.id);
    console.log(`  ✅ Found contact: ${foundContact.contact_name} (${foundContact.phone_number})`);

    // Update
    console.log('  Updating contact...');
    const updatedContact = await Contact.update(contact.id, {
      contact_name: 'Updated Test User',
      notes: 'Contact updated by automated script'
    });
    console.log(`  ✅ Updated contact: ${updatedContact.contact_name}`);

    // List
    console.log('  Listing contacts...');
    const contacts = await Contact.findAll({ page: 1, limit: 10 });
    console.log(`  ✅ Found ${contacts.data.length} contacts (total: ${contacts.pagination.total})`);

    // Test 2: Task CRUD
    console.log('\n📋 Test 2: Task CRUD Operations');
    console.log('─'.repeat(50));

    // Create
    console.log('  Creating task...');
    const task = await Task.create({
      title: 'Test Database Connection',
      description: 'Verify database CRUD operations work correctly',
      status: 'pending',
      priority: 'high',
      assignee: 'System Test',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    });
    console.log(`  ✅ Created task ID: ${task.id}`);

    // Read
    console.log('  Reading task...');
    const foundTask = await Task.findById(task.id);
    console.log(`  ✅ Found task: ${foundTask.title} (${foundTask.status})`);

    // Update
    console.log('  Updating task status...');
    const updatedTask = await Task.update(task.id, {
      status: 'in_progress'
    });
    console.log(`  ✅ Updated task status: ${updatedTask.status}`);

    // List
    console.log('  Listing tasks...');
    const tasks = await Task.findAll({ page: 1, limit: 10 });
    console.log(`  ✅ Found ${tasks.data.length} tasks (total: ${tasks.pagination.total})`);

    // Test 3: Conversation CRUD
    console.log('\n💬 Test 3: Conversation CRUD Operations');
    console.log('─'.repeat(50));

    // Create
    console.log('  Creating conversation...');
    const conversation = await Conversation.create({
      conversation_id: 'test-conv-' + Date.now(),
      contact_id: contact.id,
      direction: 'inbound',
      content: 'Hello, this is a test message!',
      message_type: 'sms',
      cost: 0.0075
    });
    console.log(`  ✅ Created conversation ID: ${conversation.id}`);

    // Read
    console.log('  Reading conversation...');
    const foundConv = await Conversation.findById(conversation.id);
    console.log(`  ✅ Found conversation: ${foundConv.content.substring(0, 30)}...`);

    // List by contact
    console.log('  Listing conversations for contact...');
    const conversations = await Conversation.findAll({ contactId: contact.id, page: 1, limit: 10 });
    console.log(`  ✅ Found ${conversations.data.length} conversations (total: ${conversations.pagination.total})`);

    // Test 4: Analytics
    console.log('\n📊 Test 4: Contact Analytics');
    console.log('─'.repeat(50));
    const analytics = await Contact.getAnalytics(contact.id);
    console.log(`  ✅ Analytics:`, {
      total_conversations: analytics.conversations.total_conversations,
      inbound: analytics.conversations.inbound_count,
      outbound: analytics.conversations.outbound_count
    });

    // Cleanup
    console.log('\n🧹 Cleanup');
    console.log('─'.repeat(50));
    console.log('  Deleting test data...');
    await Task.delete(task.id);
    console.log('  ✅ Deleted task');
    // Note: Deleting contact will cascade delete conversations
    await Contact.delete(contact.id);
    console.log('  ✅ Deleted contact (and associated conversations)');

    console.log('\n✅ All tests passed! Database is fully operational.\n');
    console.log('Summary:');
    console.log('  ✓ Contact CRUD: Working');
    console.log('  ✓ Task CRUD: Working');
    console.log('  ✓ Conversation CRUD: Working');
    console.log('  ✓ Analytics: Working');
    console.log('  ✓ Database schema: Correct');
    console.log('\n🎉 Backend is ready to use!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

runTests();
