const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate');
const schema = require('../validators/auth.validator');

router.post('/login', validate(schema.login), ctrl.login);
router.post('/refresh', validate(schema.refresh), ctrl.refresh);

module.exports = router;
