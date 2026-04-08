const express = require('express');
const {
  getMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
} = require('../controllers/mealController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').get(getMeals).post(protect, admin, upload.single('image'), createMeal);
router.route('/:id').get(getMealById).put(protect, admin, upload.single('image'), updateMeal).delete(protect, admin, deleteMeal);

module.exports = router;