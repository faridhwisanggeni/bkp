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
      expect(userRepo.getByEmailWithPassword).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
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
  });
});
