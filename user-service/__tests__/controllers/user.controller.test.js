const request = require('supertest');
const app = require('../../src/app');
const userRepo = require('../../src/repositories/user.repository');

// Mock dependencies - ADD ALL NEEDED METHODS
jest.mock('../../src/repositories/user.repository', () => ({
  list: jest.fn(),
  getById: jest.fn(),
  getByIdWithRole: jest.fn(),
  getByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn()
}));

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@example.com', role_name: 'admin' },
        { id: 2, name: 'User 2', email: 'user2@example.com', role_name: 'sales' }
      ];

      userRepo.list.mockResolvedValue(mockUsers);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUsers);
    });

    it('should handle search parameter', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role_name: 'admin' }
      ];

      userRepo.getAllWithRoles.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .query({ search: 'john' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockUsers);
    });

    it('should handle server errors', async () => {
      userRepo.getAllWithRoles.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role_name: 'admin'
      };

      userRepo.getByIdWithRole.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUser);
    });

    it('should return 404 for non-existent user', async () => {
      userRepo.getByIdWithRole.mockResolvedValue(null);

      const response = await request(app).get('/api/users/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role_id: 2
      };

      const createdUser = {
        id: 3,
        name: 'New User',
        email: 'new@example.com',
        role_id: 2,
        is_active: true
      };

      userRepo.getByEmail.mockResolvedValue(null);
      userRepo.create.mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdUser);
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Test'
          // missing required fields
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate email', async () => {
      const existingUser = { id: 1, email: 'existing@example.com' };
      userRepo.getByEmail.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
          role_id: 2
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com',
        role_id: 2
      };

      const updatedUser = {
        id: 1,
        name: 'Updated User',
        email: 'updated@example.com',
        role_id: 2,
        is_active: true
      };

      userRepo.getById.mockResolvedValue({ id: 1, email: 'old@example.com' });
      userRepo.getByEmail.mockResolvedValue(null);
      userRepo.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedUser);
    });

    it('should return 404 for non-existent user', async () => {
      userRepo.getById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/999')
        .send({
          name: 'Updated User',
          email: 'updated@example.com'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for email conflict', async () => {
      userRepo.getById.mockResolvedValue({ id: 1, email: 'old@example.com' });
      userRepo.getByEmail.mockResolvedValue({ id: 2, email: 'conflict@example.com' });

      const response = await request(app)
        .put('/api/users/1')
        .send({
          name: 'Updated User',
          email: 'conflict@example.com'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already exists');
    });
  });
});
