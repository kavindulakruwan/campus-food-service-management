const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');

const toUploadsRelativePath = (rawPath) => {
  if (!rawPath) return '';

  const normalized = String(rawPath).replace(/\\/g, '/');
  const uploadsIndex = normalized.toLowerCase().lastIndexOf('/uploads/');

  if (uploadsIndex !== -1) {
    return normalized.substring(uploadsIndex + 1);
  }

  const fileName = path.basename(normalized);
  return fileName ? `uploads/${fileName}` : '';
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const normalizedPhotoPath = toUploadsRelativePath(user.profilePhoto);

    if (normalizedPhotoPath && normalizedPhotoPath !== user.profilePhoto) {
      user.profilePhoto = normalizedPhotoPath;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: normalizedPhotoPath,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Upload profile photo
// @route   PUT /api/users/profile/photo
// @access  Private
const uploadProfilePhoto = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const normalizedPath = toUploadsRelativePath(req.file.path || `uploads/${req.file.filename}`);
    user.profilePhoto = normalizedPath;
    await user.save();
    res.json({
      message: 'Profile photo uploaded successfully',
      profilePhoto: normalizedPath,
      profilePhotoUrl: `http://localhost:5000/${normalizedPath.replace(/^\/+/, '')}`,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Private
const deleteUser = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// ADMIN FUNCTIONS

// @desc    Get all users
// @route   GET /api/users/admin/all
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// @desc    Get single user by ID (Admin)
// @route   GET /api/users/admin/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// @desc    Create user (Admin)
// @route   POST /api/users/admin/create
// @access  Private/Admin
const createUserAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/admin/:id
// @access  Private/Admin
const updateUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/admin/:id
// @access  Private/Admin
const deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndRemove(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// @desc    Reset user password (Admin)
// @route   PUT /api/users/admin/:id/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res) => {
  const { newPassword } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// @desc    Toggle user account status (Admin)
// @route   PUT /api/users/admin/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      _id: user._id,
      isActive: user.isActive,
      message: `Account ${user.isActive ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle account status' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  deleteUser,
  // Admin functions
  getAllUsers,
  getUserById,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  resetUserPassword,
  toggleUserStatus,
};