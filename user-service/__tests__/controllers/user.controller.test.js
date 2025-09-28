const request = require('supertest');
const express = require('express');
const UserController = require('../../src/controllers/user.controller');
const UserModel = require('../../src/models/user.model');

// Mock dependencies
jest.mock('../../src/models/user.model');

const app = express();
app.use(express.json());
app.get('/users', UserController.getAllUsers);
app.get('/users/:id', UserController.getUserById);
app.post('/users', UserController.createUser);
app.put('/users/:id', UserController.updateUser);

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@example.com', role_name: 'admin' },
        { id: 2, name: 'User 2', email: 'user2@example.com', role_name: 'sales' }
      ];

      UserModel.findAllWithRoles.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUsers);
      expect(UserModel.findAllWithRoles).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined
      });
    });

    it('should handle search parameter', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role_name: 'admin' }
      ];

      UserModel.findAllWithRoles.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users')
        .query({ search: 'john' });

      expect(response.status).toBe(200);
      expect(UserModel.findAllWithRoles).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'john'
      });
    });

    it('should handle server errors', async () => {
      UserModel.findAllWithRoles.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/users');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role_name: 'admin'
      };

      UserModel.findByIdWithRole.mockResolvedValue(mockUser);

      const response = await request(app).get('/users/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUser);
      expect(UserModel.findByIdWithRole).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent user', async () => {
      UserModel.findByIdWithRole.mockResolvedValue(null);

      const response = await request(app).get('/users/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).get('/users/invalid');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid user ID format');
    });
  });

  describe('POST /users', () => {
    it('should create a new user successfully', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role_id: 2
      };

      const createdUser = {
        id: 3,
        ...newUser,
        is_active: true,
        created_at: new Date()
      };

      UserModel.findByEmail.mockResolvedValue(null);
      UserModel.create.mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdUser);
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          name: 'Test'
          // missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate email', async () => {
      const existingUser = { id: 1, email: 'existing@example.com' };
      UserModel.findByEmail.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/users')
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

  describe('PUT /users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com',
        role_id: 2,
        is_active: true
      };

      const updatedUser = {
        id: 1,
        ...updateData,
        updated_at: new Date()
      };

      UserModel.findById.mockResolvedValue({ id: 1, email: 'old@example.com' });
      UserModel.findByEmail.mockResolvedValue(null);
      UserModel.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/users/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedUser);
    });

    it('should return 404 for non-existent user', async () => {
      UserModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/users/999')
        .send({
          name: 'Updated User',
          email: 'updated@example.com'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 409 for email conflict', async () => {
      UserModel.findById.mockResolvedValue({ id: 1, email: 'old@example.com' });
      UserModel.findByEmail.mockResolvedValue({ id: 2, email: 'conflict@example.com' });

      const response = await request(app)
        .put('/users/1')
        .send({
          name: 'Updated User',
          email: 'conflict@example.com'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already exists');
    });
  });
});
