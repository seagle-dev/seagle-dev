const request = require('supertest');
const app = require('../app');
const adminService = require('../services/admin.service');
const jwt = require('jsonwebtoken');

jest.mock('../services/admin.service', () => ({
  listBooks: jest.fn(),
  listModels: jest.fn(),
  deleteBook: jest.fn()
}));

// Admin routes are protected by verifyToken AND verifyAdmin
// We'll need to mock DB queries that check for user role
const db = require('../config/db');
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

describe('Admin Controller Integration', () => {
  let adminToken;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Generate a valid token
    adminToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '1h' });

    // Mock verifyAdmin middleware DB check and verifyToken DB check
    db.query.mockResolvedValue({ rows: [{ id: 1, email: 'admin@test.com', role: 'admin' }] });
  });

  describe('GET /api/admin/books', () => {
    it('should return books for admin', async () => {
      adminService.listBooks.mockResolvedValue([{ id: 1, title: 'Admin Book 1' }]);

      const response = await request(app)
        .get('/api/admin/books')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Admin Book 1');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/admin/books');
      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, email: 'learner@test.com', role: 'learner' }] });

      const response = await request(app)
        .get('/api/admin/books')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/books/:id', () => {
    it('should delete a book successfully', async () => {
      adminService.deleteBook.mockResolvedValue();

      const response = await request(app)
        .delete('/api/admin/books/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(204);
      expect(adminService.deleteBook).toHaveBeenCalledWith(1);
    });
  });
});
