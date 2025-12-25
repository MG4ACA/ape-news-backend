const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await User.getProfile(req.user.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// Update current user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, email, full_name, avatar, password, current_password } = req.body;

    // If changing password, verify current password
    if (password) {
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
      }

      const user = await User.findById(req.user.id);
      const isPasswordValid = await bcrypt.compare(current_password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
    }

    // Check if email/username is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }
    }

    if (username && username !== req.user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Username is already in use',
        });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (full_name) updateData.full_name = full_name;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedProfile = await User.updateProfile(req.user.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// Get user bookmarks
exports.getBookmarks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await User.getBookmarks(req.user.id, {
      page,
      limit,
      includeUnpublished: false,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Add bookmark
exports.addBookmark = async (req, res, next) => {
  try {
    const { news_id } = req.body;

    if (!news_id) {
      return res.status(400).json({
        success: false,
        message: 'News ID is required',
      });
    }

    // Check if already bookmarked
    const isBookmarked = await User.checkBookmark(req.user.id, news_id);
    if (isBookmarked) {
      return res.status(400).json({
        success: false,
        message: 'Article is already bookmarked',
      });
    }

    await User.addBookmark(req.user.id, news_id);

    res.status(201).json({
      success: true,
      message: 'Article bookmarked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Remove bookmark
exports.removeBookmark = async (req, res, next) => {
  try {
    const { newsId } = req.params;

    const removed = await User.removeBookmark(req.user.id, newsId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found',
      });
    }

    res.json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Check if article is bookmarked
exports.checkBookmark = async (req, res, next) => {
  try {
    const { newsId } = req.params;

    const isBookmarked = await User.checkBookmark(req.user.id, newsId);

    res.json({
      success: true,
      data: {
        is_bookmarked: isBookmarked,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, is_active, search } = req.query;

    const result = await User.getAllWithPagination({
      page,
      limit,
      role,
      is_active: is_active !== undefined ? parseInt(is_active) : undefined,
      search,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get single user
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.getProfile(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create new user
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, full_name, role, is_active } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use',
      });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already in use',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.createByAdmin({
      username,
      email,
      password: hashedPassword,
      full_name: full_name || null,
      role: role || 'user',
      is_active: is_active !== undefined ? is_active : 1,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, password, full_name, role, is_active, avatar } = req.body;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent super admin from being modified by non-super admins
    if (existingUser.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You cannot modify a super admin account',
      });
    }

    // Check if email/username is already taken by another user
    if (email && email !== existingUser.email) {
      const emailUser = await User.findByEmail(email);
      if (emailUser && emailUser.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }
    }

    if (username && username !== existingUser.username) {
      const usernameUser = await User.findByUsername(username);
      if (usernameUser && usernameUser.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Username is already in use',
        });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const user = await User.updateByAdmin(id, updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deletion of super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin account',
      });
    }

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await User.delete(id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
