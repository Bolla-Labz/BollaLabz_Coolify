// Last Modified: 2025-11-23 17:30
import request from 'supertest';
import app from '../server.js';

describe('BollaLabz Backend API Tests', () => {
  let authToken;
  let testUser = {
    email: `test_${Date.now()}@bollalabz.com`,
    password: 'Test@Password123!',
    firstName: 'Test',
    lastName: 'User'
  };

  describe('Health Check', () => {
    test('GET /api/v1/health should return 200', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Authentication', () => {
    test('POST /api/v1/auth/register should create new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      authToken = response.body.token;
    });

    test('POST /api/v1/auth/login should authenticate user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      authToken = response.body.token;
    });

    test('GET /api/v1/auth/me should return current user', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(testUser.email);
    });

    test('POST /api/v1/auth/refresh should refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(authToken);
    });
  });

  describe('Contacts', () => {
    let contactId;

    test('POST /api/v1/contacts should create new contact', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '+15551234567'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Contact');
      contactId = response.body.id;
    });

    test('GET /api/v1/contacts should return contacts list', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET /api/v1/contacts/:id should return specific contact', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', contactId);
      expect(response.body.name).toBe('Test Contact');
    });

    test('PUT /api/v1/contacts/:id should update contact', async () => {
      const response = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Contact'
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Contact');
    });

    test('DELETE /api/v1/contacts/:id should delete contact', async () => {
      await request(app)
        .delete(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Tasks', () => {
    let taskId;

    test('POST /api/v1/tasks should create new task', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high',
          status: 'pending'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Task');
      taskId = response.body.id;
    });

    test('GET /api/v1/tasks should return tasks list', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('PUT /api/v1/tasks/:id should update task status', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed'
        })
        .expect(200);

      expect(response.body.status).toBe('completed');
    });
  });

  describe('Security', () => {
    test('Should reject requests without authentication', async () => {
      await request(app)
        .get('/api/v1/contacts')
        .expect(401);
    });

    test('Should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    test('Should handle SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: "admin' OR '1'='1",
          password: "' OR '1'='1"
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Should handle XSS attempts', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '<script>alert("XSS")</script>',
          email: 'test@test.com'
        })
        .expect(201);

      // Name should be sanitized
      expect(response.body.name).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    test('Should enforce rate limits', async () => {
      const requests = [];

      // Make many requests quickly
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/api/v1/health')
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);

      expect(rateLimited).toBeTruthy();
    });
  });

  describe('Data Validation', () => {
    test('Should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@Password123!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});