const pool = require('../config/database');

class Comment {
  // Find comment by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT c.*,
              u.username,
              u.full_name as author_name,
              n.title as news_title,
              n.slug as news_slug,
              pc.content as parent_content,
              pu.username as parent_author
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN news n ON c.news_id = n.id
       LEFT JOIN comments pc ON c.parent_id = pc.id
       LEFT JOIN users pu ON pc.user_id = pu.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Get all comments with filters
  static async getAll(filters = {}) {
    let query = `
      SELECT c.*,
             u.username,
             u.full_name as author_name,
             n.title as news_title,
             n.slug as news_slug
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN news n ON c.news_id = n.id
      WHERE 1=1
    `;

    const params = [];

    // News filter
    if (filters.news_id) {
      query += ' AND c.news_id = ?';
      params.push(filters.news_id);
    }

    // User filter
    if (filters.user_id) {
      query += ' AND c.user_id = ?';
      params.push(filters.user_id);
    }

    // Parent filter (top-level or replies)
    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query += ' AND c.parent_id IS NULL';
      } else {
        query += ' AND c.parent_id = ?';
        params.push(filters.parent_id);
      }
    }

    // Status filter
    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    } else if (!filters.includeAll) {
      // By default, only show approved comments
      query += ` AND c.status = 'approved'`;
    }

    // Sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'DESC';
    query += ` ORDER BY c.${sortBy} ${sortOrder}`;

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM comments c
      WHERE 1=1
    `;

    const countParams = [];
    if (filters.news_id) {
      countQuery += ' AND c.news_id = ?';
      countParams.push(filters.news_id);
    }
    if (filters.user_id) {
      countQuery += ' AND c.user_id = ?';
      countParams.push(filters.user_id);
    }
    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        countQuery += ' AND c.parent_id IS NULL';
      } else {
        countQuery += ' AND c.parent_id = ?';
        countParams.push(filters.parent_id);
      }
    }
    if (filters.status) {
      countQuery += ' AND c.status = ?';
      countParams.push(filters.status);
    } else if (!filters.includeAll) {
      countQuery += ` AND c.status = 'approved'`;
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

  // Get comments for a news article with nested replies
  static async getByNewsId(newsId, includeAll = false) {
    const statusFilter = includeAll ? '' : ` AND c.status = 'approved'`;

    // Get all comments for the news
    const [comments] = await pool.query(
      `SELECT c.*,
              u.username,
              u.full_name as author_name,
              (SELECT COUNT(*) FROM comments WHERE parent_id = c.id${statusFilter}) as reply_count
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.news_id = ?${statusFilter}
       ORDER BY c.created_at ASC`,
      [newsId]
    );

    // Build nested structure
    const commentMap = {};
    const topLevel = [];

    comments.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach((comment) => {
      if (comment.parent_id === null) {
        topLevel.push(commentMap[comment.id]);
      } else if (commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
      }
    });

    return topLevel;
  }

  // Create comment
  static async create(commentData) {
    const { news_id, user_id, parent_id, content, status } = commentData;

    const [result] = await pool.query(
      `INSERT INTO comments (news_id, user_id, parent_id, content, status)
       VALUES (?, ?, ?, ?, ?)`,
      [news_id, user_id, parent_id || null, content, status || 'pending']
    );

    return this.findById(result.insertId);
  }

  // Update comment
  static async update(id, commentData) {
    const { content, status } = commentData;

    const updates = [];
    const params = [];

    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    params.push(id);

    await pool.query(
      `UPDATE comments SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  // Delete comment (and all replies)
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete all replies recursively
      await this.deleteReplies(id, connection);

      // Delete the comment itself
      const [result] = await connection.query('DELETE FROM comments WHERE id = ?', [id]);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Helper: Delete all replies recursively
  static async deleteReplies(parentId, connection) {
    // Get all direct replies
    const [replies] = await connection.query('SELECT id FROM comments WHERE parent_id = ?', [
      parentId,
    ]);

    // Recursively delete replies of replies
    for (const reply of replies) {
      await this.deleteReplies(reply.id, connection);
    }

    // Delete direct replies
    await connection.query('DELETE FROM comments WHERE parent_id = ?', [parentId]);
  }

  // Update status (approve/reject)
  static async updateStatus(id, status) {
    await pool.query(
      'UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  // Get statistics
  static async getStats(newsId = null) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM comments
    `;

    const params = [];
    if (newsId) {
      query += ' WHERE news_id = ?';
      params.push(newsId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0];
  }
}

module.exports = Comment;
