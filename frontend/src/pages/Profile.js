import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { api } from '../services/api';

const getProfilePhotoUrl = (photoPath) => {
  if (!photoPath) return '';

  let normalizedPath = String(photoPath).replace(/\\/g, '/');
  if (normalizedPath.startsWith('data:image/') || normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }

  const uploadsIndex = normalizedPath.toLowerCase().lastIndexOf('/uploads/');
  if (uploadsIndex !== -1) {
    normalizedPath = normalizedPath.substring(uploadsIndex + 1);
  } else {
    normalizedPath = normalizedPath.replace(/^\/+/, '');
    normalizedPath = normalizedPath.replace(/^backend\//i, '');
    if (!normalizedPath.toLowerCase().startsWith('uploads/')) {
      normalizedPath = `uploads/${normalizedPath.split('/').pop()}`;
    }
  }

  return `http://localhost:5000/${normalizedPath}`;
};

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [favoriteMeals, setFavoriteMeals] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.getProfile();
        setName(data.name);
        setEmail(data.email);
        setProfilePhoto(data.profilePhoto);
        setPhotoPreview(getProfilePhotoUrl(data.profilePhoto));
      } catch (error) {
        console.error('Failed to fetch profile');
      }
    };
    if (user) {
      fetchProfile();
      // Load favorites from localStorage
      const storedFavorites = localStorage.getItem(`favorites_${user._id}`);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    }
  }, [user]);

  useEffect(() => {
    // Fetch meal details for favorites
    const fetchFavoriteMeals = async () => {
      if (favorites.length === 0) {
        setFavoriteMeals([]);
        return;
      }
      try {
        const { data: allMeals } = await api.getMeals();
        const favMeals = allMeals.filter(meal => favorites.includes(meal._id));
        setFavoriteMeals(favMeals);
      } catch (error) {
        console.error('Failed to fetch favorite meals');
      }
    };
    fetchFavoriteMeals();
  }, [favorites]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile({ name, email });
      alert('Profile updated');
    } catch (error) {
      alert('Update failed');
    }
  };

  const handlePhotoUpload = async (e) => {
    if (!e.target.files[0]) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profilePhoto', file);
    const localPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(localPreviewUrl);
    
    try {
      const { data } = await api.uploadProfilePhoto(formData);
      const photoPath = data.profilePhoto || data.profilePhotoUrl;
      setProfilePhoto(data.profilePhoto || '');
      if (photoPath) {
        setPhotoPreview(getProfilePhotoUrl(photoPath));
      }
      alert('Photo uploaded successfully');
    } catch (error) {
      setPhotoPreview(localPreviewUrl);
      alert('Upload failed');
    }
  };

  const removeFavorite = (mealId) => {
    const updatedFavorites = favorites.filter(id => id !== mealId);
    setFavorites(updatedFavorites);
    localStorage.setItem(`favorites_${user._id}`, JSON.stringify(updatedFavorites));
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

  if (!user) return <div className="container mt-5"><p>Please login</p></div>;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-center">Profile</h2>
            </div>
            <div className="card-body">
              {photoPreview ? (
                <div className="text-center mb-4">
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="rounded-circle"
                    style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'cover',
                      border: '3px solid #007bff'
                    }}
                  />
                </div>
              ) : (
                <div className="text-center mb-4 text-muted">
                  <div
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      margin: '0 auto',
                      border: '2px dashed #6c7ea6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                    }}
                  >
                    No photo
                  </div>
                </div>
              )}
              <form onSubmit={handleUpdate}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Update Profile</button>
              </form>
              <div className="mt-3">
                <label htmlFor="profilePhoto" className="form-label">Profile Photo</label>
                <input
                  type="file"
                  className="form-control"
                  id="profilePhoto"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      <div className="mt-5">
        <h2 className="text-center mb-4">My Favorite Meals</h2>
        {favoriteMeals.length === 0 ? (
          <div className="text-center text-muted">
            <p>No favorite meals yet. Add meals to your favorites!</p>
          </div>
        ) : (
          <div className="row">
            {favoriteMeals.map((meal) => (
              <div key={meal._id} className="col-md-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={getMealImageUrl(meal.image)}
                    className="card-img-top"
                    alt={meal.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{meal.name}</h5>
                    <p className="card-text">{meal.description}</p>
                    <p className="card-text"><strong>LKR {meal.price}</strong></p>
                    <button
                      onClick={() => removeFavorite(meal._id)}
                      className="btn btn-danger w-100"
                    >
                      Remove from Favorites
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;