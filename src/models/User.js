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

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, values);
    return rows;
  }
}

module.exports = User;
