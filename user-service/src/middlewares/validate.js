function validate(schema) {
  return async (req, res, next) => {
    try {
      if (!schema) return next();
      const toValidate = {
        params: req.params,
        query: req.query,
        body: req.body,
      };
      const value = await schema.validateAsync(toValidate, { abortEarly: false, stripUnknown: true });
      req.params = value.params || req.params;
      req.query = value.query || req.query;
      req.body = value.body || req.body;
      next();
    } catch (err) {
      res.status(400).json({ error: 'ValidationError', details: err.details?.map(d => d.message) || [err.message] });
    }
  };
}

module.exports = { validate };
