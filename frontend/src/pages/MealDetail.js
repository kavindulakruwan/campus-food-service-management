import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

const MealDetail = () => {
  const { id } = useParams();
  const [meal, setMeal] = useState(null);

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const { data } = await api.getMealById(id);
        setMeal(data);
      } catch (error) {
        console.error('Failed to fetch meal');
      }
    };
    fetchMeal();
  }, [id]);

  const getMealImageUrl = (image) => {
    if (!image) return '';
    const normalizedPath = String(image).replace(/\\/g, '/');
    if (normalizedPath.startsWith('data:image/') || normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      return normalizedPath;
    }
    return `http://localhost:5000/${normalizedPath.replace(/^\/+/, '')}`;
  };

  if (!meal) return <div className="container mt-5"><div className="text-center">Loading...</div></div>;

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          {meal.image && (
            <img
              src={getMealImageUrl(meal.image)}
              className="img-fluid rounded"
              alt={meal.name}
            />
          )}
        </div>
        <div className="col-md-6">
          <h1>{meal.name}</h1>
          <p className="lead">{meal.description}</p>
          <p><strong>Category:</strong> {meal.category}</p>
          <p><strong>Price:</strong> LKR {meal.price}</p>
        </div>
      </div>
    </div>
  );
};

export default MealDetail;