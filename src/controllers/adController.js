const Ad = require('../models/Ad');
const { createImageVariants, deleteImage } = require('../utils/imageProcessor');

// Get all active ads (public)
exports.getActiveAds = async (req, res, next) => {
  try {
    const { position } = req.query;

    let ads;
    if (position) {
      ads = await Ad.getActiveByPosition(position);
      return res.json({
        success: true,
        data: ads,
      });
    }

    // Get all active ads grouped by position
    ads = await Ad.getActive();

    res.json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

// Get all ads (admin)
exports.getAllAds = async (req, res, next) => {
  try {
    const { page, limit, position, is_active, sort_by, sort_order } = req.query;

    const filters = {
      page,
      limit,
      position,
      is_active: is_active === 'true' ? 1 : is_active === 'false' ? 0 : undefined,
      sort_by,
      sort_order,
      checkDates: false,
    };

    const result = await Ad.getAll(filters);

    if (result.pagination) {
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get single ad
exports.getAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    res.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

// Create ad
exports.createAd = async (req, res, next) => {
  try {
    const { title, link_url, position, display_order, is_active, start_date, end_date } = req.body;

    // Validation
    if (!title || !position) {
      return res.status(400).json({
        success: false,
        message: 'Title and position are required',
      });
    }

    // Validate position
    const validPositions = ['header', 'sidebar', 'content_top', 'content_middle', 'content_bottom'];
    if (!validPositions.includes(position)) {
      return res.status(400).json({
        success: false,
        message: `Invalid position. Must be one of: ${validPositions.join(', ')}`,
      });
    }

    // Validate dates
    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Ad image is required',
      });
    }

    // Process uploaded image
    let adImage = null;
    try {
      const variants = await createImageVariants(req.file.path);
      adImage = variants.large.filename;
    } catch (error) {
      console.error('Error processing image:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing ad image',
      });
    }

    const adData = {
      title,
      image: adImage,
      link_url,
      position,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : 1,
      start_date: start_date || null,
      end_date: end_date || null,
    };

    const ad = await Ad.create(adData);

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: ad,
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        await deleteImage(req.file.filename);
      } catch (err) {
        console.error('Error deleting uploaded file:', err);
      }
    }
    next(error);
  }
};

// Update ad
exports.updateAd = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, link_url, position, display_order, is_active, start_date, end_date } = req.body;

    // Check if ad exists
    const existingAd = await Ad.findById(id);
    if (!existingAd) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    // Validate position if provided
    if (position) {
      const validPositions = [
        'header',
        'sidebar',
        'content_top',
        'content_middle',
        'content_bottom',
      ];
      if (!validPositions.includes(position)) {
        return res.status(400).json({
          success: false,
          message: `Invalid position. Must be one of: ${validPositions.join(', ')}`,
        });
      }
    }

    // Validate dates if provided
    const newStartDate = start_date !== undefined ? start_date : existingAd.start_date;
    const newEndDate = end_date !== undefined ? end_date : existingAd.end_date;

    if (newStartDate && newEndDate && new Date(newStartDate) > new Date(newEndDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
    }

    // Process new image if uploaded
    let adImage = existingAd.image;
    if (req.file) {
      try {
        // Delete old image
        if (existingAd.image) {
          await deleteImage(existingAd.image);
        }

        const variants = await createImageVariants(req.file.path);
        adImage = variants.large.filename;
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (adImage !== existingAd.image) updateData.image = adImage;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (position !== undefined) updateData.position = position;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    const ad = await Ad.update(id, updateData);

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

// Delete ad
exports.deleteAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    // Delete ad image
    if (ad.image) {
      try {
        await deleteImage(ad.image);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await Ad.delete(id);

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Track ad click
exports.trackClick = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    await Ad.incrementClicks(id);

    // Return the link URL for redirect
    res.json({
      success: true,
      data: {
        link_url: ad.link_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reorder ads
exports.reorderAds = async (req, res, next) => {
  try {
    const { ads } = req.body;

    if (!Array.isArray(ads) || ads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ads array is required',
      });
    }

    // Validate structure
    for (const ad of ads) {
      if (!ad.id || ad.display_order === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each ad must have id and display_order',
        });
      }
    }

    await Ad.reorder(ads);

    res.json({
      success: true,
      message: 'Ads reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get ad statistics
exports.getAdStats = async (req, res, next) => {
  try {
    const stats = await Ad.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
