const router = require('express').Router();
const { healthRouter } = require('./meta.routes');
const userRouter = require('./user.routes');
const roleRouter = require('./role.routes');
const authRouter = require('./auth.routes');

router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/api/users', userRouter);
router.use('/api/roles', roleRouter);

module.exports = router;
