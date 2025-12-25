const Analytics = require('../models/Analytics');

// Track article view
exports.trackView = async (req, res, next) => {
  try {
    const { news_id } = req.body;

    if (!news_id) {
      return res.status(400).json({
        success: false,
        message: 'News ID is required',
      });
    }

    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await Analytics.trackView(news_id, userId, ipAddress, userAgent);

    res.json({
      success: true,
      message: 'View tracked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const stats = await Analytics.getDashboardStats(parseInt(days));

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get popular articles
exports.getPopularArticles = async (req, res, next) => {
  try {
    const { limit = 10, days = 30, category_id } = req.query;

    const articles = await Analytics.getPopularArticles({
      limit: parseInt(limit),
      days: parseInt(days),
      category_id,
    });

    res.json({
      success: true,
      data: articles,
    });
  } catch (error) {
    next(error);
  }
};

// Get trending articles
exports.getTrendingArticles = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const articles = await Analytics.getTrendingArticles(parseInt(limit));

    res.json({
      success: true,
      data: articles,
    });
  } catch (error) {
    next(error);
  }
};

// Get article analytics
exports.getArticleAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const analytics = await Analytics.getArticleAnalytics(parseInt(id), parseInt(days));

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// Get views by category
exports.getViewsByCategory = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const categories = await Analytics.getViewsByCategory(parseInt(days));

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Get user activity
exports.getUserActivity = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const activity = await Analytics.getUserActivity(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};
