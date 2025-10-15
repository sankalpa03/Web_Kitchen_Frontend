import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, UserCog, Search, X } from 'lucide-react';

// Define interface for Review
interface Review {
  id: string;
  recipe: string;
  user: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

// Add interface for recipe detail
interface RecipeDetail {
  id: string;
  title: string;
  user: number | string;
  description: string;
  recipe_image?: string;
  category: {
    id: string;
    name: string;
  };
  ingredients: string;
  yield_amount: string;
  upload_date: string;
  preparations: Array<{
    prep_time: string;
    cook_time: string;
    total_time: string;
    serving: number;
    recipe_video: string | null;
  }>;
  nutrition: Array<{
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
  }>;
  directions: Array<{
    step_number: number;
    direction: string;
    direction_photo: string | null;
  }>;
}

const LandingPage = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDesc, setShowDesc] = useState<{ [id: string]: boolean }>({});
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [showSignInMsg, setShowSignInMsg] = useState<{ [id: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState<{ [id: string]: boolean }>({});
  const [reviews, setReviews] = useState<{ [id: string]: Review[] }>({});
  // Add states for recipe detail modal
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  // Add search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const recipesPerPage = 12;

  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch recipes');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setRecipes(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Check if user is signed in
    setIsSignedIn(!!localStorage.getItem('accessToken'));
  }, []);

  // Load reviews for a specific recipe when showing description
  const loadReviews = async (recipeId: string) => {
    if (!reviews[recipeId] && !loadingReviews[recipeId]) {
      setLoadingReviews(prev => ({ ...prev, [recipeId]: true }));
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/reviews/list/${recipeId}/`);
        if (response.ok) {
          const data: Review[] = await response.json();
          setReviews(prev => ({ ...prev, [recipeId]: data }));
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoadingReviews(prev => ({ ...prev, [recipeId]: false }));
      }
    }
  };

  const handleToggleDesc = (id: string) => {
    const willShow = !showDesc[id];
    setShowDesc((prev) => ({ ...prev, [id]: willShow }));
    
    // Load reviews when showing description
    if (willShow) {
      loadReviews(id);
    }
  };

  // Add function to handle recipe click and fetch details
  const handleRecipeClick = async (recipeId: string) => {
    setSelectedRecipe(recipeId);
    setLoadingDetail(true);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/recipe/detail/${recipeId}/`);
      if (response.ok) {
        const data = await response.json();
        setRecipeDetail(data);
      } else {
        console.error("Failed to fetch recipe details");
        alert("Couldn't load recipe details. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      alert("An error occurred while loading the recipe details.");
    } finally {
      setLoadingDetail(false);
    }
  };
  
  // Add function to close the detail popup
  const closeRecipeDetail = () => {
    setSelectedRecipe(null);
    setRecipeDetail(null);
  };

  // Add search function
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchParams = new URLSearchParams({
        search: query.trim()
      });

      const response = await fetch(`http://127.0.0.1:8000/search/?${searchParams}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      } else {
        console.error('Search failed:', response.status);
        setSearchResults([]);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setShowSearchResults(false);
        setSearchResults([]);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const totalPages = Math.ceil(recipes.length / recipesPerPage);
  const paginatedRecipes = recipes.slice((currentPage - 1) * recipesPerPage, currentPage * recipesPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="py-6">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-pink-600" />
              <span className="text-xl font-bold text-pink-600">Web Kitchen</span>
            </div>
            {/* Nav Links */}
            <div className="flex items-center space-x-4">
              <Link to="/signin" className="text-pink-600 hover:text-pink-700">Sign In</Link>
              <Link
                to="/register"
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
              >
                Register
              </Link>
              {/* Admin Login Icon */}
              <Link
                to="http://127.0.0.1:8000/admin/"
                className="p-2 hover:bg-pink-100 rounded-full transition"
                title="Admin Login"
              >
                <UserCog className="text-pink-600" size={20} />
              </Link>
            </div>
          </div>
        </nav>
        
        {/* Hero Section */}
        <div className="flex items-center justify-between py-10 flex-col lg:flex-row">
          <div className="max-w-md text-center lg:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Discover the Art of{" "}
              <span className="text-pink-600">Cooking</span>
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Join our community of food lovers and explore thousands of delicious recipes from around the world.
            </p>
            <Link
              to="/register"
              className="bg-pink-600 text-white px-6 py-2 rounded-lg text-base font-semibold hover:bg-pink-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
          {/* Hero Image */}
          <div className="hidden lg:block mt-6 lg:mt-0">
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
              alt="Delicious food preparation"
              className="w-[320px] h-[200px] object-cover rounded-2xl shadow-2xl"
            />
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-20 rounded-full border border-gray-300 focus:outline-none focus:border-pink-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 hover:bg-gray-100 rounded-full"
                  title="Clear search"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
              <div className="p-1">
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          
          {/* Search Results Count */}
          {showSearchResults && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              {searchResults.length > 0 ? (
                `Found ${searchResults.length} recipe${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
              ) : (
                `No recipes found for "${searchQuery}"`
              )}
            </div>
          )}
        </div>
        
        {/* Featured Recipes Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-extrabold text-pink-600 tracking-tight drop-shadow">
              {showSearchResults ? 'Search Results' : 'Featured Recipes'}
            </h2>
            {showSearchResults && (
              <button
                onClick={clearSearch}
                className="text-sm text-pink-600 hover:text-pink-800 font-medium flex items-center"
              >
                <span className="mr-1">←</span> Back to All
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center text-lg text-pink-600 font-semibold animate-pulse">Loading recipes...</div>
          ) : error ? (
            <div className="text-center text-red-500 font-semibold">{error}</div>
          ) : (showSearchResults ? searchResults : recipes).length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
                {(showSearchResults ? searchResults : paginatedRecipes).map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-2xl shadow-xl p-6 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-2xl border border-pink-100 cursor-pointer"
                    onClick={() => handleRecipeClick(recipe.id)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') handleRecipeClick(recipe.id); }}
                    role="button"
                    aria-label={`View details for ${recipe.title}`}
                  >
                    {recipe.recipe_image ? (
                      <img
                        src={recipe.recipe_image}
                        alt={recipe.title}
                        className="w-full h-44 object-cover rounded-xl mb-4 border border-pink-200 shadow"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-lg font-semibold border border-pink-100">
                        No image
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-1 text-pink-700">{recipe.title}</h3>
                    {/* By and Category in same line */}
                    <div className="flex items-center justify-between text-gray-500 text-sm mb-3">
                      <span>
                        By: <span className="font-medium text-pink-500">{recipe.user}</span>
                      </span>
                      <span>
                        Category: <span className="font-medium text-pink-400">{recipe.category}</span>
                      </span>
                    </div>
                    {/* Show Description Toggle */}
                    <button
                      className="text-pink-600 hover:underline mb-2 font-medium transition"
                      onClick={e => { e.stopPropagation(); handleToggleDesc(recipe.id); }}
                    >
                      {showDesc[recipe.id] ? 'Hide Description & Reviews' : 'Show Description & Reviews'}
                    </button>
                    
                    {showDesc[recipe.id] && (
                      <div className="space-y-4">
                        <p className="text-gray-700 mb-2 bg-pink-50 rounded p-2 border border-pink-100">{recipe.description}</p>
                        
                        {/* Reviews Section - read only */}
                        <div className="bg-pink-50 rounded p-4 border border-pink-100">
                          <h4 className="font-semibold text-pink-700 mb-2">Reviews</h4>
                          
                          {loadingReviews[recipe.id] ? (
                            <p className="text-sm text-gray-500 italic">Loading reviews...</p>
                          ) : reviews[recipe.id]?.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {reviews[recipe.id].map(review => (
                                <div key={review.id} className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-pink-600">{review.user}</span>
                                    <div className="flex items-center">
                                      <span className="text-yellow-400 mr-1">★</span>
                                      <span className="text-sm text-gray-600">{review.rating}/5</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No reviews yet.</p>
                          )}
                          
                          {/* Replace rating/review input with sign-in prompt */}
                          {!isSignedIn && (
                            <div className="mt-3 pt-3 border-t border-pink-200">
                              <div className="text-center text-sm text-pink-600">
                                <Link 
                                  to="/signin" 
                                  className="font-semibold hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Sign in
                                </Link> to view more details and write reviews.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Pagination - only show when not searching */}
              {!showSearchResults && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    className="px-3 py-1 rounded bg-pink-100 text-pink-600 font-semibold hover:bg-pink-200 disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      className={`px-3 py-1 rounded font-semibold ${
                        currentPage === idx + 1
                          ? 'bg-pink-600 text-white'
                          : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                      }`}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1 rounded bg-pink-100 text-pink-600 font-semibold hover:bg-pink-200 disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400">
              {showSearchResults ? `No recipes found for "${searchQuery}"` : "No recipes found."}
            </div>
          )}
        </div>
      </div>
      
      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg overflow-hidden">
            <div className="flex justify-between items-center bg-pink-600 text-white p-4">
              <h2 className="text-xl font-bold">
                {loadingDetail ? "Loading..." : recipeDetail?.title}
              </h2>
              <button 
                onClick={closeRecipeDetail}
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
              ) : recipeDetail ? (
                <div className="space-y-6">
                  {/* Recipe Image - Made smaller */}
                  {recipeDetail.recipe_image && (
                    <div className="w-full max-w-md mx-auto overflow-hidden rounded-lg">
                      <img 
                        src={recipeDetail.recipe_image} 
                        alt={recipeDetail.title}
                        className="w-full h-64 object-cover" 
                      />
                    </div>
                  )}
                  
                  {/* Recipe Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    {recipeDetail.preparations && recipeDetail.preparations[0] && (
                      <>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <span className="block text-xs text-pink-600 uppercase font-medium">Prep Time</span>
                          <span className="font-bold">{recipeDetail.preparations[0].prep_time || 'Not specified'}</span>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <span className="block text-xs text-pink-600 uppercase font-medium">Cook Time</span>
                          <span className="font-bold">{recipeDetail.preparations[0].cook_time || 'Not specified'}</span>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <span className="block text-xs text-pink-600 uppercase font-medium">Total Time</span>
                          <span className="font-bold">{recipeDetail.preparations[0].total_time || 'Not specified'}</span>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <span className="block text-xs text-pink-600 uppercase font-medium">Servings</span>
                          <span className="font-bold">{recipeDetail.yield_amount || recipeDetail.preparations[0]?.serving || 'Not specified'}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-pink-600 mb-2">Description</h3>
                    <p className="text-gray-700">{recipeDetail.description || "No description provided."}</p>
                  </div>

                  {/* Recipe Video Section */}
                  {recipeDetail.preparations && 
                   recipeDetail.preparations.length > 0 && 
                   recipeDetail.preparations[0].recipe_video ? (
                    <div className="recipe-detail-section recipe-video-section" style={{ margin: '2rem 0' }}>
                      <h3 className="text-lg font-semibold text-pink-600 mb-4 flex items-center">
                        <span style={{ marginRight: '0.5rem', fontSize: '1.5rem' }}>🎬</span>
                        Recipe Video
                      </h3>
                      <div style={{ 
                        width: '100%', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)', 
                        backgroundColor: '#000',
                        position: 'relative',
                        paddingBottom: '56.25%' // 16:9 aspect ratio
                      }}>
                        <video 
                          controls 
                          style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%', 
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: '#000'
                          }}
                          poster={recipeDetail.recipe_image || undefined}
                          preload="metadata"
                          controlsList="nodownload"
                        >
                          <source src={recipeDetail.preparations[0].recipe_video} type="video/mp4" />
                          <source src={recipeDetail.preparations[0].recipe_video} type="video/webm" />
                          <source src={recipeDetail.preparations[0].recipe_video} type="video/ogg" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <p style={{ 
                        textAlign: 'center', 
                        color: '#666', 
                        fontSize: '0.9rem', 
                        marginTop: '1rem',
                        fontStyle: 'italic'
                      }}>
                        Click play to watch the recipe preparation video
                      </p>
                    </div>
                  ) : (
                    <div className="recipe-detail-section recipe-video-section" style={{ margin: '2rem 0' }}>
                      <h3 className="text-lg font-semibold text-pink-600 mb-4 flex items-center">
                        <span style={{ marginRight: '0.5rem', fontSize: '1.5rem' }}>🎬</span>
                        Recipe Video
                      </h3>
                      <div style={{
                        width: '100%',
                        borderRadius: '12px',
                        backgroundColor: '#f8f9fa',
                        border: '2px dashed #e9ecef',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        color: '#6c757d'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          No Video Available
                        </h4>
                        <p style={{ fontSize: '0.9rem', margin: 0 }}>
                          This recipe doesn't have a video tutorial yet.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Ingredients */}
                  <div>
                    <h3 className="text-lg font-semibold text-pink-600 mb-2">
                      <span style={{ marginRight: '0.5rem' }}>🧂</span>
                      Ingredients
                    </h3>
                    {recipeDetail.ingredients ? (
                      <ul className="list-disc list-inside space-y-1">
                        {typeof recipeDetail.ingredients === 'string' ? 
                          recipeDetail.ingredients.split(',').map((ingredient, idx) => (
                            <li key={idx} className="text-gray-700">{ingredient.trim()}</li>
                          )) : 
                          <li className="text-gray-700">No ingredients listed</li>
                        }
                      </ul>
                    ) : (
                      <p className="text-gray-500">No ingredients listed</p>
                    )}
                  </div>
                  
                  {/* Instructions */}
                  <div>
                    <h3 className="text-lg font-semibold text-pink-600 mb-2">
                      <span style={{ marginRight: '0.5rem' }}>📝</span>
                      Instructions
                    </h3>
                    {recipeDetail.directions && recipeDetail.directions.length > 0 ? (
                      <ol className="list-decimal list-outside space-y-3 pl-5">
                        {recipeDetail.directions
                          .sort((a, b) => a.step_number - b.step_number)
                          .map((step) => (
                          <li key={step.step_number} className="text-gray-700">
                            <div className="mb-2">{step.direction}</div>
                            {step.direction_photo && (
                              <div className="mt-2">
                                <img 
                                  src={step.direction_photo} 
                                  alt={`Step ${step.step_number}`}
                                  className="rounded-md max-h-40 object-cover border shadow-sm" 
                                  loading="lazy"
                                />
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-gray-500">No instructions provided</p>
                    )}
                  </div>
                  
                  {/* Nutrition Facts */}
                  {recipeDetail.nutrition && recipeDetail.nutrition.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-pink-600 mb-2">
                        <span style={{ marginRight: '0.5rem' }}>🍎</span>
                        Nutrition Facts
                      </h3>
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-medium">Calories:</span> {recipeDetail.nutrition[0].total_calories}
                          </div>
                          <div>
                            <span className="font-medium">Fat:</span> {recipeDetail.nutrition[0].fat}g
                          </div>
                          <div>
                            <span className="font-medium">Carbs:</span> {recipeDetail.nutrition[0].carbohydrates}g
                          </div>
                          <div>
                            <span className="font-medium">Protein:</span> {recipeDetail.nutrition[0].protein}g
                          </div>
                          <div>
                            <span className="font-medium">Fiber:</span> {recipeDetail.nutrition[0].fiber}g
                          </div>
                          <div>
                            <span className="font-medium">Sugar:</span> {recipeDetail.nutrition[0].sugar}g
                          </div>
                          <div>
                            <span className="font-medium">Sodium:</span> {recipeDetail.nutrition[0].sodium}mg
                          </div>
                          <div>
                            <span className="font-medium">Cholesterol:</span> {recipeDetail.nutrition[0].cholesterol}mg
                          </div>
                          <div>
                            <span className="font-medium">Saturated Fat:</span> {recipeDetail.nutrition[0].saturated_fat}g
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Author and Category */}
                  <div className="flex justify-between text-sm pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-gray-500">Category: </span>
                      <span className="text-pink-600 font-medium">
                        {recipeDetail.category && 
                          recipeDetail.category.name.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date: </span>
                      <span className="text-pink-600 font-medium">
                        {new Date(recipeDetail.upload_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10">
                  Failed to load recipe details.
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <button
                onClick={closeRecipeDetail}
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
};

export default LandingPage;