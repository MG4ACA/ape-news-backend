const News = require('../models/News');
const { createImageVariants, deleteImage } = require('../utils/imageProcessor');
const path = require('path');

// Generate slug from title with transliteration support
const generateSlug = (title) => {
  // Transliteration map for Sinhala and Tamil characters to English
  const transliterationMap = {
    // Sinhala vowels
    අ: 'a',
    ආ: 'aa',
    ඇ: 'ae',
    ඈ: 'aae',
    ඉ: 'i',
    ඊ: 'ii',
    උ: 'u',
    ඌ: 'uu',
    එ: 'e',
    ඒ: 'ee',
    ඔ: 'o',
    ඕ: 'oo',
    'ං': 'n',
    'ඃ': 'h',
    // Sinhala consonants
    ක: 'ka',
    ඛ: 'kha',
    ග: 'ga',
    ඝ: 'gha',
    ච: 'cha',
    ඡ: 'chha',
    ජ: 'ja',
    ඣ: 'jha',
    ට: 'ta',
    ඨ: 'tha',
    ඩ: 'da',
    ඪ: 'dha',
    ණ: 'na',
    ත: 'tha',
    ථ: 'thha',
    ද: 'da',
    ධ: 'dha',
    න: 'na',
    ප: 'pa',
    ඵ: 'pha',
    බ: 'ba',
    භ: 'bha',
    ම: 'ma',
    ය: 'ya',
    ර: 'ra',
    ල: 'la',
    ව: 'va',
    ශ: 'sha',
    ෂ: 'shha',
    ස: 'sa',
    හ: 'ha',
    ළ: 'la',
    ෆ: 'fa',
    // Tamil vowels
    அ: 'a',
    ஆ: 'aa',
    இ: 'i',
    ஈ: 'ii',
    உ: 'u',
    ஊ: 'uu',
    எ: 'e',
    ஏ: 'ee',
    ஐ: 'ai',
    ஒ: 'o',
    ஓ: 'oo',
    ஔ: 'au',
    // Tamil consonants
    க: 'ka',
    ங: 'nga',
    ச: 'cha',
    ஞ: 'nya',
    ட: 'ta',
    ண: 'na',
    த: 'tha',
    ந: 'na',
    ப: 'pa',
    ம: 'ma',
    ய: 'ya',
    ர: 'ra',
    ல: 'la',
    வ: 'va',
    ழ: 'zha',
    ள: 'la',
    ற: 'ra',
    ன: 'na',
  };

  // Transliterate non-ASCII characters
  let slug = '';
  for (const char of title) {
    slug += transliterationMap[char] || char;
  }

  // Generate slug
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // If slug is empty or too short, add timestamp
  if (!slug || slug.length < 3) {
    slug = 'news-' + Date.now();
  }

  return slug;
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
      sort_order,
      language,
    } = req.query;

    const filters = {
      page,
      limit,
      category_id,
      author_id,
      is_featured: is_featured === 'true' ? 1 : is_featured === 'false' ? 0 : undefined,
      is_breaking: is_breaking === 'true' ? 1 : is_breaking === 'false' ? 0 : undefined,
      search,
      sort_by,
      sort_order,
      language: language && ['si', 'en', 'ta'].includes(language) ? language : undefined,
      includeUnpublished: false,
    };

    const result = await News.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Get news by category (public)
exports.getNewsByCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, is_featured, is_breaking, search, sort_by, sort_order, language } =
      req.query;

    const filters = {
      page,
      limit,
      category_id: id,
      is_featured: is_featured === 'true' ? 1 : is_featured === 'false' ? 0 : undefined,
      is_breaking: is_breaking === 'true' ? 1 : is_breaking === 'false' ? 0 : undefined,
      search,
      sort_by,
      sort_order,
      language: language && ['si', 'en', 'ta'].includes(language) ? language : undefined,
      includeUnpublished: false,
    };

    const result = await News.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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
      sort_order,
    } = req.query;

    const filters = {
      page,
      limit,
      category_id,
      author_id,
      status,
      is_featured: is_featured === 'true' ? 1 : is_featured === 'false' ? 0 : undefined,
      is_breaking: is_breaking === 'true' ? 1 : is_breaking === 'false' ? 0 : undefined,
      search,
      sort_by,
      sort_order,
      includeUnpublished: true,
    };

    const result = await News.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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
        message: 'News article not found',
      });
    }

    // Increment view count for published news
    if (news.status === 'published' && !req.user) {
      await News.incrementViews(news.id);
      news.views = (news.views || 0) + 1;
    }

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// Get related news by ID
exports.getRelatedNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4, language } = req.query;

    // First get the current news article to find its categories
    const currentNews = await News.findById(id, true);
    if (!currentNews) {
      return res.status(404).json({
        success: false,
        message: 'News article not found',
      });
    }

    // Get related news from same categories, excluding current article
    const filters = {
      limit: parseInt(limit),
      status: 'published',
      includeUnpublished: false,
    };

    if (language) {
      filters.language = language;
    }

    // If the article has categories, find related articles
    if (currentNews.categories && currentNews.categories.length > 0) {
      const categoryIds = currentNews.categories.map((cat) => cat.id);
      filters.category_id = categoryIds[0]; // Use first category for now
    }

    // Get news with filters
    const result = await News.getAll(filters);

    // Filter out the current article
    const relatedNews = result.data.filter((news) => news.id !== parseInt(id));

    res.json({
      success: true,
      data: relatedNews.slice(0, parseInt(limit)), // Ensure we don't exceed the limit
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
      excerpt,
      summary,
      content,
      title_si,
      title_en,
      title_ta,
      excerpt_si,
      excerpt_en,
      excerpt_ta,
      content_si,
      content_en,
      content_ta,
      category_ids,
      featured_image,
      youtube_url,
      status,
      is_featured,
      is_breaking,
      published_at,
      meta_title,
      meta_description,
      meta_keywords,
    } = req.body;

    // Validation - Sinhala content is required
    if (!title_si || !content_si) {
      return res.status(400).json({
        success: false,
        message: 'Sinhala title and content are required',
      });
    }

    // Generate slug if not provided (use Sinhala title as default)
    let newsSlug = slug || generateSlug(title_si || title);

    // Check if slug already exists and make it unique
    let existingNews = await News.findBySlug(newsSlug, true);
    if (existingNews) {
      // Add timestamp to make slug unique
      newsSlug = `${newsSlug}-${Date.now()}`;
    }

    // Process uploaded image
    let featuredImage = featured_image || null;
    if (req.file) {
      try {
        const variants = await createImageVariants(req.file.path);
        featuredImage = variants.large.filename;
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    const newsData = {
      title: title || title_si,
      slug: newsSlug,
      excerpt: excerpt || summary || excerpt_si,
      content: content || content_si,
      title_si,
      title_en,
      title_ta,
      excerpt_si,
      excerpt_en,
      excerpt_ta,
      content_si,
      content_en,
      content_ta,
      author_id: req.user.id,
      featured_image: featuredImage,
      youtube_url: youtube_url || null,
      status: status || 'draft',
      is_featured: is_featured || 0,
      is_breaking: is_breaking || 0,
      published_at: status === 'published' ? published_at || new Date() : null,
      meta_title,
      meta_description,
      meta_keywords,
    };

    const newsId = await News.create(newsData);

    // Set categories
    if (category_ids) {
      let categoryArray;
      if (Array.isArray(category_ids)) {
        categoryArray = category_ids
          .filter((id) => id != null && id !== '')
          .map((id) => parseInt(id));
      } else if (typeof category_ids === 'string') {
        categoryArray = category_ids
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      } else {
        categoryArray = [];
      }

      await News.setCategories(newsId, categoryArray);
    }

    const news = await News.findById(newsId, true);

    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: news,
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
      excerpt,
      summary,
      content,
      title_si,
      title_en,
      title_ta,
      excerpt_si,
      excerpt_en,
      excerpt_ta,
      content_si,
      content_en,
      content_ta,
      category_ids,
      featured_image,
      youtube_url,
      status,
      is_featured,
      is_breaking,
      published_at,
      meta_title,
      meta_description,
      meta_keywords,
    } = req.body;

    // Check if news exists
    const existingNews = await News.findById(id, true);
    if (!existingNews) {
      return res.status(404).json({
        success: false,
        message: 'News article not found',
      });
    }

    // Check authorization (author or editor+)
    if (
      req.user.role === 'user' ||
      (req.user.role === 'moderator' && existingNews.author_id !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this article',
      });
    }

    // If slug is being updated, check for duplicates
    if (slug && slug !== existingNews.slug) {
      const duplicateNews = await News.findBySlug(slug, true);
      if (duplicateNews) {
        return res.status(400).json({
          success: false,
          message: 'News article with this slug already exists',
        });
      }
    }

    // Process uploaded image
    let featuredImage = featured_image !== undefined ? featured_image : existingNews.featured_image;
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
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (summary !== undefined) updateData.excerpt = summary;
    if (content !== undefined) updateData.content = content;
    if (title_si !== undefined) updateData.title_si = title_si;
    if (title_en !== undefined) updateData.title_en = title_en;
    if (title_ta !== undefined) updateData.title_ta = title_ta;
    if (excerpt_si !== undefined) updateData.excerpt_si = excerpt_si;
    if (excerpt_en !== undefined) updateData.excerpt_en = excerpt_en;
    if (excerpt_ta !== undefined) updateData.excerpt_ta = excerpt_ta;
    if (content_si !== undefined) updateData.content_si = content_si;
    if (content_en !== undefined) updateData.content_en = content_en;
    if (content_ta !== undefined) updateData.content_ta = content_ta;
    if (featuredImage !== existingNews.featured_image) updateData.featured_image = featuredImage;
    if (youtube_url !== undefined) updateData.youtube_url = youtube_url;
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
      let categoryArray;
      if (Array.isArray(category_ids)) {
        categoryArray = category_ids
          .filter((id) => id != null && id !== '')
          .map((id) => parseInt(id));
      } else if (typeof category_ids === 'string') {
        categoryArray = category_ids
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      } else {
        categoryArray = [];
      }

      await News.setCategories(id, categoryArray);
    }

    const news = await News.findById(id, true);

    res.json({
      success: true,
      message: 'News article updated successfully',
      data: news,
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
        message: 'News article not found',
      });
    }

    // Check authorization (author or editor+)
    if (req.user.role === 'user' || req.user.role === 'moderator') {
      if (news.author_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this article',
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
      message: 'News article deleted successfully',
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
        message: 'News article not found',
      });
    }

    const updatedNews = await News.update(id, {
      is_featured: news.is_featured ? 0 : 1,
    });

    res.json({
      success: true,
      message: `News article ${updatedNews.is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: updatedNews,
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
        message: 'News article not found',
      });
    }

    const updatedNews = await News.update(id, {
      is_breaking: news.is_breaking ? 0 : 1,
    });

    res.json({
      success: true,
      message: `News article marked as ${
        updatedNews.is_breaking ? 'breaking' : 'regular'
      } successfully`,
      data: updatedNews,
    });
  } catch (error) {
    next(error);
  }
};

// Upload image only
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Process uploaded image
    const variants = await createImageVariants(req.file.path);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: `/uploads/images/news/${variants.large.filename}`,
        path: `/uploads/images/news/${variants.large.filename}`,
        filename: variants.large.filename,
        variants,
      },
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      const fs = require('fs').promises;
      try {
        await fs.unlink(req.file.path).catch(() => {});
      } catch (err) {
        console.error('Error deleting uploaded file:', err);
      }
    }
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message,
    });
  }
};
