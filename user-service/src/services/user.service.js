const bcrypt = require('bcryptjs');
const createError = require('http-errors');
const userRepo = require('../repositories/user.repository');
const roleRepo = require('../repositories/role.repository');
const { UserEntity } = require('../entities/user.entity');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

function toEntity(r) { return r ? new UserEntity(r) : null; }

async function list({ limit, offset }) {
  const rows = await userRepo.list({ limit, offset });
  return rows.map(toEntity);
}

async function getById(id) {
  return toEntity(await userRepo.getById(id));
}

async function create(payload) {
  // ensure role exists
  const role = await roleRepo.getById(payload.role_id);
  if (!role) throw new Error('Invalid role_id');

  let hashed = payload.password;
  if (hashed) {
    hashed = await bcrypt.hash(payload.password, SALT_ROUNDS);
  }
  try {
    const row = await userRepo.create({ ...payload, password: hashed });
    return toEntity(row);
  } catch (e) {
    if (e && e.code === '23505') {
      throw createError(409, 'User already exists (email or unique field)');
    }
    throw e;
  }
}

async function update(id, payload) {
  if (payload.role_id) {
    const role = await roleRepo.getById(payload.role_id);
    if (!role) throw new Error('Invalid role_id');
  }
  let hashed = payload.password;
  if (hashed) {
    hashed = await bcrypt.hash(payload.password, SALT_ROUNDS);
  }
  try {
    const row = await userRepo.update(id, { ...payload, password: hashed });
    return toEntity(row);
  } catch (e) {
    if (e && e.code === '23505') {
      throw createError(409, 'User conflict (email or unique field)');
    }
    throw e;
  }
}

async function remove(id) {
  return userRepo.remove(id);
}

module.exports = { list, getById, create, update, remove };
