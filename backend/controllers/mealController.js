const Meal = require('../models/Meal');

// @desc    Get all meals
// @route   GET /api/meals
// @access  Public
const getMeals = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const meals = await Meal.find(query);
    res.json(meals);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meals' });
  }
};

// @desc    Get meal by ID
// @route   GET /api/meals/:id
// @access  Public
const getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (meal) {
      res.json(meal);
    } else {
      res.status(404).json({ message: 'Meal not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meal' });
  }
};

// @desc    Create a meal
// @route   POST /api/meals
// @access  Private/Admin
const createMeal = async (req, res) => {
  try {
    const { name, category, price, description } = req.body;
    const bodyImage = typeof req.body.image === 'string' ? req.body.image.trim() : '';
    const imagePath = req.file ? `uploads/${req.file.filename}` : bodyImage;

    if (!name || !category || !description || price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'name, category, price and description are required' });
    }

    const meal = new Meal({
      name: String(name).trim(),
      category: String(category).trim(),
      price: Number(price),
      description: String(description).trim(),
      image: imagePath,
    });

    const createdMeal = await meal.save();
    res.status(201).json(createdMeal);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create meal' });
  }
};

// @desc    Update a meal
// @route   PUT /api/meals/:id
// @access  Private/Admin
const updateMeal = async (req, res) => {
  try {
    const { name, category, price, description } = req.body;
    const bodyImage = typeof req.body.image === 'string' ? req.body.image.trim() : '';
    const imagePath = req.file ? `uploads/${req.file.filename}` : bodyImage;
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    if (!name || !category || !description || price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'name, category, price and description are required' });
    }

    meal.name = String(name).trim();
    meal.category = String(category).trim();
    meal.price = Number(price);
    meal.description = String(description).trim();
    if (imagePath) {
      meal.image = imagePath;
    }

    const updatedMeal = await meal.save();
    res.json(updatedMeal);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update meal' });
  }
};

// @desc    Delete a meal
// @route   DELETE /api/meals/:id
// @access  Private/Admin
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (meal) {
      await meal.deleteOne();
      res.json({ message: 'Meal removed' });
    } else {
      res.status(404).json({ message: 'Meal not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete meal' });
  }
};

module.exports = {
  getMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
};