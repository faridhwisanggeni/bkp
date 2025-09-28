const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/database');

describe('Auth Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Setup test database or use test environment
    // This assumes you have a test database configured
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUser) {
      await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    }
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%test-integration%']);
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'test-integration@example.com',
        password: 'TestPassword123!',
        role_id: 2
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data).not.toHaveProperty('password');

      testUser = response.body.data;

      // Verify user exists in database
      const dbUser = await pool.query('SELECT * FROM users WHERE email = $1', [userData.email]);
      expect(dbUser.rows).toHaveLength(1);
      expect(dbUser.rows[0].email).toBe(userData.email);
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'Duplicate Test User',
        email: 'duplicate-test@example.com',
        password: 'TestPassword123!',
        role_id: 2
      };

      // First registration
      await request(app)
        .post('/auth/register')
        .send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already exists');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const userData = {
        name: 'Login Test User',
        email: 'login-test@example.com',
        password: 'TestPassword123!',
        role_id: 1
      };

      await request(app)
        .post('/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // Step 1: Register
      const userData = {
        name: 'Full Flow Test User',
        email: 'fullflow-test@example.com',
        password: 'TestPassword123!',
        role_id: 2
      };

      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);

      // Step 2: Login with registered credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('accessToken');

      // Step 3: Use token to access protected endpoint (if available)
      const token = loginResponse.body.accessToken;
      
      // This would test a protected endpoint if you have one
      // const protectedResponse = await request(app)
      //   .get('/api/profile')
      //   .set('Authorization', `Bearer ${token}`);
      // 
      // expect(protectedResponse.status).toBe(200);
    });
  });
});
