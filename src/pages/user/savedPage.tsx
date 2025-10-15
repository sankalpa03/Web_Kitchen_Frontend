import React, { useEffect, useState } from 'react';
import '../../css/profile.css';
import '../../css/saved.css';
import { Link, useNavigate } from 'react-router-dom';

interface SavedRecipe {
  id: number;
  recipe: {
    id: string;
    category: string;
    user: string;
    title: string;
    description: string;
    recipe_image: string;
  };
  saved_at: string;
}

function SavedRecipes() {
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<null | any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [unsaving, setUnsaving] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/signin');
          return;
        }
        const res = await fetch('http://127.0.0.1:8000/recipes/saved/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSaved(data);
        } else {
          setSaved([]);
        }
      } catch {
        setSaved([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [navigate]);

  // Fetch and show recipe detail in modal
  const handleShowDetail = async (recipeId: string) => {
    setLoadingDetail(true);
    setDetailModal(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/recipe/detail/${recipeId}/`);
      if (res.ok) {
        const data = await res.json();
        setDetailModal(data);
      } else {
        setDetailModal({ error: "Failed to load recipe details." });
      }
    } catch {
      setDetailModal({ error: "Failed to load recipe details." });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Add function to handle unsaving a recipe
  const handleUnsaveRecipe = async (recipeId: string) => {
    // Show confirmation dialog
    if (!window.confirm("Are you sure you want to unsave this recipe?")) {
      return;
    }

    // Set unsaving state for this recipe
    setUnsaving(prev => ({ ...prev, [recipeId]: true }));

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/recipes/save/${recipeId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove this recipe from the saved recipes list
        setSaved(prev => prev.filter(item => item.recipe.id !== recipeId));
        // Show success message
        alert("Recipe unsaved successfully");
      } else {
        const data = await response.json();
        alert(`Failed to unsave: ${data.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error unsaving recipe:", error);
      alert("An error occurred while unsaving the recipe");
    } finally {
      setUnsaving(prev => ({ ...prev, [recipeId]: false }));
    }
  };

  return (
    <div className="saved-recipes-container">
      <h1 className="title">My Saved Recipes & Collections</h1>
      {loading ? (
        <div className="text-center py-10 text-lg text-pink-600 font-semibold">Loading saved recipes...</div>
      ) : saved.length === 0 ? (
        <>
          <div className="illustration-container">
            <img 
              src="https://img.freepik.com/free-photo/top-view-delicious-cooked-vegetables-sliced-with-different-seasonings-dark-background-soup-food-sauce-meal-vegetable_140725-85838.jpg"
              alt="Saved Recipes Illustration"
              className="illustration"
            />
          </div>
          <div className="text-content">
            <h2 className="subtitle">Save recipes you like</h2>
            <p className="description">
              Tap the heart on recipes to save them for later!
              Organize your saved recipes into collections to help
              you find the perfect meal for every occasion.
            </p>
          </div>
          <Link to="/Home">
            <button className="find-recipes-button">FIND RECIPES TO SAVE</button>
          </Link>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 saved-list">
          {saved.map(item => (
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col cursor-pointer saved-card" key={item.id}>
              <div>
                <div className="h-40 bg-gray-200 mb-4 flex items-center justify-center rounded-md transition-transform duration-300 transform hover:scale-105 relative">
                  <img
                    src={item.recipe.recipe_image}
                    alt={item.recipe.title}
                    className="h-full w-full object-cover rounded-md saved-card-image"
                    onError={e => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200?text=No+Image";
                    }}
                    style={{ pointerEvents: 'none' }} // Prevent click on image
                  />
                </div>
                <h3 className="text-xl font-semibold mb-1 saved-card-title">{item.recipe.title}</h3>
                <div className="flex items-center mb-2">
                  <span className="text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full saved-card-category">
                    {item.recipe.category}
                  </span>
                  <span className="text-sm font-medium ml-auto saved-card-user">by {item.recipe.user}</span>
                </div>
                <span className="text-xs text-gray-400 saved-card-date">
                  Saved at: {new Date(item.saved_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-center gap-2 mt-4">
                <button
                  className="px-4 py-2 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center"
                  onClick={() => handleUnsaveRecipe(item.recipe.id)}
                  disabled={unsaving[item.recipe.id]}
                >
                  {unsaving[item.recipe.id] ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Unsaving...
                    </>
                  ) : (
                    "Unsave"
                  )}
                </button>
                <button
                  className="px-4 py-2 text-sm rounded bg-pink-600 text-white hover:bg-pink-700 transition-colors text-center"
                  onClick={() => handleShowDetail(item.recipe.id)}
                >
                  Show Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg overflow-hidden">
            <div className="flex justify-between items-center bg-pink-600 text-white p-4">
              <h2 className="text-xl font-bold">
                {loadingDetail ? "Loading..." : detailModal.title || "Recipe Detail"}
              </h2>
              <button
                onClick={() => setDetailModal(null)}
                className="text-white hover:text-pink-200 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 60px)' }}>
              {loadingDetail ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                </div>
              ) : detailModal.error ? (
                <div className="text-center text-gray-500 py-10">{detailModal.error}</div>
              ) : (
                <div className="space-y-6">
                  {/* Recipe Image and Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column - Image */}
                    <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
                      {detailModal.recipe_image ? (
                        <img 
                          src={detailModal.recipe_image} 
                          alt={detailModal.title}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
                      )}
                    </div>
                    
                    {/* Right column - Basic Info */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-pink-600 mb-2">Description</h3>
                        <p className="text-gray-700">{detailModal.description}</p>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <span className="font-medium mr-2">Category:</span>
                          <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                            {detailModal.category && 
                              detailModal.category.name.split('-').map((word: string) => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')
                            }
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium mr-2">Yield:</span> {detailModal.yield_amount}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preparation Times */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    {detailModal.preparations && detailModal.preparations[0] && (
                      <>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <span className="block text-xs text-pink-600 uppercase font-medium">Prep Time</span>
                          <span className="font-bold">{detailModal.preparations[0].prep_time}</span>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <span className="block text-xs text-pink-600 uppercase font-medium">Cook Time</span>
                          <span className="font-bold">{detailModal.preparations[0].cook_time}</span>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <span className="block text-xs text-pink-600 uppercase font-medium">Total Time</span>
                          <span className="font-bold">{detailModal.preparations[0].total_time}</span>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <span className="block text-xs text-pink-600 uppercase font-medium">Servings</span>
                          <span className="font-bold">{detailModal.preparations[0].serving}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Ingredients */}
                  <div className="bg-pink-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-pink-600 mb-3">Ingredients</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {detailModal.ingredients?.split(',').map((ingredient: string, idx: number) => (
                        <li key={idx} className="flex items-center">
                          <span className="h-2 w-2 rounded-full bg-pink-500 mr-2"></span>
                          <span className="text-gray-700">{ingredient.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Instructions */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-pink-600 mb-3">Instructions</h3>
                    <ol className="space-y-4">
                      {detailModal.directions?.map((step: any) => (
                        <li key={step.step_number} className="pb-4 border-b border-gray-200 last:border-0">
                          <div className="flex">
                            <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-pink-100 text-pink-700 font-bold text-lg mr-3">
                              {step.step_number}
                            </span>
                            <p className="text-gray-700 pt-1">{step.direction}</p>
                          </div>
                          {step.direction_photo && (
                            <div className="ml-11 mt-2">
                              <img 
                                src={step.direction_photo} 
                                alt={`Step ${step.step_number}`}
                                className="rounded-md max-h-40 object-cover" 
                              />
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  {/* Nutrition Facts */}
                  {detailModal.nutrition && detailModal.nutrition.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-pink-600 mb-2">Nutrition Facts</h3>
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-medium">Calories:</span> {detailModal.nutrition[0].total_calories}
                          </div>
                          <div>
                            <span className="font-medium">Fat:</span> {detailModal.nutrition[0].fat}g
                          </div>
                          <div>
                            <span className="font-medium">Saturated Fat:</span> {detailModal.nutrition[0].saturated_fat}g
                          </div>
                          <div>
                            <span className="font-medium">Cholesterol:</span> {detailModal.nutrition[0].cholesterol}mg
                          </div>
                          <div>
                            <span className="font-medium">Sodium:</span> {detailModal.nutrition[0].sodium}mg
                          </div>
                          <div>
                            <span className="font-medium">Carbs:</span> {detailModal.nutrition[0].carbohydrates}g
                          </div>
                          <div>
                            <span className="font-medium">Fiber:</span> {detailModal.nutrition[0].fiber}g
                          </div>
                          <div>
                            <span className="font-medium">Sugar:</span> {detailModal.nutrition[0].sugar}g
                          </div>
                          <div>
                            <span className="font-medium">Protein:</span> {detailModal.nutrition[0].protein}g
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Info */}
                  <div className="flex justify-between text-sm pt-4 border-t border-gray-200">
                    <div className="flex flex-col gap-1">
                      <div>
                        <span className="text-gray-500">By: </span>
                        <span className="text-pink-600 font-medium">{typeof detailModal.user === 'string' ? detailModal.user : 'Admin'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date: </span>
                      <span className="text-pink-600 font-medium">
                        {detailModal.upload_date && new Date(detailModal.upload_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <button
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavedRecipes;