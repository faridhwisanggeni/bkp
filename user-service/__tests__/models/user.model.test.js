const UserModel = require('../../src/models/user.model');

// Mock database pool - NO REAL DATABASE ACCESS
jest.mock('../../src/db/pool', () => ({
  pool: {
    query: jest.fn()
  }
}));

const { pool } = require('../../src/db/pool');

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should find user by id', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role_id: 1,
        is_active: true
      };

      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await UserModel.getById(1);

      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('should return undefined if user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await UserModel.getById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          role_id: 1,
          is_active: true
        },
        {
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          role_id: 2,
          is_active: true
        }
      ];

      pool.query.mockResolvedValue({ rows: mockUsers });

      const result = await UserModel.list();

      expect(result).toEqual(mockUsers);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(UserModel.list())
        .rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'hashedPassword',
        role_id: 2,
        is_active: true
      };

      const createdUser = {
        id: 3,
        ...userData,
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
          userData.role_id,
          userData.is_active
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
          1,
          updateData.name,
          updateData.email,
          updateData.role_id,
          updateData.is_active
        ])
      );
    });

    it('should return undefined if user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await UserModel.update(999, { name: 'Updated' });

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(UserModel.update(1, { name: 'Updated' }))
        .rejects.toThrow('Database error');
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await UserModel.remove(1);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1',
        [1]
      );
    });

    it('should return false if user not found', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const result = await UserModel.remove(999);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(UserModel.remove(1))
        .rejects.toThrow('Database error');
    });
  });
});
