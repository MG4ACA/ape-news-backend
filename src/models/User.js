const pool = require('../config/database');

class User {
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, avatar, role, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  static async create(userData) {
    const { username, email, password, full_name, role = 'user' } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, password, full_name, role]
    );
    return result.insertId;
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];

    Object.keys(userData).forEach((key) => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(userData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getAll(filters = {}) {
    let query =
      'SELECT id, username, email, full_name, avatar, role, is_active, created_at FROM users WHERE 1=1';
    const values = [];

    if (filters.role) {
      query += ' AND role = ?';
      values.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      values.push(filters.is_active);
    }

    if (filters.search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      const searchTerm = '%' + filters.search + '%';
      values.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    // Pagination
    if (filters.page && filters.limit) {
      const offset = (parseInt(filters.page) - 1) * parseInt(filters.limit);
      query += ' LIMIT ? OFFSET ?';
      values.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(query, values);
    return rows;
  }

  // Get user profile with stats
  static async getProfile(userId) {
    const [rows] = await pool.query(
      `SELECT 
        u.id, u.username, u.email, u.full_name, u.avatar, u.role, u.created_at,
        COUNT(DISTINCT b.id) as bookmarks_count,
        COUNT(DISTINCT c.id) as comments_count
       FROM users u
       LEFT JOIN bookmarks b ON u.id = b.user_id
       LEFT JOIN comments c ON u.id = c.user_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );
    return rows[0];
  }

  // Update profile
  static async updateProfile(userId, profileData) {
    const allowedFields = ['username', 'email', 'full_name', 'avatar', 'password'];
    const fields = [];
    const values = [];

    Object.keys(profileData).forEach((key) => {
      if (allowedFields.includes(key) && profileData[key] !== undefined) {
        fields.push(key + ' = ?');
        values.push(profileData[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(userId);
    const query = 'UPDATE users SET ' + fields.join(', ') + ' WHERE id = ?';

    await pool.query(query, values);
    return this.getProfile(userId);
  }

  // Bookmark methods
  static async addBookmark(userId, newsId) {
    try {
      const [result] = await pool.query('INSERT INTO bookmarks (user_id, news_id) VALUES (?, ?)', [
        userId,
        newsId,
      ]);
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return null; // Already bookmarked
      }
      throw error;
    }
  }

  static async removeBookmark(userId, newsId) {
    const [result] = await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND news_id = ?', [
      userId,
      newsId,
    ]);
    return result.affectedRows > 0;
  }

  static async getBookmarks(userId, filters = {}) {
    let query = `
      SELECT 
        b.id, b.created_at as bookmarked_at,
        n.id as news_id, n.title, n.slug, n.featured_image,
        n.excerpt, n.status, n.created_at as news_created_at,
        n.title_si, n.title_en, n.title_ta,
        n.excerpt_si, n.excerpt_en, n.excerpt_ta,
        n.views_count, n.is_featured, n.is_breaking, n.published_at,
        GROUP_CONCAT(DISTINCT c.name) as category_names,
        GROUP_CONCAT(DISTINCT c.slug) as category_slugs,
        u.username as author_username, u.full_name as author_name
      FROM bookmarks b
      JOIN news n ON b.news_id = n.id
      LEFT JOIN news_categories nc ON n.id = nc.news_id
      LEFT JOIN categories c ON nc.category_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE b.user_id = ?
    `;

    const params = [userId];

    // Only show published articles to regular users
    if (filters.includeUnpublished !== true) {
      query += ' AND n.status = ?';
      params.push('published');
    }

    query += ' GROUP BY b.id, n.id ORDER BY b.created_at DESC';

    // Pagination
    if (filters.page && filters.limit) {
      const offset = (parseInt(filters.page) - 1) * parseInt(filters.limit);
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(query, params);

    // Transform flat structure into nested structure
    const bookmarks = rows.map((row) => ({
      id: row.id,
      bookmarked_at: row.bookmarked_at,
      news: {
        id: row.news_id,
        title: row.title,
        slug: row.slug,
        featured_image: row.featured_image,
        excerpt: row.excerpt,
        status: row.status,
        created_at: row.news_created_at,
        published_at: row.published_at,
        title_si: row.title_si,
        title_en: row.title_en,
        title_ta: row.title_ta,
        excerpt_si: row.excerpt_si,
        excerpt_en: row.excerpt_en,
        excerpt_ta: row.excerpt_ta,
        views_count: row.views_count,
        is_featured: row.is_featured,
        is_breaking: row.is_breaking,
        category_names: row.category_names,
        category_slugs: row.category_slugs,
        author_username: row.author_username,
        author_name: row.author_name,
      },
    }));

    // Get total count
    let countQuery =
      'SELECT COUNT(*) as total FROM bookmarks b JOIN news n ON b.news_id = n.id WHERE b.user_id = ?';
    const countParams = [userId];

    if (filters.includeUnpublished !== true) {
      countQuery += ' AND n.status = ?';
      countParams.push('published');
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return {
      data: bookmarks,
      pagination: {
        page: parseInt(filters.page) || 1,
        limit: parseInt(filters.limit) || 20,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / (parseInt(filters.limit) || 20)),
      },
    };
  }

  static async checkBookmark(userId, newsId) {
    const [rows] = await pool.query('SELECT id FROM bookmarks WHERE user_id = ? AND news_id = ?', [
      userId,
      newsId,
    ]);
    return rows.length > 0;
  }

  // Admin methods
  static async getAllWithPagination(filters = {}) {
    let query =
      'SELECT id, username, email, full_name, avatar, role, is_active, created_at FROM users WHERE 1=1';
    const values = [];

    if (filters.role) {
      query += ' AND role = ?';
      values.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      values.push(filters.is_active);
    }

    if (filters.search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      const searchTerm = '%' + filters.search + '%';
      values.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace(
      'SELECT id, username, email, full_name, avatar, role, is_active, created_at',
      'SELECT COUNT(*) as total'
    );
    const [countResult] = await pool.query(countQuery, values);

    query += ' ORDER BY created_at DESC';

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query += ' LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await pool.query(query, values);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  static async createByAdmin(userData) {
    const { username, email, password, full_name, role = 'user', is_active = 1 } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, password, full_name, role, is_active]
    );
    return this.findById(result.insertId);
  }

  static async updateByAdmin(id, userData) {
    const allowedFields = [
      'username',
      'email',
      'password',
      'full_name',
      'role',
      'is_active',
      'avatar',
    ];
    const fields = [];
    const values = [];

    Object.keys(userData).forEach((key) => {
      if (allowedFields.includes(key) && userData[key] !== undefined) {
        fields.push(key + ' = ?');
        values.push(userData[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = 'UPDATE users SET ' + fields.join(', ') + ' WHERE id = ?';

    await pool.query(query, values);
    return this.findById(id);
  }
}

module.exports = User;
