import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { api } from '../services/api';
import './MealList.css';

const MealList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const fetchMeals = async () => {
    try {
      const { data } = await api.getMeals({ search, category, minPrice, maxPrice });
      setMeals(data);
    } catch (error) {
      console.error('Failed to fetch meals');
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [search, category, minPrice, maxPrice]);

  useEffect(() => {
    // Load favorites from localStorage
    if (user) {
      const storedFavorites = localStorage.getItem(`favorites_${user._id}`);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    }
  }, [user]);

  const toggleFavorite = (mealId) => {
    if (!user) {
      alert('Please login to add favorites');
      return;
    }
    
    const updatedFavorites = favorites.includes(mealId)
      ? favorites.filter(id => id !== mealId)
      : [...favorites, mealId];
    
    setFavorites(updatedFavorites);
    localStorage.setItem(`favorites_${user._id}`, JSON.stringify(updatedFavorites));
  };

  const handleOrderClick = (mealId) => {
    if (!user) {
      alert('Please login to place an order');
      return;
    }
    navigate('/order', { state: { mealId } });
  };

  const getMealImageUrl = (image) => {
    const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500"%3E%3Crect width="900" height="500" fill="%23eceff3"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="Arial" font-size="40"%3ENo Meal Image%3C/text%3E%3C/svg%3E';
    if (!image) return defaultImage;
    const normalizedPath = String(image).replace(/\\/g, '/');
    if (normalizedPath.startsWith('data:image/') || normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      return normalizedPath;
    }
    return `http://localhost:5000/${normalizedPath.replace(/^\/+/, '')}`;
  };

  return (
    <div className="container-fluid py-4 px-4 meal-page-wrap">
      <section className="recipe-header-shell mb-4">
        <div className="recipe-top-strip">
          <div className="recipe-mini-links">
            <span>About</span>
            <span>Shop</span>
            <span>Subscribe</span>
          </div>
          <div className="recipe-mini-search">Search recipes...</div>
        </div>

        <div className="recipe-main-nav">
          <div className="recipe-logo-mark" aria-hidden="true">🥣</div>
          <div className="recipe-logo-text">From Campus Bowl</div>
          <div className="recipe-nav-links">
            <button type="button" onClick={() => setCategory('')}>All Recipes</button>
            <button type="button" onClick={() => setCategory('Breakfast')}>Breakfast</button>
            <button type="button" onClick={() => setCategory('Lunch')}>Lunch</button>
            <button type="button" onClick={() => setCategory('Dinner')}>Dinner</button>
            <button type="button" onClick={() => setCategory('Snack')}>Snack</button>
          </div>
        </div>

        <div className="recipe-headline">
          SIMPLE & DELICIOUS CAMPUS RECIPES
        </div>

        <div className="meal-user-note mb-0">Welcome, {user?.name || 'Guest'}.</div>
      </section>

      <div className="card mb-4 shadow-sm meal-filter-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="meal-search-input-wrap">
                <span className="meal-search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  className="form-control meal-filter-input meal-search-field"
                  placeholder="Search meals"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select meal-filter-input"
                value={category}
                size={showCategoryOptions ? 5 : 1}
                onMouseEnter={() => setShowCategoryOptions(true)}
                onMouseLeave={() => setShowCategoryOptions(false)}
                onBlur={() => setShowCategoryOptions(false)}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setShowCategoryOptions(false);
                }}
              >
                <option value="">All Categories</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control meal-filter-input"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control meal-filter-input"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn w-100 meal-clear-btn"
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {meals.map((meal) => {
          const imageUrl = getMealImageUrl(meal.image);
          const isFavorite = favorites.includes(meal._id);
          return (
            <div key={meal._id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm position-relative meal-card">
                <button
                  onClick={() => toggleFavorite(meal._id)}
                  className="btn btn-link position-absolute meal-fav-btn"
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <span className={isFavorite ? 'meal-fav-active' : 'meal-fav-idle'}>★</span>
                </button>
                <img
                  src={imageUrl}
                  className="card-img-top"
                  alt={meal.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{meal.name}</h5>
                  <p className="card-text meal-description">{meal.description}</p>
                  <p className="card-text meal-price"><strong>LKR {meal.price}</strong></p>
                  <div className="d-flex gap-2 mt-3">
                    <Link to={`/meals/${meal._id}`} className="btn meal-btn-secondary flex-grow-1">View Details</Link>
                    <button onClick={() => handleOrderClick(meal._id)} className="btn meal-btn-primary flex-grow-1">Order</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MealList;