const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');
const userRepo = require('../repositories/user.repository');

function signAccessToken(user) {
  const payload = { sub: user.id, email: user.email, role: user.role_name };
  const opts = { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, opts);
}

function signRefreshToken(user) {
  const payload = { sub: user.id, email: user.email };
  const opts = { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, opts);
}

module.exports = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await userRepo.getByEmailWithPassword(email);
      if (!user) throw createError(401, 'Invalid email or password');
      if (user.is_active === false) throw createError(403, 'User inactive');
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw createError(401, 'Invalid email or password');

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      res.json({ accessToken, refreshToken });
    } catch (e) { next(e); }
  },

  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError(400, 'Missing refreshToken');
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (e) {
        throw createError(401, 'Invalid or expired refresh token');
      }
      const user = await userRepo.getByIdWithRole(decoded.sub);
      if (!user) throw createError(401, 'Invalid token subject');
      const accessToken = signAccessToken(user);
      res.json({ accessToken });
    } catch (e) { next(e); }
  },
};
