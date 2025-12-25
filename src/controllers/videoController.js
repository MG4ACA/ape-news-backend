const Video = require('../models/Video');

// Get all videos (public - only published)
exports.getAllVideos = async (req, res, next) => {
  try {
    const { page, limit, category_id, is_featured, search, sort_by, sort_order } = req.query;

    const filters = {
      page,
      limit,
      category_id,
      is_featured,
      search,
      sort_by,
      sort_order,
      is_active: 1,
    };

    const result = await Video.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Get videos for admin (includes unpublished)
exports.getAdminVideos = async (req, res, next) => {
  try {
    const { page, limit, category_id, status, is_featured, search, sort_by, sort_order } =
      req.query;

    const filters = {
      page,
      limit,
      category_id,
      is_active:
        req.query.is_active === 'true' ? 1 : req.query.is_active === 'false' ? 0 : undefined,
      is_featured,
      search,
      sort_by,
      sort_order,
    };

    const result = await Video.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Get single video
exports.getVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Check if user can view inactive videos
    if (!video.is_active) {
      if (!req.user || !['editor', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this video',
        });
      }
    }

    // Increment view count for active videos
    if (video.is_active && !req.user) {
      await Video.incrementViews(video.id);
      video.views_count = (video.views_count || 0) + 1;
    }

    res.json({
      success: true,
      data: video,
    });
  } catch (error) {
    next(error);
  }
};

// Create video
exports.createVideo = async (req, res, next) => {
  try {
    const { title, description, youtube_url, category_id, display_order, is_active } = req.body;

    // Validation
    if (!title || !youtube_url) {
      return res.status(400).json({
        success: false,
        message: 'Title and YouTube URL are required',
      });
    }

    // Extract YouTube video ID
    const youtubeId = Video.extractYouTubeId(youtube_url);
    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL',
      });
    }

    // Get thumbnail URL
    const thumbnailUrl = Video.getThumbnailUrl(youtubeId);

    const videoData = {
      title,
      description,
      youtube_url,
      youtube_id: youtubeId,
      thumbnail: thumbnailUrl,
      category_id: category_id || null,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : 1,
    };

    const video = await Video.create(videoData);

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: video,
    });
  } catch (error) {
    next(error);
  }
};

// Update video
exports.updateVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, youtube_url, category_id, display_order, is_active } = req.body;

    // Check if video exists
    const existingVideo = await Video.findById(id);
    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    // If YouTube URL is being updated, extract new video ID
    if (youtube_url && youtube_url !== existingVideo.youtube_url) {
      const youtubeId = Video.extractYouTubeId(youtube_url);
      if (!youtubeId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid YouTube URL',
        });
      }

      updateData.youtube_url = youtube_url;
      updateData.youtube_id = youtubeId;
      updateData.thumbnail = Video.getThumbnailUrl(youtubeId);
    }

    const video = await Video.update(id, updateData);

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: video,
    });
  } catch (error) {
    next(error);
  }
};

// Delete video
exports.deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    await Video.delete(id);

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Toggle active status
exports.toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const updatedVideo = await Video.update(id, {
      is_active: video.is_active ? 0 : 1,
    });

    res.json({
      success: true,
      message: `Video ${updatedVideo.is_active ? 'activated' : 'deactivated'} successfully`,
      data: updatedVideo,
    });
  } catch (error) {
    next(error);
  }
};

// Get video statistics
exports.getVideoStats = async (req, res, next) => {
  try {
    const stats = await Video.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
