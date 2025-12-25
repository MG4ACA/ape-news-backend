const pool = require('../config/database');

class Analytics {
  // Track article view
  static async trackView(newsId, userId = null, ipAddress = null, userAgent = null) {
    const [result] = await pool.query(
      'INSERT INTO analytics (news_id, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [newsId, userId, ipAddress, userAgent]
    );
    return result.insertId;
  }

  // Get total views for an article
  static async getArticleViews(newsId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as total_views FROM analytics WHERE news_id = ?',
      [newsId]
    );
    return rows[0].total_views;
  }

  // Get views by date range
  static async getViewsByDateRange(newsId, startDate, endDate) {
    const [rows] = await pool.query(
      `SELECT DATE(viewed_at) as date, COUNT(*) as views
       FROM analytics
       WHERE news_id = ? AND viewed_at BETWEEN ? AND ?
       GROUP BY DATE(viewed_at)
       ORDER BY date`,
      [newsId, startDate, endDate]
    );
    return rows;
  }

  // Get popular articles
  static async getPopularArticles(filters = {}) {
    const limit = parseInt(filters.limit) || 10;
    const days = parseInt(filters.days) || 30;

    let query = `
      SELECT 
        n.id, n.title, n.slug, n.featured_image, n.excerpt,
        COUNT(DISTINCT a.id) as view_count,
        GROUP_CONCAT(DISTINCT c.name) as category_names,
        GROUP_CONCAT(DISTINCT c.slug) as category_slugs,
        u.username as author_username,
        u.full_name as author_name
      FROM news n
      LEFT JOIN analytics a ON n.id = a.news_id
      LEFT JOIN news_categories nc ON n.id = nc.news_id
      LEFT JOIN categories c ON nc.category_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.status = 'published'
    `;

    const params = [];

    if (days > 0) {
      query += ' AND (a.viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY) OR a.viewed_at IS NULL)';
      params.push(days);
    }

    if (filters.category_id) {
      query += ' AND nc.category_id = ?';
      params.push(filters.category_id);
    }

    query += `
      GROUP BY n.id
      ORDER BY view_count DESC
      LIMIT ?
    `;
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Get trending articles (articles with increasing views)
  static async getTrendingArticles(limit = 10) {
    const [rows] = await pool.query(
      `SELECT 
        n.id, n.title, n.slug, n.featured_image, n.excerpt,
        COUNT(CASE WHEN a.viewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recent_views,
        COUNT(CASE WHEN a.viewed_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
                    AND a.viewed_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as previous_views,
        GROUP_CONCAT(DISTINCT c.name) as category_names,
        GROUP_CONCAT(DISTINCT c.slug) as category_slugs
       FROM news n
       LEFT JOIN analytics a ON n.id = a.news_id
       LEFT JOIN news_categories nc ON n.id = nc.news_id
       LEFT JOIN categories c ON nc.category_id = c.id
       WHERE n.status = 'published'
       GROUP BY n.id
       HAVING recent_views > previous_views AND recent_views > 0
       ORDER BY (recent_views - previous_views) DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  // Get dashboard statistics
  static async getDashboardStats(days = 30) {
    // Total views in period
    const [totalViews] = await pool.query(
      `SELECT COUNT(*) as total
       FROM analytics
       WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Unique visitors in period
    const [uniqueVisitors] = await pool.query(
      `SELECT COUNT(DISTINCT COALESCE(user_id, ip_address)) as total
       FROM analytics
       WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Views by date
    const [viewsByDate] = await pool.query(
      `SELECT DATE(viewed_at) as date, COUNT(*) as views
       FROM analytics
       WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(viewed_at)
       ORDER BY date`,
      [days]
    );

    // Top categories
    const [topCategories] = await pool.query(
      `SELECT 
        c.id, c.name, c.slug,
        COUNT(DISTINCT a.id) as view_count
       FROM analytics a
       JOIN news n ON a.news_id = n.id
       JOIN news_categories nc ON n.id = nc.news_id
       JOIN categories c ON nc.category_id = c.id
       WHERE a.viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY c.id
       ORDER BY view_count DESC
       LIMIT 5`,
      [days]
    );

    // Recent views
    const [recentViews] = await pool.query(
      `SELECT 
        a.viewed_at,
        n.id as news_id, n.title, n.slug,
        u.username, u.full_name
       FROM analytics a
       JOIN news n ON a.news_id = n.id
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.viewed_at DESC
       LIMIT 20`
    );

    return {
      total_views: totalViews[0].total,
      unique_visitors: uniqueVisitors[0].total,
      views_by_date: viewsByDate,
      top_categories: topCategories,
      recent_views: recentViews,
    };
  }

  // Get article analytics details
  static async getArticleAnalytics(newsId, days = 30) {
    // Total views
    const [totalViews] = await pool.query(
      `SELECT COUNT(*) as total
       FROM analytics
       WHERE news_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [newsId, days]
    );

    // Unique visitors
    const [uniqueVisitors] = await pool.query(
      `SELECT COUNT(DISTINCT COALESCE(user_id, ip_address)) as total
       FROM analytics
       WHERE news_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [newsId, days]
    );

    // Views by date
    const [viewsByDate] = await pool.query(
      `SELECT DATE(viewed_at) as date, COUNT(*) as views
       FROM analytics
       WHERE news_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(viewed_at)
       ORDER BY date`,
      [newsId, days]
    );

    // Registered vs anonymous views
    const [viewsByUserType] = await pool.query(
      `SELECT 
        SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as registered_views,
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as anonymous_views
       FROM analytics
       WHERE news_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [newsId, days]
    );

    return {
      total_views: totalViews[0].total,
      unique_visitors: uniqueVisitors[0].total,
      views_by_date: viewsByDate,
      registered_views: parseInt(viewsByUserType[0].registered_views) || 0,
      anonymous_views: parseInt(viewsByUserType[0].anonymous_views) || 0,
    };
  }

  // Get user activity
  static async getUserActivity(userId, days = 30) {
    const [rows] = await pool.query(
      `SELECT 
        a.viewed_at,
        n.id as news_id, n.title, n.slug,
        c.name as category_name
       FROM analytics a
       JOIN news n ON a.news_id = n.id
       LEFT JOIN categories c ON n.category_id = c.id
       WHERE a.user_id = ? AND a.viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY a.viewed_at DESC
       LIMIT 50`,
      [userId, days]
    );
    return rows;
  }

  // Get views count by category
  static async getViewsByCategory(days = 30) {
    const [rows] = await pool.query(
      `SELECT 
        c.id, c.name, c.slug,
        COUNT(DISTINCT a.id) as view_count
       FROM categories c
       LEFT JOIN news_categories nc ON c.id = nc.category_id
       LEFT JOIN news n ON nc.news_id = n.id
       LEFT JOIN analytics a ON n.id = a.news_id
         AND a.viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY view_count DESC`,
      [days]
    );
    return rows;
  }
}

module.exports = Analytics;
