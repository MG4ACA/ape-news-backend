const pool = require('../config/database');

class Category {
  // Find category by ID with parent category info
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT c.*, 
              p.name as parent_name,
              p.slug as parent_slug
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Find category by slug
  static async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT c.*, 
              p.name as parent_name,
              p.slug as parent_slug
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.slug = ?`,
      [slug]
    );
    return rows[0];
  }

  // Get all categories with hierarchy
  static async getAll(filters = {}) {
    let query = `
      SELECT c.*,
             p.name as parent_name,
             p.slug as parent_slug,
             COUNT(DISTINCT nc.news_id) as news_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      LEFT JOIN news_categories nc ON c.id = nc.category_id
    `;

    const conditions = [];
    const params = [];

    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        conditions.push('c.parent_id IS NULL');
      } else {
        conditions.push('c.parent_id = ?');
        params.push(filters.parent_id);
      }
    }

    if (filters.is_active !== undefined) {
      conditions.push('c.is_active = ?');
      params.push(filters.is_active);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY c.id ORDER BY c.display_order ASC, c.name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Get category tree (hierarchical structure)
  static async getTree() {
    const allCategories = await this.getAll({ is_active: 1 });

    // Create a map of categories by ID
    const categoryMap = {};
    allCategories.forEach((cat) => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    // Build tree structure
    const tree = [];
    allCategories.forEach((cat) => {
      if (cat.parent_id === null) {
        tree.push(categoryMap[cat.id]);
      } else if (categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      }
    });

    return tree;
  }

  // Get children of a category
  static async getChildren(parentId) {
    const [rows] = await pool.query(
      `SELECT c.*,
              COUNT(DISTINCT nc.news_id) as news_count
       FROM categories c
       LEFT JOIN news_categories nc ON c.id = nc.category_id
       WHERE c.parent_id = ?
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.name ASC`,
      [parentId]
    );
    return rows;
  }

  // Create new category
  static async create(categoryData) {
    const { name, slug, description, parent_id, display_order, is_active } = categoryData;

    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description, parent_id, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description || null,
        parent_id || null,
        display_order || 0,
        is_active !== undefined ? is_active : 1,
      ]
    );

    return this.findById(result.insertId);
  }

  // Update category
  static async update(id, categoryData) {
    const { name, slug, description, parent_id, display_order, is_active } = categoryData;

    // Check for circular reference if parent_id is being set
    if (parent_id !== undefined && parent_id !== null) {
      const isCircular = await this.checkCircularReference(id, parent_id);
      if (isCircular) {
        throw new Error('Cannot set parent category: would create circular reference');
      }
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      params.push(slug);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (parent_id !== undefined) {
      updates.push('parent_id = ?');
      params.push(parent_id);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      params.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    params.push(id);

    await pool.query(
      `UPDATE categories SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  // Check for circular reference in category hierarchy
  static async checkCircularReference(categoryId, parentId) {
    if (categoryId === parentId) {
      return true;
    }

    let currentParentId = parentId;
    while (currentParentId !== null) {
      const parent = await this.findById(currentParentId);
      if (!parent) break;

      if (parent.id === categoryId) {
        return true;
      }

      currentParentId = parent.parent_id;
    }

    return false;
  }

  // Delete category
  static async delete(id) {
    // Check if category has children
    const children = await this.getChildren(id);
    if (children.length > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    // Check if category has news articles
    const [newsCount] = await pool.query(
      'SELECT COUNT(*) as count FROM news_categories WHERE category_id = ?',
      [id]
    );

    if (newsCount[0].count > 0) {
      throw new Error('Cannot delete category with associated news articles');
    }

    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Soft delete (deactivate) category
  static async deactivate(id) {
    await pool.query(
      'UPDATE categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return this.findById(id);
  }

  // Reorder categories
  static async reorder(categoryOrders) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const { id, display_order } of categoryOrders) {
        await connection.query(
          'UPDATE categories SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
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

module.exports = Category;
