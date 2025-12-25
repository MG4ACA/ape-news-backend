const pool = require('../config/database');

class Ad {
  // Find ad by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM ads WHERE id = ?', [id]);
    return rows[0];
  }

  // Get all ads with filters
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM ads WHERE 1=1';
    const params = [];

    // Position filter
    if (filters.position) {
      query += ' AND position = ?';
      params.push(filters.position);
    }

    // Active filter
    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }

    // Date range filter (for active ads)
    if (filters.checkDates) {
      query += ` AND (start_date IS NULL OR start_date <= NOW())
                 AND (end_date IS NULL OR end_date >= NOW())`;
    }

    // Sorting
    const sortBy = filters.sort_by || 'display_order';
    const sortOrder = filters.sort_order || 'ASC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    if (filters.page && filters.limit) {
      const page = parseInt(filters.page);
      const limit = parseInt(filters.limit);
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await pool.query(query, params);

    if (filters.page && filters.limit) {
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM ads WHERE 1=1';
      const countParams = [];

      if (filters.position) {
        countQuery += ' AND position = ?';
        countParams.push(filters.position);
      }
      if (filters.is_active !== undefined) {
        countQuery += ' AND is_active = ?';
        countParams.push(filters.is_active);
      }
      if (filters.checkDates) {
        countQuery += ` AND (start_date IS NULL OR start_date <= NOW())
                       AND (end_date IS NULL OR end_date >= NOW())`;
      }

      const [countResult] = await pool.query(countQuery, countParams);
      const total = countResult[0].total;

      return {
        data: rows,
        pagination: {
          page: parseInt(filters.page),
          limit: parseInt(filters.limit),
          total,
          totalPages: Math.ceil(total / parseInt(filters.limit)),
        },
      };
    }

    return rows;
  }

  // Get active ads by position
  static async getActiveByPosition(position) {
    const [rows] = await pool.query(
      `SELECT * FROM ads 
       WHERE position = ? 
       AND is_active = 1
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY display_order ASC`,
      [position]
    );
    return rows;
  }

  // Get all currently active ads
  static async getActive() {
    const [rows] = await pool.query(
      `SELECT * FROM ads 
       WHERE is_active = 1
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY position, display_order ASC`
    );

    // Group by position
    const grouped = {
      header: [],
      sidebar: [],
      content_top: [],
      content_middle: [],
      content_bottom: [],
    };

    rows.forEach((ad) => {
      if (grouped[ad.position]) {
        grouped[ad.position].push(ad);
      }
    });

    return grouped;
  }

  // Create ad
  static async create(adData) {
    const { title, image, link_url, position, display_order, is_active, start_date, end_date } =
      adData;

    const [result] = await pool.query(
      `INSERT INTO ads (title, image, link_url, position, display_order, is_active, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        image,
        link_url || null,
        position,
        display_order || 0,
        is_active !== undefined ? is_active : 1,
        start_date || null,
        end_date || null,
      ]
    );

    return this.findById(result.insertId);
  }

  // Update ad
  static async update(id, adData) {
    const updates = [];
    const params = [];

    const allowedFields = [
      'title',
      'image',
      'link_url',
      'position',
      'display_order',
      'is_active',
      'start_date',
      'end_date',
    ];

    for (const field of allowedFields) {
      if (adData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(adData[field]);
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    params.push(id);

    await pool.query(
      `UPDATE ads SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  // Delete ad
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM ads WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Increment click count
  static async incrementClicks(id) {
    await pool.query('UPDATE ads SET click_count = click_count + 1 WHERE id = ?', [id]);
  }

  // Get statistics
  static async getStats() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN is_active = 1 
                 AND (start_date IS NULL OR start_date <= NOW())
                 AND (end_date IS NULL OR end_date >= NOW()) 
            THEN 1 ELSE 0 END) as currently_active,
        SUM(click_count) as total_clicks
      FROM ads
    `);
    return rows[0];
  }

  // Reorder ads
  static async reorder(adOrders) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const { id, display_order } of adOrders) {
        await connection.query(
          'UPDATE ads SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [display_order, id]
        );
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
}

module.exports = Ad;
