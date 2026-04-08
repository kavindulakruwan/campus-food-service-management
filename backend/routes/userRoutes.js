const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  deleteUser,
  getAllUsers,
  getUserById,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  resetUserPassword,
  toggleUserStatus,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);

// Private user routes
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile).delete(protect, deleteUser);
router.route('/profile/photo').put(protect, upload.single('profilePhoto'), uploadProfilePhoto);

// Admin routes
router.route('/admin/all').get(protect, admin, getAllUsers);
router.route('/admin/create').post(protect, admin, createUserAdmin);
router.route('/admin/:id').get(protect, admin, getUserById).put(protect, admin, updateUserAdmin).delete(protect, admin, deleteUserAdmin);
router.route('/admin/:id/reset-password').put(protect, admin, resetUserPassword);
router.route('/admin/:id/toggle-status').put(protect, admin, toggleUserStatus);

module.exports = router;