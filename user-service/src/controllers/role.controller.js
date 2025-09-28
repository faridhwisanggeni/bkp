const createError = require('http-errors');
const RoleService = require('../services/role.service');

module.exports = {
  list: async (req, res, next) => {
    try {
      const limit = Number(req.query.limit || 50);
      const offset = Number(req.query.offset || 0);
      const items = await RoleService.list({ limit, offset });
      res.json({ roles: items });
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const item = await RoleService.getById(id);
      if (!item) return next(createError(404, 'Role not found'));
      res.json({ role: item });
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      const { role_name, is_active = true, created_by } = req.body;
      const item = await RoleService.create({ role_name, is_active, created_by });
      res.status(201).json({ role: item });
    } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { role_name, is_active, updated_by } = req.body;
      const item = await RoleService.update(id, { role_name, is_active, updated_by });
      if (!item) return next(createError(404, 'Role not found'));
      res.json({ role: item });
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const ok = await RoleService.remove(id);
      if (!ok) return next(createError(404, 'Role not found'));
      res.status(204).send();
    } catch (e) { next(e); }
  },
};
