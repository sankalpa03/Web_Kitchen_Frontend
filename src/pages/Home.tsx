import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

// Define interfaces for our data structures
interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  user: string;
  recipe_image?: string;
}

interface RecommendedRecipe {
  id: string;
  title: string;
  description: string;
  image?: string;
}

interface ReviewModalData {
  recipeId: string;
  rating: number;
  reviewText: string;
}

// Add these interfaces for recipe detail
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

const Home = () => {
  const navigate = useNavigate();
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<RecommendedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [modalData, setModalData] = useState<ReviewModalData | null>(null);
  const [showDesc, setShowDesc] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add category states
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  // Enhanced pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 21;
  // Used internally for API data tracking
  const [totalPages, setTotalPages] = useState(1);
  // Add states for reviews
  const [recipeReviews, setRecipeReviews] = useState<Record<string, Array<{
    id: string;
    user: string;
    rating: number;
    comment: string;
    created_at: string;
  }>>>({});
  const [loadingReviews, setLoadingReviews] = useState<Record<string, boolean>>({});
  // Add a separate state for showing reviews
  const [showReviews, setShowReviews] = useState<Record<string, boolean>>({});
  // Add state to track the current user's username for checking reviews
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  // Add these states for recipe detail popup
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  // First, let's add state to track saved recipes
  const [savedRecipes, setSavedRecipes] = useState<Record<string, boolean>>({});
  const [savingRecipes, setSavingRecipes] = useState<Record<string, boolean>>({});
  // Add search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch('http://127.0.0.1:8000/category/');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCategories(data);
            console.log("Categories loaded:", data); // Add debugging log
          } else {
            console.error("Categories data is not an array:", data);
          }
        } else {
          console.error("Failed to load categories:", res.status, res.statusText);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch recipes - updated to handle category filtering
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        
        // Determine the API endpoint based on whether a category is selected
        let apiUrl = `http://127.0.0.1:8000/?page=${currentPage}&per_page=${recipesPerPage}`;
        
        if (selectedCategory) {
          apiUrl = `http://127.0.0.1:8000/recipes/category/${selectedCategory}/`;
        }
        
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          // Check if response is paginated
          if (data.results && Array.isArray(data.results)) {
            // Handle paginated API response with metadata
            setFeaturedRecipes(data.results);
            setTotalPages(data.total_pages || Math.ceil((data.count || data.results.length) / recipesPerPage));
          } else if (Array.isArray(data)) {
            // Handle non-paginated API response (fallback)
            setFeaturedRecipes(data.slice((currentPage - 1) * recipesPerPage, currentPage * recipesPerPage));
            setTotalPages(Math.ceil(data.length / recipesPerPage));
          } else {
            setFeaturedRecipes([]);
            setTotalPages(1);
          }
        } else {
          setFeaturedRecipes([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching recipes:", error);
        setFeaturedRecipes([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipes();
    // Reset to page 1 when changing categories
    if (selectedCategory) {
      setCurrentPage(1);
    }
  }, [currentPage, recipesPerPage, selectedCategory]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch("http://127.0.0.1:8000/api/recommend/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendedRecipes(data.slice(0, 5));
        } else {
          setRecommendedRecipes([]);
        }
      } catch {
        setRecommendedRecipes([]);
      } finally {
        setLoadingRecommended(false);
      }
    };
    fetchRecommended();
  }, []);  // Remove accessToken from the dependency array and get it inside the function

  // Get current username on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          const res = await fetch("http://127.0.0.1:8000/api/user/profile/", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.username || null);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  const renderStars = (selectedRating: number, onClick: (id: string, rating: number) => void, recipeId: string) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i + 1}
        onClick={() => onClick(recipeId, i + 1)}
        className={`text-2xl px-1 ${i + 1 <= selectedRating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </button>
    ));
  };

  const openReviewModal = (recipeId: string) => {
    const rating = ratings[recipeId] || 0;
    const reviewText = reviews[recipeId] || '';
    setModalData({ recipeId, rating, reviewText });
  };

  const closeModal = () => setModalData(null);

  const handleReviewTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (modalData) {
      setModalData({ ...modalData, reviewText: e.target.value });
    }
  };

  const handleSubmitReview = async () => {
    if (!modalData) return;
    
    const { recipeId, rating, reviewText } = modalData;

    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    // Show loading state
    setIsSubmitting(true);
    
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      navigate("/signin");
      setIsSubmitting(false);
      return;
    }
    
    // Check if this is a new review or update
    // const isUpdating = !!reviews[recipeId]; // Keeping for future use
    
    // Format request body according to the API requirements
    const reviewData = {
      recipe: recipeId,
      rating: rating.toString()
    };
    
    try {
      let response;
      
      // For both conditions, use the same endpoint
      response = await fetch("http://127.0.0.1:8000/api/user/reviews/post/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reviewData)
      });
      
      if (response.ok) {
        const newReview = await response.json();
        console.log("Review submitted successfully:", newReview);
        
        // Update local state with new review
        setRecipeReviews(prev => ({
          ...prev,
          [recipeId]: [
            ...(prev[recipeId] || []), 
            {
              ...newReview,
              comment: newReview.comment || reviewText
            }
          ]
        }));
        
        // Update local UI states
        setRatings(prev => ({ ...prev, [recipeId]: rating }));
        setReviews(prev => ({ ...prev, [recipeId]: reviewText }));
        
        // Show success message
        alert("Review submitted successfully!");
        closeModal();
        
        // Refresh reviews for this recipe to get the latest data
        fetchReviewsForRecipe(recipeId);
      } else {
        const errorData = await response.json();
        console.error("API error:", errorData);
        
        // Handle "already reviewed" error more elegantly
        if (errorData.non_field_errors && 
            errorData.non_field_errors.includes("You have already reviewed this recipe.")) {
          alert("You have already reviewed this recipe.");
        } else {
          alert(`Failed to submit review: ${errorData.detail || JSON.stringify(errorData)}`);
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("An error occurred while submitting your review. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the fetchReviewsForRecipe function to not depend on showing description
  const fetchReviewsForRecipe = async (recipeId: string) => {
    if (recipeReviews[recipeId] || loadingReviews[recipeId]) return;
    
    setLoadingReviews(prev => ({ ...prev, [recipeId]: true }));
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/reviews/list/${recipeId}/`);
      if (res.ok) {
        const data = await res.json();
        setRecipeReviews(prev => ({ ...prev, [recipeId]: data }));
      }
    } catch (error) {
      console.error(`Error fetching reviews for recipe ${recipeId}:`, error);
    } finally {
      setLoadingReviews(prev => ({ ...prev, [recipeId]: false }));
    }
  };

  // Update the toggleDescription function to fetch recipe details instead
  const toggleDescription = (recipeId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the recipe card click
    
    // If we're showing the details, just hide them
    if (showDesc[recipeId]) {
      setShowDesc(prev => ({
        ...prev,
        [recipeId]: false
      }));
      return;
    }
    
    // Otherwise, fetch the details from API
    handleRecipeClick(recipeId);
  };

  // Remove unused handleRecommendationClick function
  // const handleRecommendationClick = (recipeId: string) => {
  //   handleRecipeClick(recipeId);
  // };

  // Add this function to handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    console.log("Selecting category:", categoryId);
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when changing categories
    
    // Also reset any visible reviews or descriptions when changing categories
    setShowDesc({});
    setShowReviews({});
  };

  // Format category name for display
  const formatCategoryName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate average rating for a recipe
  const calculateAverageRating = (recipeId: string): { average: number; count: number } => {
    const reviews = recipeReviews[recipeId];
    if (!reviews || reviews.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length
    };
  };

  // Display stars for average rating (read-only)
  const renderReadOnlyStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star} 
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Fetch reviews only when reviews button is clicked
  const handleShowReviews = (recipeId: string) => {
    // Toggle the review visibility
    setShowReviews(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
    
    // Fetch reviews if we're showing them and haven't loaded them yet
    if (!showReviews[recipeId] && !recipeReviews[recipeId] && !loadingReviews[recipeId]) {
      fetchReviewsForRecipe(recipeId);
    }
  };

  // Function to check if current user has already reviewed a recipe
  const hasUserReviewed = (recipeId: string): boolean => {
    if (!currentUser || !recipeReviews[recipeId]) return false;
    
    return recipeReviews[recipeId].some(review => review.user === currentUser);
  };

  // Add function to handle recipe click
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
  
  // Add a function to save a recipe
  const handleSaveRecipe = async (recipeId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the card click

    // If already saving, ignore
    if (savingRecipes[recipeId]) return;

    // Set saving state
    setSavingRecipes(prev => ({ ...prev, [recipeId]: true }));

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        navigate("/signin");
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/recipes/save/${recipeId}/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSavedRecipes(prev => ({ ...prev, [recipeId]: true }));
        if (data.detail) {
          alert(data.detail);
        }
      } else {
        // Show all messages in response if present
        if (data.detail) {
          alert(data.detail);
        } else if (typeof data === "object") {
          alert(Object.values(data).join('\n'));
        } else {
          alert("Failed to save recipe.");
        }
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("An error occurred while saving the recipe.");
    } finally {
      setSavingRecipes(prev => ({ ...prev, [recipeId]: false }));
    }
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
      
      if (selectedCategory) {
        const categoryName = categories.find(c => c.id === selectedCategory)?.name;
        if (categoryName) {
          searchParams.append('category', categoryName);
        }
      }

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
  }, [searchQuery, selectedCategory]);

  // Clear search when category changes
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, [selectedCategory]);

  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Category Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg p-4 sticky top-20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Categories</h3>
            
            {loadingCategories ? (
              <div className="animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded my-2"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full text-left px-3 py-2 rounded-md transition ${
                    selectedCategory === null
                      ? 'bg-pink-100 text-pink-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Recipes
                </button>
                
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition truncate ${
                      selectedCategory === category.id
                        ? 'bg-pink-100 text-pink-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={formatCategoryName(category.name)}
                  >
                    {formatCategoryName(category.name)}
                  </button>
                ))}
              </div>
            )}
            
            {/* Add scrollbar styles for webkit browsers */}
            {/* 
            <style jsx>{`
              .max-h-96::-webkit-scrollbar {
                width: 6px;
              }
              .max-h-96::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
              }
              .max-h-96::-webkit-scrollbar-thumb {
                background: #ec4899;
                border-radius: 3px;
              }
              .max-h-96::-webkit-scrollbar-thumb:hover {
                background: #db2777;
              }
            `}</style>
            */}
            {/* Move the above CSS to a global CSS file if needed. */}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
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
              <div className="mt-2 text-sm text-gray-600">
                {searchResults.length > 0 ? (
                  `Found ${searchResults.length} recipe${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                ) : (
                  `No recipes found for "${searchQuery}"`
                )}
              </div>
            )}
          </div>

          {/* All Recipes */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {showSearchResults 
                ? `Search Results` 
                : selectedCategory 
                  ? `${formatCategoryName(categories.find(c => c.id === selectedCategory)?.name || '')} Recipes` 
                  : 'All Recipes'}
            </h2>
            {(selectedCategory || showSearchResults) && (
              <button
                onClick={() => {
                  if (showSearchResults) {
                    clearSearch();
                  } else {
                    handleCategorySelect(null);
                  }
                }}
                className="text-sm text-pink-600 hover:text-pink-800 font-medium flex items-center"
              >
                <span className="mr-1">←</span> Back to All
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center text-lg text-pink-600 font-semibold animate-pulse">Loading recipes...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(showSearchResults ? searchResults : featuredRecipes).map(recipe => (
                  <div 
                    key={recipe.id} 
                    className="bg-white rounded-xl shadow-lg p-6 flex flex-col cursor-pointer"
                  >
                    <div className="h-40 bg-gray-200 mb-4 flex items-center justify-center rounded-md transition-transform duration-300 transform hover:scale-105 relative">
                      {recipe.recipe_image ? (
                        <img
                          src={recipe.recipe_image}
                          alt={recipe.title}
                          className="h-full w-full object-cover rounded-md"
                          style={{ pointerEvents: 'none' }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image";
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No Image Available</span>
                      )}
                      
                      {/* Save button */}
                      <button 
                        className={`absolute top-2 right-2 p-2 rounded-full ${
                          savedRecipes[recipe.id] 
                            ? 'bg-pink-500 text-white' 
                            : 'bg-white bg-opacity-75 text-pink-600 hover:bg-pink-100'
                        } transition-colors`}
                        onClick={(e) => handleSaveRecipe(recipe.id, e)}
                        disabled={savingRecipes[recipe.id]}
                        title={savedRecipes[recipe.id] ? "Saved" : "Save Recipe"}
                      >
                        {savingRecipes[recipe.id] ? (
                          <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d={savedRecipes[recipe.id] 
                              ? "M5 4C4.44772 4 4 4.44772 4 5V20.5L12 16L20 20.5V5C20 4.44772 19.5523 4 19 4H5Z" 
                              : "M5 4C4.44772 4 4 4.44772 4 5V20.5L12 16L20 20.5V5C20 4.44772 19.5523 4 19 4H5ZM5 5.5H19V18.5L12 14.6L5 18.5V5.5Z"} 
                          />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-1">{recipe.title}</h3>
                    
                    {/* Ratings summary always visible */}
                    <div className="flex items-center mb-2">
                      {loadingReviews[recipe.id] ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-t-2 border-pink-500 border-solid rounded-full animate-spin mr-2"></div>
                          <span className="text-sm text-gray-400">Loading ratings...</span>
                        </div>
                      ) : recipeReviews[recipe.id] && recipeReviews[recipe.id].length > 0 ? (
                        <>
                          {renderReadOnlyStars(calculateAverageRating(recipe.id).average)}
                          <span className="ml-2 text-sm text-gray-500">
                            ({calculateAverageRating(recipe.id).average}/5 · {calculateAverageRating(recipe.id).count} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No reviews yet</span>
                      )}
                    </div>
                    
                    {/* Category and user info */}
                    <div className="text-gray-600 mb-4 flex justify-between items-center">
                      <span className="text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                        {recipe.category}
                      </span>
                      <span className="text-sm font-medium">{recipe.user}</span>
                    </div>
                    
                    {/* Separate buttons for details and reviews - smaller size */}
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        className="bg-pink-600 text-white px-3 py-1 text-sm rounded hover:bg-pink-700 transition-colors duration-300"
                        onClick={(e) => toggleDescription(recipe.id, e)}
                      >
                        Show Details
                      </button>
                      
                      <button
                        className={`px-3 py-1 text-sm rounded transition-colors duration-300 ${
                          showReviews[recipe.id] 
                            ? "bg-pink-800 text-white hover:bg-pink-900" 
                            : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowReviews(recipe.id);
                        }}
                      >
                        {showReviews[recipe.id] ? "Hide Reviews" : "Show Reviews"}
                      </button>
                    </div>
                    
                    {/* Add Save button */}
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={(e) => handleSaveRecipe(recipe.id, e)}
                        className={`px-4 py-2 text-sm rounded transition-colors duration-300 flex items-center justify-center ${
                          savedRecipes[recipe.id]
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-pink-600 text-white hover:bg-pink-700"
                        }`}
                        disabled={savingRecipes[recipe.id]}
                      >
                        {savingRecipes[recipe.id] ? (
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : savedRecipes[recipe.id] ? (
                          "Saved"
                        ) : (
                          "Save Recipe"
                        )}
                      </button>
                    </div>
                    
                    {/* Reviews section - only visible when reviews button is clicked */}
                    {showReviews[recipe.id] && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-pink-600">Reviews</h4>
                          {!hasUserReviewed(recipe.id) ? (
                            <button
                              onClick={() => openReviewModal(recipe.id)}
                              className="text-sm bg-pink-100 text-pink-700 hover:bg-pink-200 py-1 px-3 rounded-md font-medium transition-colors"
                            >
                              Write Review
                            </button>
                          ) : (
                            <span className="text-xs text-green-600 italic">You've reviewed this recipe</span>
                          )}
                        </div>
                        
                        {loadingReviews[recipe.id] ? (
                          <div className="text-center py-2">
                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-pink-500"></div>
                            <span className="ml-2 text-sm text-gray-500">Loading reviews...</span>
                          </div>
                        ) : recipeReviews[recipe.id] && recipeReviews[recipe.id].length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {recipeReviews[recipe.id].map(review => (
                              <div key={review.id} className="bg-pink-50 p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium text-gray-700">{review.user}</span>
                                  <div className="flex items-center">
                                    <span className="text-yellow-400 text-sm mr-1">★</span>
                                    <span className="text-xs text-gray-500">{review.rating}/5</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No reviews available for this recipe.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Add pagination controls - only show when not searching */}
              {!showSearchResults && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                  <button
                    className="px-3 py-1 rounded bg-pink-100 text-pink-600 font-semibold hover:bg-pink-200 disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  
                  {/* First page */}
                  {currentPage > 3 && (
                    <button
                      className="px-3 py-1 rounded font-semibold bg-pink-100 text-pink-600 hover:bg-pink-200"
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </button>
                  )}
                  
                  {/* Ellipsis for skipped pages */}
                  {currentPage > 4 && <span className="px-2">...</span>}
                  
                  {/* Page numbers around current page */}
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNumber = idx + 1;
                    
                    // Only show pages near current page for better UX
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          className={`px-3 py-1 rounded font-semibold ${
                            currentPage === pageNumber
                              ? 'bg-pink-600 text-white'
                              : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                          }`}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Ellipsis for skipped pages */}
                  {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && totalPages > 1 && (
                    <button
                      className="px-3 py-1 rounded font-semibold bg-pink-100 text-pink-600 hover:bg-pink-200"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  )}
                  
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
          )}
        </div>
      </div>

      {/* Recommended Recipes */}
      <h2 className="text-3xl font-bold text-gray-900 my-10">Recommended Recipes</h2>
      {loadingRecommended ? (
        <div className="text-center text-lg text-pink-600 font-semibold animate-pulse">Loading recommended recipes...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendedRecipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-lg p-6 flex flex-col cursor-pointer"
            >
              <div className="h-40 bg-gray-200 mb-4 flex items-center justify-center rounded-md transition-transform duration-300 transform hover:scale-105 relative">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="h-full w-full object-cover rounded-md"
                    style={{ pointerEvents: 'none' }} // Disable click on image
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => { 
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; 
                      target.src = "https://via.placeholder.com/300x200?text=No+Image"; 
                    }}
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No Image Available</span>
                )}
                
                {/* Save button */}
                <button 
                  className={`absolute top-2 right-2 p-2 rounded-full ${
                    savedRecipes[recipe.id] 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-white bg-opacity-75 text-pink-600 hover:bg-pink-100'
                  } transition-colors`}
                  onClick={(e) => handleSaveRecipe(recipe.id, e)}
                  disabled={savingRecipes[recipe.id]}
                  title={savedRecipes[recipe.id] ? "Saved" : "Save Recipe"}
                >
                  {savingRecipes[recipe.id] ? (
                    <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d={savedRecipes[recipe.id] 
                        ? "M5 4C4.44772 4 4 4.44772 4 5V20.5L12 16L20 20.5V5C20 4.44772 19.5523 4 19 4H5Z" 
                        : "M5 4C4.44772 4 4 4.44772 4 5V20.5L12 16L20 20.5V5C20 4.44772 19.5523 4 19 4H5ZM5 5.5H19V18.5L12 14.6L5 18.5V5.5Z"} 
                    />
                    </svg>
                  )}
                  
                </button>
              </div>
              
              <h3 className="text-xl font-semibold mb-1">{recipe.title}</h3>
              
              {/* Ratings summary always visible */}
              <div className="flex items-center mb-2">
                {loadingReviews[recipe.id] ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-t-2 border-pink-500 border-solid rounded-full animate-spin mr-2"></div>
                    <span className="text-sm text-gray-400">Loading ratings...</span>
                  </div>
                ) : recipeReviews[recipe.id] && recipeReviews[recipe.id].length > 0 ? (
                  <>
                    {renderReadOnlyStars(calculateAverageRating(recipe.id).average)}
                    <span className="ml-2 text-sm text-gray-500">
                      ({calculateAverageRating(recipe.id).average}/5 · {calculateAverageRating(recipe.id).count} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">No reviews yet</span>
                )}
              </div>
              
              {/* Add user and category info */}
              <div className="text-gray-600 mb-4 flex justify-between items-center">
                <span className="text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                  Recommended
                </span>
              </div>
              
              {/* Separate buttons for details and reviews - smaller size */}
              <div className="flex justify-center gap-2 mt-4">
                <button
                  className="bg-pink-600 text-white px-3 py-1 text-sm rounded hover:bg-pink-700 transition-colors duration-300"
                  onClick={(e) => toggleDescription(recipe.id, e)}
                >
                  Show Details
                </button>
                
                <button
                  className={`px-3 py-1 text-sm rounded transition-colors duration-300 ${
                    showReviews[recipe.id] 
                      ? "bg-pink-800 text-white hover:bg-pink-900" 
                      : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowReviews(recipe.id);
                  }}
                >
                  {showReviews[recipe.id] ? "Hide Reviews" : "Show Reviews"}
                </button>
              </div>
              
              {/* Add Save button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={(e) => handleSaveRecipe(recipe.id, e)}
                  className={`px-4 py-2 text-sm rounded transition-colors duration-300 flex items-center justify-center ${
                    savedRecipes[recipe.id]
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-pink-600 text-white hover:bg-pink-700"
                  }`}
                  disabled={savingRecipes[recipe.id]}
                >
                  {savingRecipes[recipe.id] ? (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : savedRecipes[recipe.id] ? (
                    "Saved"
                  ) : (
                    "Save Recipe"
                  )}
                </button>
              </div>
              
              {/* Reviews section - only visible when reviews button is clicked */}
              {showReviews[recipe.id] && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-pink-600">Reviews</h4>
                    {!hasUserReviewed(recipe.id) ? (
                      <button
                        onClick={() => openReviewModal(recipe.id)}
                        className="text-sm bg-pink-100 text-pink-700 hover:bg-pink-200 py-1 px-3 rounded-md font-medium transition-colors"
                      >
                        Write Review
                      </button>
                    ) : (
                      <span className="text-xs text-green-600 italic">You've reviewed this recipe</span>
                    )}
                  </div>
                  
                  {loadingReviews[recipe.id] ? (
                    <div className="text-center py-2">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-pink-500"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading reviews...</span>
                    </div>
                  ) : recipeReviews[recipe.id] && recipeReviews[recipe.id].length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {recipeReviews[recipe.id].map(review => (
                        <div key={review.id} className="bg-pink-50 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-700">{review.user}</span>
                            <div className="flex items-center">
                              <span className="text-yellow-400 text-sm mr-1">★</span>
                              <span className="text-xs text-gray-500">{review.rating}/5</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No reviews available for this recipe.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-sm shadow-lg">
            <h3 className="text-lg font-semibold mb-3">
              {reviews[modalData.recipeId] ? "Edit Your Review" : "Write a Review"}
            </h3>

            <div className="flex items-center mb-3 text-yellow-400">
              {renderStars(modalData.rating, (id, rating) => {
                if (modalData) {
                  setModalData({...modalData, rating});
                }
              }, modalData.recipeId)}
            </div>

            <textarea
              value={modalData.reviewText}
              onChange={handleReviewTextChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-700 resize-none mb-4"
              rows={4}
              placeholder="Write your review here..."
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-pink-600 text-white hover:bg-pink-700 text-sm"
                onClick={handleSubmitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : reviews[modalData?.recipeId || ''] ? "Save" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
      
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

      <section>
        <div className="bg-pink-100 rounded-2xl p-8 flex items-center justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Want to share your recipe?
            </h2>
            <p className="text-gray-600 mb-6">
              Join our community of food enthusiasts and share your culinary creations with the world.
            </p>
            <Link
              to="/user/addrecipe"
              className="bg-pink-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-pink-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
          <img
            src="https://images.unsplash.com/photo-1556911261-6bd341186b2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
            alt="Cooking"
            className="hidden lg:block w-80 h-60 object-cover rounded-xl"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
