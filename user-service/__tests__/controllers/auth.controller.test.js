const request = require('supertest');
const app = require('../../src/app');
const userRepo = require('../../src/repositories/user.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies - ONLY MOCK METHODS THAT EXIST
jest.mock('../../src/repositories/user.repository', () => ({
  getByEmailWithPassword: jest.fn(),
  getByIdWithRole: jest.fn()
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        role_name: 'admin',
        is_active: true
      };

      userRepo.getByEmailWithPassword.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockAccessToken');

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(userRepo.getByEmailWithPassword).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for invalid credentials', async () => {
      userRepo.getByEmailWithPassword.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for inactive user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        role_name: 'admin',
        is_active: false
      };

      userRepo.getByEmailWithPassword.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle server errors', async () => {
      userRepo.getByEmailWithPassword.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /refresh', () => {
    it('should refresh token successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role_name: 'admin'
      };

      const mockDecoded = { sub: 1 };
      
      jwt.verify.mockReturnValue(mockDecoded);
      userRepo.getByIdWithRole.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('newAccessToken');

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'validRefreshToken'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(userRepo.getByIdWithRole).toHaveBeenCalledWith(1);
    });

    it('should return 401 for invalid refresh token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalidToken'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or expired refresh token');
    });

    it('should return 401 for non-existent user', async () => {
      const mockDecoded = { sub: 999 };
      
      jwt.verify.mockReturnValue(mockDecoded);
      userRepo.getByIdWithRole.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'validRefreshToken'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token subject');
    });
  });
});
