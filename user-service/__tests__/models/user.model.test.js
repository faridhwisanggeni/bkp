const UserModel = require('../../src/models/user.model');
const pool = require('../../src/config/database');

// Mock database pool
jest.mock('../../src/config/database');

describe('UserModel', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.query = jest.fn();
    pool.connect = jest.fn().mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role_id: 1
      };

      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserModel.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should return null if user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await UserModel.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(UserModel.findByEmail('test@example.com'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('findByEmailWithRole', () => {
    it('should find user with role information', async () => {
      const mockUserWithRole = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role_id: 1,
        role_name: 'admin',
        is_active: true
      };

      pool.query.mockResolvedValue({ rows: [mockUserWithRole] });

      const result = await UserModel.findByEmailWithRole('test@example.com');

      expect(result).toEqual(mockUserWithRole);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN roles'),
        ['test@example.com']
      );
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role_id: 1
      };

      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserModel.findById(1);

      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [1]
      );
    });

    it('should return null if user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await UserModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithRole', () => {
    it('should find user by id with role information', async () => {
      const mockUserWithRole = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role_id: 1,
        role_name: 'admin',
        is_active: true
      };

      pool.query.mockResolvedValue({ rows: [mockUserWithRole] });

      const result = await UserModel.findByIdWithRole(1);

      expect(result).toEqual(mockUserWithRole);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN roles'),
        [1]
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'hashedPassword',
        role_id: 2
      };

      const createdUser = {
        id: 1,
        ...userData,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      pool.query.mockResolvedValue({ rows: [createdUser] });

      const result = await UserModel.create(userData);

      expect(result).toEqual(createdUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          userData.name,
          userData.email,
          userData.password,
          userData.role_id
        ])
      );
    });

    it('should handle creation errors', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'hashedPassword',
        role_id: 2
      };

      pool.query.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(UserModel.create(userData))
        .rejects.toThrow('Unique constraint violation');
    });
  });

  describe('update', () => {
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

      pool.query.mockResolvedValue({ rows: [updatedUser] });

      const result = await UserModel.update(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([
          updateData.name,
          updateData.email,
          updateData.role_id,
          updateData.is_active,
          1
        ])
      );
    });

    it('should return null if user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await UserModel.update(999, { name: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('findAllWithRoles', () => {
    it('should find all users with pagination', async () => {
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@example.com', role_name: 'admin' },
        { id: 2, name: 'User 2', email: 'user2@example.com', role_name: 'sales' }
      ];

      pool.query.mockResolvedValue({ rows: mockUsers });

      const result = await UserModel.findAllWithRoles({
        page: 1,
        limit: 10
      });

      expect(result).toEqual(mockUsers);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN roles'),
        [10, 0]
      );
    });

    it('should handle search parameter', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role_name: 'admin' }
      ];

      pool.query.mockResolvedValue({ rows: mockUsers });

      const result = await UserModel.findAllWithRoles({
        page: 1,
        limit: 10,
        search: 'john'
      });

      expect(result).toEqual(mockUsers);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%john%', '%john%', 10, 0])
      );
    });
  });
});
