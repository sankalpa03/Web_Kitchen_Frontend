import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../css/recipeDetail.css';

type DetailDirection = {
  step_number: number;
  direction: string;
  direction_photo: string | null;
};

type DetailPreparation = {
  prep_time: string;
  cook_time: string;
  total_time: string;
  serving: number;
  recipe_video: string | null;
};

type DetailNutrition = {
  total_calories: number;
  fat: number;
  saturated_fat: number;
  cholesterol: number;
  sodium: number;
  carbohydrates: number;
  fiber: number;
  sugar: number;
  protein: number;
  vitamin_c: number;
  calcium: number;
  iron: number;
  potassium: number;
  magnesium: number;
  vitamin_a: number;
};

type RecipeDetailType = {
  id: string;
  title: string;
  user: number;
  description: string;
  recipe_image: string | null;
  category: {
    id: string;
    name: string;
  };
  ingredients: string;
  yield_amount: string;
  upload_date: string;
  preparations: DetailPreparation[];
  nutrition: DetailNutrition[];
  directions: DetailDirection[];
};

interface RecipeDetailModalProps {
  recipeId: string | null;
  onClose: () => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipeId, onClose }) => {
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchRecipeDetail = async () => {
      if (!recipeId) {
        setError('No recipe ID provided');
        setLoading(false);
        return;
      }

      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          navigate('/signin');
          return;
        }

        const response = await fetch(`http://127.0.0.1:8000/recipe/detail/${recipeId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/signin');
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setRecipe(data);
      } catch (err: any) {
        console.error('Error fetching recipe details:', err);
        setError(err.message || 'Failed to load recipe details');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetail();
  }, [recipeId, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (!recipeId) return null;

  return (
    <div className="modal-overlay active">
      <div className="recipe-modal-content" ref={modalRef}>
        <button 
          onClick={onClose} 
          className="modal-close-btn"
          aria-label="Close modal"
        >
          &times;
        </button>

        {loading ? (
          <div className="recipe-detail-loading">
            <div className="loading-spinner"></div>
            <p>Loading recipe...</p>
          </div>
        ) : error ? (
          <div className="recipe-detail-error">
            <h2>Error Loading Recipe</h2>
            <p>{error}</p>
          </div>
        ) : !recipe ? (
          <div className="recipe-detail-error">
            <h2>Recipe Not Found</h2>
            <p>We couldn't find the recipe you're looking for.</p>
          </div>
        ) : (
          <div className="recipe-detail-container">
            <div className="recipe-detail-header">
              <h1 className="recipe-detail-title">{recipe.title}</h1>
              <div className="recipe-meta">
                <span className="recipe-category">{recipe.category.name}</span>
                <span className="recipe-date">Posted on {formatDate(recipe.upload_date)}</span>
              </div>
            </div>

            <div className="recipe-detail-content">
              <div className="recipe-detail-main">
                {recipe.recipe_image && (
                  <div className="recipe-image-container">
                    <img 
                      src={recipe.recipe_image} 
                      alt={recipe.title} 
                      className="recipe-detail-image" 
                    />
                  </div>
                )}
                
                <div className="recipe-description">
                  <h2>Description</h2>
                  <p>{recipe.description}</p>
                </div>

                <div className="recipe-preparation-info">
                  <div className="prep-info-item">
                    <h3>Prep Time</h3>
                    <p>{recipe.preparations[0]?.prep_time || 'Not specified'}</p>
                  </div>
                  <div className="prep-info-item">
                    <h3>Cook Time</h3>
                    <p>{recipe.preparations[0]?.cook_time || 'Not specified'}</p>
                  </div>
                  <div className="prep-info-item">
                    <h3>Total Time</h3>
                    <p>{recipe.preparations[0]?.total_time || 'Not specified'}</p>
                  </div>
                  <div className="prep-info-item">
                    <h3>Servings</h3>
                    <p>{recipe.yield_amount || recipe.preparations[0]?.serving}</p>
                  </div>
                </div>

                <div className="recipe-ingredients">
                  <h2>Ingredients</h2>
                  <ul>
                    {recipe.ingredients.split(',').map((ingredient, index) => (
                      <li key={index}>{ingredient.trim()}</li>
                    ))}
                  </ul>
                </div>

                <div className="recipe-directions">
                  <h2>Directions</h2>
                  <ol>
                    {recipe.directions.map((step) => (
                      <li key={step.step_number} className="direction-step">
                        <div className="direction-content">
                          <strong>Step {step.step_number}</strong>
                          <p>{step.direction}</p>
                        </div>
                        {step.direction_photo && (
                          <div className="direction-photo">
                            <img 
                              src={step.direction_photo} 
                              alt={`Step ${step.step_number}`} 
                              className="step-image" 
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="recipe-detail-sidebar">
                <div className="nutrition-facts">
                  <h2>Nutrition Facts</h2>
                  {recipe.nutrition && recipe.nutrition.length > 0 ? (
                    <table className="nutrition-table">
                      <tbody>
                        <tr>
                          <td>Calories:</td>
                          <td>{recipe.nutrition[0].total_calories}</td>
                        </tr>
                        <tr>
                          <td>Fat:</td>
                          <td>{recipe.nutrition[0].fat}g</td>
                        </tr>
                        <tr>
                          <td>Saturated Fat:</td>
                          <td>{recipe.nutrition[0].saturated_fat}g</td>
                        </tr>
                        <tr>
                          <td>Cholesterol:</td>
                          <td>{recipe.nutrition[0].cholesterol}mg</td>
                        </tr>
                        <tr>
                          <td>Sodium:</td>
                          <td>{recipe.nutrition[0].sodium}mg</td>
                        </tr>
                        <tr>
                          <td>Carbohydrates:</td>
                          <td>{recipe.nutrition[0].carbohydrates}g</td>
                        </tr>
                        <tr>
                          <td>Fiber:</td>
                          <td>{recipe.nutrition[0].fiber}g</td>
                        </tr>
                        <tr>
                          <td>Sugar:</td>
                          <td>{recipe.nutrition[0].sugar}g</td>
                        </tr>
                        <tr>
                          <td>Protein:</td>
                          <td>{recipe.nutrition[0].protein}g</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p>No nutrition information available</p>
                  )}
                </div>
                
                <div className="recipe-actions">
                  <button 
                    onClick={() => {
                      onClose();
                      navigate(`/recipes/edit/${recipe.id}`);
                    }} 
                    className="edit-recipe-btn"
                  >
                    Edit Recipe
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="print-recipe-btn"
                  >
                    Print Recipe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetailModal;
