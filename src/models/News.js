const pool = require('../config/database');

class News {
  // Find news by ID with full details
  static async findById(id, includeUnpublished = false) {
    let query = `
      SELECT n.*,
             u.username as author_username,
             u.full_name as author_name,
             GROUP_CONCAT(DISTINCT c.id) as category_ids,
             GROUP_CONCAT(DISTINCT c.name) as category_names,
             GROUP_CONCAT(DISTINCT c.slug) as category_slugs
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      LEFT JOIN news_categories nc ON n.id = nc.news_id
      LEFT JOIN categories c ON nc.category_id = c.id
      WHERE n.id = ?
    `;

    if (!includeUnpublished) {
      query += ` AND n.status = 'published' AND n.published_at <= NOW()`;
    }

    query += ` GROUP BY n.id`;

    const [rows] = await pool.query(query, [id]);

    if (rows[0]) {
      return this.formatNewsItem(rows[0]);
    }
    return null;
  }

  // Find news by slug
  static async findBySlug(slug, includeUnpublished = false) {
    let query = `
      SELECT n.*,
             u.username as author_username,
             u.full_name as author_name,
             GROUP_CONCAT(DISTINCT c.id) as category_ids,
             GROUP_CONCAT(DISTINCT c.name) as category_names,
             GROUP_CONCAT(DISTINCT c.slug) as category_slugs
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      LEFT JOIN news_categories nc ON n.id = nc.news_id
      LEFT JOIN categories c ON nc.category_id = c.id
      WHERE n.slug = ?
    `;

    if (!includeUnpublished) {
      query += ` AND n.status = 'published' AND n.published_at <= NOW()`;
    }

    query += ` GROUP BY n.id`;

    const [rows] = await pool.query(query, [slug]);

    if (rows[0]) {
      return this.formatNewsItem(rows[0]);
    }
    return null;
  }

  // Get all news with filters
  static async getAll(filters = {}) {
    let query = `
      SELECT n.*,
             u.username as author_username,
             u.full_name as author_name,
             GROUP_CONCAT(DISTINCT c.id) as category_ids,
             GROUP_CONCAT(DISTINCT c.name) as category_names,
             GROUP_CONCAT(DISTINCT c.slug) as category_slugs
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      LEFT JOIN news_categories nc ON n.id = nc.news_id
      LEFT JOIN categories c ON nc.category_id = c.id
    `;

    const conditions = [];
    const params = [];

    // Status filter
    if (filters.status) {
      conditions.push('n.status = ?');
      params.push(filters.status);
    } else if (!filters.includeUnpublished) {
      conditions.push(`n.status = 'published' AND n.published_at <= NOW()`);
    }

    // Category filter
    if (filters.category_id) {
      conditions.push('nc.category_id = ?');
      params.push(filters.category_id);
    }

    // Author filter
    if (filters.author_id) {
      conditions.push('n.author_id = ?');
      params.push(filters.author_id);
    }

    // Featured filter
    if (filters.is_featured !== undefined) {
      conditions.push('n.is_featured = ?');
      params.push(filters.is_featured);
    }

    // Breaking filter
    if (filters.is_breaking !== undefined) {
      conditions.push('n.is_breaking = ?');
      params.push(filters.is_breaking);
    }

    // Search filter (FULLTEXT)
    if (filters.search) {
      conditions.push('MATCH(n.title, n.content) AGAINST(? IN NATURAL LANGUAGE MODE)');
      params.push(filters.search);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY n.id';

    // Sorting
    const sortBy = filters.sort_by || 'published_at';
    const sortOrder = filters.sort_order || 'DESC';
    query += ` ORDER BY n.${sortBy} ${sortOrder}`;

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT n.id) as total
      FROM news n
      LEFT JOIN news_categories nc ON n.id = nc.news_id
    `;

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [countResult] = await pool.query(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    return {
      data: rows.map((row) => this.formatNewsItem(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Create news
  static async create(newsData) {
    const {
      title,
      slug,
      summary,
      content,
      author_id,
      featured_image,
      status,
      is_featured,
      is_breaking,
      published_at,
      meta_title,
      meta_description,
      meta_keywords,
    } = newsData;

    const [result] = await pool.query(
      `INSERT INTO news (
        title, slug, summary, content, author_id, featured_image,
        status, is_featured, is_breaking, published_at,
        meta_title, meta_description, meta_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        summary || null,
        content,
        author_id,
        featured_image || null,
        status || 'draft',
        is_featured || 0,
        is_breaking || 0,
        published_at || null,
        meta_title || title,
        meta_description || summary,
        meta_keywords || null,
      ]
    );

    return result.insertId;
  }

  // Update news
  static async update(id, newsData) {
    const updates = [];
    const params = [];

    const allowedFields = [
      'title',
      'slug',
      'summary',
      'content',
      'featured_image',
      'status',
      'is_featured',
      'is_breaking',
      'published_at',
      'meta_title',
      'meta_description',
      'meta_keywords',
    ];

    for (const field of allowedFields) {
      if (newsData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(newsData[field]);
      }
    }

    if (updates.length === 0) {
      return this.findById(id, true);
    }

    params.push(id);

    await pool.query(
      `UPDATE news SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return this.findById(id, true);
  }

  // Delete news
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete categories associations
      await connection.query('DELETE FROM news_categories WHERE news_id = ?', [id]);

      // Delete comments
      await connection.query('DELETE FROM comments WHERE news_id = ?', [id]);

      // Delete bookmarks
      await connection.query('DELETE FROM bookmarks WHERE news_id = ?', [id]);

      // Delete analytics
      await connection.query('DELETE FROM analytics WHERE news_id = ?', [id]);

      // Delete news
      const [result] = await connection.query('DELETE FROM news WHERE id = ?', [id]);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Set categories for news
  static async setCategories(newsId, categoryIds) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Remove existing categories
      await connection.query('DELETE FROM news_categories WHERE news_id = ?', [newsId]);

      // Add new categories
      if (categoryIds && categoryIds.length > 0) {
        const values = categoryIds.map((catId) => [newsId, catId]);
        await connection.query('INSERT INTO news_categories (news_id, category_id) VALUES ?', [
          values,
        ]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Increment view count
  static async incrementViews(id) {
    await pool.query('UPDATE news SET views = views + 1 WHERE id = ?', [id]);
  }

  // Format news item with parsed categories
  static formatNewsItem(row) {
    return {
      ...row,
      categories: row.category_ids
        ? row.category_ids.split(',').map((id, index) => ({
            id: parseInt(id),
            name: row.category_names.split(',')[index],
            slug: row.category_slugs.split(',')[index],
          }))
        : [],
      category_ids: undefined,
      category_names: undefined,
      category_slugs: undefined,
    };
  }
}

module.exports = News;
