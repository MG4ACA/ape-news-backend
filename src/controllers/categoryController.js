const Category = require('../models/Category');

// Generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const { parent_id, is_active, tree } = req.query;

    // If tree view is requested
    if (tree === 'true') {
      const categoryTree = await Category.getTree();
      return res.json({
        success: true,
        data: categoryTree,
      });
    }

    // Build filters
    const filters = {};
    if (parent_id !== undefined) {
      filters.parent_id = parent_id === 'null' ? null : parseInt(parent_id);
    }
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true' ? 1 : 0;
    }

    const categories = await Category.getAll(filters);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Get single category by ID or slug
exports.getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if it's a slug or ID
    let category;
    if (isNaN(id)) {
      category = await Category.findBySlug(id);
    } else {
      category = await Category.findById(id);
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Get children
    const children = await Category.getChildren(category.id);

    res.json({
      success: true,
      data: {
        ...category,
        children,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get category children
exports.getCategoryChildren = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const children = await Category.getChildren(id);

    res.json({
      success: true,
      data: children,
    });
  } catch (error) {
    next(error);
  }
};

// Create new category
exports.createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parent_id, display_order, is_active } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Generate slug if not provided
    const categorySlug = slug || generateSlug(name);

    // Check if slug already exists
    const existingCategory = await Category.findBySlug(categorySlug);
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists',
      });
    }

    // Verify parent category exists if parent_id is provided
    if (parent_id) {
      const parentCategory = await Category.findById(parent_id);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found',
        });
      }
    }

    const categoryData = {
      name,
      slug: categorySlug,
      description,
      parent_id: parent_id || null,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : 1,
    };

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parent_id, display_order, is_active } = req.body;

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // If slug is being updated, check for duplicates
    if (slug && slug !== existingCategory.slug) {
      const duplicateCategory = await Category.findBySlug(slug);
      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists',
        });
      }
    }

    // Verify parent category exists if parent_id is provided
    if (parent_id !== undefined && parent_id !== null) {
      const parentCategory = await Category.findById(parent_id);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found',
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const category = await Category.update(id, updateData);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    if (error.message.includes('circular reference')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    await Category.delete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    if (error.message.includes('child categories') || error.message.includes('news articles')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// Deactivate category (soft delete)
exports.deactivateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const updatedCategory = await Category.deactivate(id);

    res.json({
      success: true,
      message: 'Category deactivated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

// Reorder categories
exports.reorderCategories = async (req, res, next) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Categories array is required',
      });
    }

    // Validate structure
    for (const cat of categories) {
      if (!cat.id || cat.display_order === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each category must have id and display_order',
        });
      }
    }

    await Category.reorder(categories);

    res.json({
      success: true,
      message: 'Categories reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};
