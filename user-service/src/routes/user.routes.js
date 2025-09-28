const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { validate } = require('../middlewares/validate');
const schema = require('../validators/user.validator');
const { verifyAccessToken, requireRole } = require('../middlewares/auth');

router.use(verifyAccessToken);

router.get('/', validate(schema.pagination), ctrl.list);
router.get('/:id', validate(schema.getById), ctrl.getById);
router.post('/', requireRole(['admin']), validate(schema.create), ctrl.create);
router.put('/:id', requireRole(['admin']), validate(schema.update), ctrl.update);

module.exports = router;
