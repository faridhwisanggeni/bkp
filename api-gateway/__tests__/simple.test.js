const request = require('supertest');
const express = require('express');

describe('API Gateway Simple Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Basic Functionality', () => {
    it('should handle JSON requests', async () => {
      app.post('/test', (req, res) => {
        res.json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/test')
        .send({ name: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test');
    });

    it('should handle GET requests', async () => {
      app.get('/health', (req, res) => {
        res.json({ status: 'healthy' });
      });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    it('should handle 404 errors', async () => {
      await request(app)
        .get('/non-existent')
        .expect(404);
    });
  });
});
