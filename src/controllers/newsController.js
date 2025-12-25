const News = require('../models/News');
const { createImageVariants, deleteImage } = require('../utils/imageProcessor');
const path = require('path');

// Generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Get all news (public)
exports.getAllNews = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      category_id,
      author_id,
      is_featured,
      is_breaking,
      search,
      sort_by,
      sort_order
    } = req.query;

    const filters = {
      page,
      limit,
      category_id,
      author_id,
      is_featured: is_featured === 'true' ? 1 : (is_featured === 'false' ? 0 : undefined),
      is_breaking: is_breaking === 'true' ? 1 : (is_breaking === 'false' ? 0 : undefined),
      search,
      sort_by,
      sort_order,
      includeUnpublished: false
    };

    const result = await News.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get news for admin (includes unpublished)
exports.getAdminNews = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      category_id,
      author_id,
      status,
      is_featured,
      is_breaking,
      search,
      sort_by,
      sort_order
    } = req.query;

    const filters = {
      page,
      limit,
      category_id,
      author_id,
      status,
      is_featured: is_featured === 'true' ? 1 : (is_featured === 'false' ? 0 : undefined),
      is_breaking: is_breaking === 'true' ? 1 : (is_breaking === 'false' ? 0 : undefined),
      search,
      sort_by,
      sort_order,
      includeUnpublished: true
    };

    const result = await News.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get single news by ID or slug
exports.getNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user is authenticated (for viewing unpublished)
    const includeUnpublished = req.user ? true : false;
    
    let news;
    if (isNaN(id)) {
      news = await News.findBySlug(id, includeUnpublished);
    } else {
      news = await News.findById(id, includeUnpublished);
    }

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Increment view count for published news
    if (news.status === 'published' && !req.user) {
      await News.incrementViews(news.id);
      news.views = (news.views || 0) + 1;
    }

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    next(error);
  }
};

// Create news
exports.createNews = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      summary,
      content,
      category_ids,
      status,
      is_featured,
      is_breaking,
      published_at,
      meta_title,
      meta_description,
      meta_keywords
    } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Generate slug if not provided
    const newsSlug = slug || generateSlug(title);

    // Check if slug already exists
    const existingNews = await News.findBySlug(newsSlug, true);
    if (existingNews) {
      return res.status(400).json({
        success: false,
        message: 'News article with this slug already exists'
      });
    }

    // Process uploaded image
    let featuredImage = null;
    if (req.file) {
      try {
        const variants = await createImageVariants(req.file.path);
        featuredImage = variants.large.filename;
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    const newsData = {
      title,
      slug: newsSlug,
      summary,
      content,
      author_id: req.user.id,
      featured_image: featuredImage,
      status: status || 'draft',
      is_featured: is_featured || 0,
      is_breaking: is_breaking || 0,
      published_at: status === 'published' ? (published_at || new Date()) : null,
      meta_title,
      meta_description,
      meta_keywords
    };

    const newsId = await News.create(newsData);

    // Set categories
    if (category_ids) {
      const categoryArray = Array.isArray(category_ids) 
        ? category_ids 
        : category_ids.split(',').map(id => parseInt(id.trim()));
      
      await News.setCategories(newsId, categoryArray);
    }

    const news = await News.findById(newsId, true);

    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: news
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

// Update news
exports.updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      summary,
      content,
      category_ids,
      status,
      is_featured,
      is_breaking,
      published_at,
      meta_title,
      meta_description,
      meta_keywords
    } = req.body;

    // Check if news exists
    const existingNews = await News.findById(id, true);
    if (!existingNews) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Check authorization (author or editor+)
    if (req.user.role === 'user' || 
        (req.user.role === 'moderator' && existingNews.author_id !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this article'
      });
    }

    // If slug is being updated, check for duplicates
    if (slug && slug !== existingNews.slug) {
      const duplicateNews = await News.findBySlug(slug, true);
      if (duplicateNews) {
        return res.status(400).json({
          success: false,
          message: 'News article with this slug already exists'
        });
      }
    }

    // Process uploaded image
    let featuredImage = existingNews.featured_image;
    if (req.file) {
      try {
        // Delete old image
        if (existingNews.featured_image) {
          await deleteImage(existingNews.featured_image);
        }
        
        const variants = await createImageVariants(req.file.path);
        featuredImage = variants.large.filename;
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (summary !== undefined) updateData.summary = summary;
    if (content !== undefined) updateData.content = content;
    if (featuredImage !== existingNews.featured_image) updateData.featured_image = featuredImage;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !existingNews.published_at) {
        updateData.published_at = published_at || new Date();
      }
    }
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (is_breaking !== undefined) updateData.is_breaking = is_breaking;
    if (published_at !== undefined) updateData.published_at = published_at;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords;

    await News.update(id, updateData);

    // Update categories if provided
    if (category_ids !== undefined) {
      const categoryArray = Array.isArray(category_ids) 
        ? category_ids 
        : category_ids.split(',').map(id => parseInt(id.trim()));
      
      await News.setCategories(id, categoryArray);
    }

    const news = await News.findById(id, true);

    res.json({
      success: true,
      message: 'News article updated successfully',
      data: news
    });
  } catch (error) {
    next(error);
  }
};

// Delete news
exports.deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id, true);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Check authorization (author or editor+)
    if (req.user.role === 'user' || req.user.role === 'moderator') {
      if (news.author_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this article'
        });
      }
    }

    // Delete featured image
    if (news.featured_image) {
      try {
        await deleteImage(news.featured_image);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await News.delete(id);

    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle featured status
exports.toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id, true);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    const updatedNews = await News.update(id, {
      is_featured: news.is_featured ? 0 : 1
    });

    res.json({
      success: true,
      message: `News article ${updatedNews.is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: updatedNews
    });
  } catch (error) {
    next(error);
  }
};

// Toggle breaking status
exports.toggleBreaking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id, true);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    const updatedNews = await News.update(id, {
      is_breaking: news.is_breaking ? 0 : 1
    });

    res.json({
      success: true,
      message: `News article marked as ${updatedNews.is_breaking ? 'breaking' : 'regular'} successfully`,
      data: updatedNews
    });
  } catch (error) {
    next(error);
  }
};
