const pool = require('../config/database');

class Video {
  // Find video by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT v.*,
              c.name as category_name,
              c.slug as category_slug
       FROM videos v
       LEFT JOIN categories c ON v.category_id = c.id
       WHERE v.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Get all videos with filters
  static async getAll(filters = {}) {
    let query = `
      SELECT v.*,
             c.name as category_name,
             c.slug as category_slug
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      WHERE 1=1
    `;

    const params = [];

    // Category filter
    if (filters.category_id) {
      query += ' AND v.category_id = ?';
      params.push(filters.category_id);
    }

    // Featured filter
    if (filters.is_featured !== undefined) {
      query += ' AND v.is_featured = ?';
      params.push(filters.is_featured);
    }

    // Status filter
    if (filters.is_active !== undefined) {
      query += ' AND v.is_active = ?';
      params.push(filters.is_active);
    }

    // Search
    if (filters.search) {
      query += ' AND (v.title LIKE ? OR v.description LIKE ?)';
      const searchTerm = '%' + filters.search + '%';
      params.push(searchTerm, searchTerm);
    }

    // Sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'DESC';
    query += ' ORDER BY v.' + sortBy + ' ' + sortOrder;

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM videos v
      WHERE 1=1
    `;

    const countParams = [];
    if (filters.category_id) {
      countQuery += ' AND v.category_id = ?';
      countParams.push(filters.category_id);
    }
    if (filters.is_featured !== undefined) {
      countQuery += ' AND v.is_featured = ?';
      countParams.push(filters.is_featured);
    }
    if (filters.is_active !== undefined) {
      countQuery += ' AND v.is_active = ?';
      countParams.push(filters.is_active);
    }
    if (filters.search) {
      countQuery += ' AND (v.title LIKE ? OR v.description LIKE ?)';
      const searchTerm = '%' + filters.search + '%';
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Create video
  static async create(videoData) {
    const {
      title,
      description,
      youtube_url,
      youtube_id,
      thumbnail,
      category_id,
      display_order,
      is_active,
    } = videoData;

    const [result] = await pool.query(
      `INSERT INTO videos (
        title, description, youtube_url, youtube_id, thumbnail,
        category_id, display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        youtube_url,
        youtube_id,
        thumbnail || null,
        category_id || null,
        display_order || 0,
        is_active !== undefined ? is_active : 1,
      ]
    );

    return this.findById(result.insertId);
  }

  // Update video
  static async update(id, updateData) {
    const allowedFields = [
      'title',
      'description',
      'youtube_url',
      'youtube_id',
      'thumbnail',
      'category_id',
      'display_order',
      'is_active',
    ];

    const updates = [];
    const params = [];

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates.push(key + ' = ?');
        params.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    const query = 'UPDATE videos SET ' + updates.join(', ') + ' WHERE id = ?';

    await pool.query(query, params);
    return this.findById(id);
  }

  // Delete video
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM videos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Increment view count
  static async incrementViews(id) {
    await pool.query('UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [id]);
  }

  // Get statistics
  static async getStats() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
        SUM(views_count) as total_views
      FROM videos
    `);
    return rows[0];
  }

  // Extract YouTube video ID from various URL formats
  static extractYouTubeId(url) {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  // Get thumbnail URL from YouTube video ID
  static getThumbnailUrl(videoId) {
    if (!videoId) return null;
    return 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';
  }
}

module.exports = Video;
