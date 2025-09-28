const createError = require('http-errors');
const UserService = require('../services/user.service');

module.exports = {
  list: async (req, res, next) => {
    try {
      const limit = Number(req.query.limit || 50);
      const offset = Number(req.query.offset || 0);
      const items = await UserService.list({ limit, offset });
      res.json({ users: items });
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const item = await UserService.getById(id);
      if (!item) return next(createError(404, 'User not found'));
      res.json({ user: item });
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      const { name, email, role_id, is_active = true, created_by, password } = req.body;
      if (!password) throw createError(400, 'Password is required');
      const item = await UserService.create({ name, email, role_id, is_active, created_by, password });
      res.status(201).json({ user: item });
    } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { name, email, role_id, is_active, updated_by, password } = req.body;
      const item = await UserService.update(id, { name, email, role_id, is_active, updated_by, password });
      if (!item) return next(createError(404, 'User not found'));
      res.json({ user: item });
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const ok = await UserService.remove(id);
      if (!ok) return next(createError(404, 'User not found'));
      res.status(204).send();
    } catch (e) { next(e); }
  },
};
