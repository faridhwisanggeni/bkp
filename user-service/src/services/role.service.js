const createError = require('http-errors');
const repo = require('../repositories/role.repository');
const { RoleEntity } = require('../entities/role.entity');

function toEntity(r) { return r ? new RoleEntity(r) : null; }

async function list({ limit, offset }) {
  const rows = await repo.list({ limit, offset });
  return rows.map(toEntity);
}

async function getById(id) {
  return toEntity(await repo.getById(id));
}

async function create(payload) {
  try {
    const row = await repo.create(payload);
    return toEntity(row);
  } catch (e) {
    if (e && e.code === '23505') {
      throw createError(409, 'Role already exists (role_name unique)');
    }
    throw e;
  }
}

async function update(id, payload) {
  try {
    const row = await repo.update(id, payload);
    return toEntity(row);
  } catch (e) {
    if (e && e.code === '23505') {
      throw createError(409, 'Role conflict (role_name unique)');
    }
    throw e;
  }
}

async function remove(id) {
  return repo.remove(id);
}

module.exports = { list, getById, create, update, remove };
