const Comment = require('../models/Comment');
const News = require('../models/News');

// Get all comments (public - only approved)
exports.getAllComments = async (req, res, next) => {
  try {
    const { page, limit, news_id, user_id, parent_id, sort_by, sort_order } = req.query;

    const filters = {
      page,
      limit,
      news_id,
      user_id,
      parent_id: parent_id === 'null' ? null : parent_id,
      sort_by,
      sort_order,
      includeAll: false
    };

    const result = await Comment.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get comments for admin (includes all statuses)
exports.getAdminComments = async (req, res, next) => {
  try {
    const { page, limit, news_id, user_id, status, sort_by, sort_order } = req.query;

    const filters = {
      page,
      limit,
      news_id,
      user_id,
      status,
      sort_by,
      sort_order,
      includeAll: true
    };

    const result = await Comment.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get comments for a specific news article (nested structure)
exports.getNewComments = async (req, res, next) => {
  try {
    const { newsId } = req.params;

    // Check if news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Check if user is moderator/admin to include all comments
    const includeAll = req.user && ['moderator', 'editor', 'super_admin'].includes(req.user.role);

    const comments = await Comment.getByNewsId(newsId, includeAll);

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// Get single comment
exports.getComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can view non-approved comments
    if (comment.status !== 'approved') {
      if (!req.user || 
          (req.user.id !== comment.user_id && 
           !['moderator', 'editor', 'super_admin'].includes(req.user.role))) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this comment'
        });
      }
    }

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// Create comment
exports.createComment = async (req, res, next) => {
  try {
    const { news_id, parent_id, content } = req.body;

    // Validation
    if (!news_id || !content) {
      return res.status(400).json({
        success: false,
        message: 'News ID and content are required'
      });
    }

    if (content.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be at least 3 characters long'
      });
    }

    // Check if news exists
    const news = await News.findById(news_id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Check if news is published
    if (news.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot comment on unpublished articles'
      });
    }

    // If replying to a comment, check if parent exists
    if (parent_id) {
      const parentComment = await Comment.findById(parent_id);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      // Check if parent comment is approved
      if (parentComment.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot reply to non-approved comments'
        });
      }

      // Check if parent comment belongs to the same news
      if (parentComment.news_id !== parseInt(news_id)) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment does not belong to this news article'
        });
      }
    }

    const commentData = {
      news_id,
      user_id: req.user.id,
      parent_id: parent_id || null,
      content: content.trim(),
      status: 'pending' // All comments start as pending
    };

    const comment = await Comment.create(commentData);

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully. It will be visible after moderation.',
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// Update comment (only by author before approval)
exports.updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    // Can only edit pending comments
    if (comment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit comments that have been moderated'
      });
    }

    // Validation
    if (!content || content.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be at least 3 characters long'
      });
    }

    const updatedComment = await Comment.update(id, {
      content: content.trim()
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });
  } catch (error) {
    next(error);
  }
};

// Delete comment (by author or moderator)
exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check permissions
    const isModerator = ['moderator', 'editor', 'super_admin'].includes(req.user.role);
    const isAuthor = comment.user_id === req.user.id;

    if (!isModerator && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment'
      });
    }

    // Authors can only delete pending comments
    if (isAuthor && !isModerator && comment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You can only delete pending comments'
      });
    }

    await Comment.delete(id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Approve comment (moderator only)
exports.approveComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Comment is already approved'
      });
    }

    const updatedComment = await Comment.updateStatus(id, 'approved');

    res.json({
      success: true,
      message: 'Comment approved successfully',
      data: updatedComment
    });
  } catch (error) {
    next(error);
  }
};

// Reject comment (moderator only)
exports.rejectComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Comment is already rejected'
      });
    }

    const updatedComment = await Comment.updateStatus(id, 'rejected');

    res.json({
      success: true,
      message: 'Comment rejected successfully',
      data: updatedComment
    });
  } catch (error) {
    next(error);
  }
};

// Get comment statistics
exports.getCommentStats = async (req, res, next) => {
  try {
    const { news_id } = req.query;

    const stats = await Comment.getStats(news_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
