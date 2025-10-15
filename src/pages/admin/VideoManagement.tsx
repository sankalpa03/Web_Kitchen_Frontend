import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../css/VideoManagement.css';

// Functions for YouTube URLs
const youtubeService = {
  isValidYouTubeUrl: (url: string): boolean => {
    if (!url) return false;
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?$/;
    return regex.test(url);
  },
  getYouTubeVideoId: (url: string): string | null => {
    if (!youtubeService.isValidYouTubeUrl(url)) return null;
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  },
  convertToEmbedUrl: (url: string): string | null => {
    const videoId = youtubeService.getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  },
};

//Interfaces
interface RecipeDetails {
  title: string;
  ingredients: string[];
  instructions: string[];
}

interface VideoWithRecipe {
  id: number;
  videoTitle: string;
  videoLink: string; // This will store the YouTube EMBED URL
  originalVideoLink?: string; // Stores the original user-entered URL
  recipe: RecipeDetails;
}

interface Review {
  id: number;
  videoRecipeId: number; // Links review to a VideoWithRecipe
  author: string;
  rating: number;
  comment: string;
  date: string; // Format: YYYY-MM-DD
}

//Initial Data
const initialVideosWithRecipesData: VideoWithRecipe[] = [
  {
    id: 1,
    videoTitle: 'Delicious Pasta Carbonara',
    videoLink: 'https://www.youtube.com/embed/3AAdKl1U_lk',
    originalVideoLink: 'https://www.youtube.com/watch?v=3AAdKl1U_lk',
    recipe: {
      title: 'Classic Pasta Carbonara',
      ingredients: ['200g spaghetti', '100g pancetta', '2 large eggs', '50g Pecorino Romano', 'Black pepper'],
      instructions: ['Cook spaghetti.', 'Fry pancetta.', 'Whisk eggs and cheese.', 'Combine all quickly.'],
    },
  },
];

const initialFormStateVideoRecipe: Omit<VideoWithRecipe, 'id' | 'videoLink'> & { id?: number; userInputVideoUrl: string } = {
  videoTitle: '',
  userInputVideoUrl: '',
  originalVideoLink: '',
  recipe: { title: '', ingredients: [''], instructions: [''] }, // Default with one empty field
};

// Main Component
const VideoManagement = () => {
  const [videosWithRecipes, setVideosWithRecipes] = useState<VideoWithRecipe[]>([]);
  const [showVideoRecipeModal, setShowVideoRecipeModal] = useState(false);
  const [isEditingVideoRecipe, setIsEditingVideoRecipe] = useState(false);
  const [currentVideoRecipeFormData, setCurrentVideoRecipeFormData] = useState(initialFormStateVideoRecipe);

  const [videoRecipeFormErrors, setVideoRecipeFormErrors] = useState<{
    videoTitle?: string;
    userInputVideoUrl?: string;
    recipeTitle?: string;
    recipeIngredients?: string;
    recipeInstructions?: string;
  }>({});

  // State for Reviews
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentItemForReview, setCurrentItemForReview] = useState<VideoWithRecipe | null>(null);
  const [currentVideoRecipeReviews, setCurrentVideoRecipeReviews] = useState<Review[]>([]);
  const [newReviewData, setNewReviewData] = useState({ author: '', rating: 5, comment: '' });
  const [reviewFormErrors, setReviewFormErrors] = useState<{ author?: string; rating?: string; comment?: string }>({});

  // Load data from Local Storage on mount
  useEffect(() => {
    const storedVideoRecipes = localStorage.getItem('videosWithRecipes');
    if (storedVideoRecipes) {
      setVideosWithRecipes(JSON.parse(storedVideoRecipes));
    } else {
      setVideosWithRecipes(initialVideosWithRecipesData);
    }

    const storedReviews = localStorage.getItem('allVideoRecipeReviews');
    if (storedReviews) {
      setAllReviews(JSON.parse(storedReviews));
    }
  }, []);

  // Save VideoRecipes to Local Storage
  useEffect(() => {
    if (videosWithRecipes.length > 0 || localStorage.getItem('videosWithRecipes')) {
      localStorage.setItem('videosWithRecipes', JSON.stringify(videosWithRecipes));
    }
  }, [videosWithRecipes]);

  // Save Reviews to Local Storage
  useEffect(() => {
    if (allReviews.length > 0 || localStorage.getItem('allVideoRecipeReviews')) {
      localStorage.setItem('allVideoRecipeReviews', JSON.stringify(allReviews));
    }
  }, [allReviews]);

  // Filter reviews for the current item
  useEffect(() => {
    if (currentItemForReview) {
      const filtered = allReviews
        .filter(r => r.videoRecipeId === currentItemForReview.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);
      setCurrentVideoRecipeReviews(filtered);
    } else {
      setCurrentVideoRecipeReviews([]);
    }
  }, [currentItemForReview, allReviews]);

    //Dynamic field handlers for Ingredients and Instructions
    const handleRecipeArrayChange = (
        type: 'ingredients' | 'instructions',
        index: number,
        value: string
    ) => {
        setCurrentVideoRecipeFormData(prev => {
        const updatedArray = [...prev.recipe[type]];
        updatedArray[index] = value;
        return {
            ...prev,
            recipe: { ...prev.recipe, [type]: updatedArray }
        };
        });
        // Clear potential general error for this section
        const errorKey = type === 'ingredients' ? 'recipeIngredients' : 'recipeInstructions';
        if (videoRecipeFormErrors[errorKey]) {
            setVideoRecipeFormErrors(prev => ({ ...prev, [errorKey]: undefined }));
        }
    };

    const addRecipeArrayField = (type: 'ingredients' | 'instructions') => {
        setCurrentVideoRecipeFormData(prev => ({
        ...prev,
        recipe: { ...prev.recipe, [type]: [...prev.recipe[type], ''] }
        }));
    };

    const deleteRecipeArrayField = (type: 'ingredients' | 'instructions', index: number) => {
        setCurrentVideoRecipeFormData(prev => {
        const currentArray = prev.recipe[type];
        let updatedArray = currentArray.filter((_, i) => i !== index);
        if (updatedArray.length === 0) {
            updatedArray = ['']; // Ensure at least one field remains for UX
        }
        return {
            ...prev,
            recipe: { ...prev.recipe, [type]: updatedArray }
        };
        });
    };


  // Video & Recipe Modal Functions
  const openVideoRecipeModalForCreate = () => {
    setCurrentVideoRecipeFormData(initialFormStateVideoRecipe);
    setIsEditingVideoRecipe(false);
    setVideoRecipeFormErrors({});
    setShowVideoRecipeModal(true);
  };

  const openVideoRecipeModalForEdit = (item: VideoWithRecipe) => {
    setCurrentVideoRecipeFormData({
        id: item.id,
        videoTitle: item.videoTitle,
        userInputVideoUrl: item.originalVideoLink || item.videoLink,
        originalVideoLink: item.originalVideoLink,
        recipe: {
            title: item.recipe.title,
            // Ensure there's at least one empty field if array is empty
            ingredients: item.recipe.ingredients.length > 0 ? [...item.recipe.ingredients] : [''],
            instructions: item.recipe.instructions.length > 0 ? [...item.recipe.instructions] : [''],
        }
    });
    setIsEditingVideoRecipe(true);
    setVideoRecipeFormErrors({});
    setShowVideoRecipeModal(true);
  };

  const closeVideoRecipeModal = () => {
    setShowVideoRecipeModal(false);
  };

  const handleVideoRecipeInfoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVideoRecipeFormErrors(prev => ({ ...prev, [name]: undefined }));

    if (name === 'videoTitle' || name === 'userInputVideoUrl') {
      setCurrentVideoRecipeFormData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'recipeTitle') {
      setCurrentVideoRecipeFormData(prev => ({
        ...prev,
        recipe: { ...prev.recipe, title: value },
      }));
    }
  };

  const validateVideoRecipeForm = () => {
    const errors: typeof videoRecipeFormErrors = {};
    const { videoTitle, userInputVideoUrl, recipe } = currentVideoRecipeFormData;

    if (!videoTitle.trim()) errors.videoTitle = 'Video title is required.';
    
    if (!userInputVideoUrl.trim()) {
        errors.userInputVideoUrl = 'Video URL is required.';
    } else if (!youtubeService.isValidYouTubeUrl(userInputVideoUrl.trim())) {
        errors.userInputVideoUrl = 'Invalid YouTube URL format. Please provide a valid YouTube video link.';
    } else if (!youtubeService.convertToEmbedUrl(userInputVideoUrl.trim())) {
        errors.userInputVideoUrl = 'Could not process this YouTube URL. Ensure it links to a valid video.';
    }

    if (!recipe.title.trim()) errors.recipeTitle = 'Recipe title is required.';
    
    const filledIngredients = recipe.ingredients.filter(ing => ing.trim() !== '');
    if (filledIngredients.length === 0) {
        errors.recipeIngredients = 'At least one ingredient is required.';
    } else if (recipe.ingredients.some(ing => ing.trim() === '') && recipe.ingredients.length > filledIngredients.length) {
        // This condition checks if there are empty fields amongst filled ones.
      
    }


    const filledInstructions = recipe.instructions.filter(inst => inst.trim() !== '');
    if (filledInstructions.length === 0) {
        errors.recipeInstructions = 'At least one instruction step is required.';
    }

    setVideoRecipeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVideoRecipeModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVideoRecipeForm()) return;

    const embedUrl = youtubeService.convertToEmbedUrl(currentVideoRecipeFormData.userInputVideoUrl.trim());
    if (!embedUrl) {
        setVideoRecipeFormErrors(prev => ({...prev, userInputVideoUrl: "Failed to convert to embed URL."}));
        return;
    }

    const finalRecipe: RecipeDetails = {
      title: currentVideoRecipeFormData.recipe.title.trim(),
        ingredients: currentVideoRecipeFormData.recipe.ingredients
    .map(s => s.trim())
    .filter(line => line !== '')
    .map(line => `• ${line}`),
      

      instructions: currentVideoRecipeFormData.recipe.instructions.map(s => s.trim()).filter(line => line !== '').map((line, index) => `${index + 1}. ${line}`),
    };

    const itemToSaveBase = {
      videoTitle: currentVideoRecipeFormData.videoTitle.trim(),
      videoLink: embedUrl,
      originalVideoLink: currentVideoRecipeFormData.userInputVideoUrl.trim(),
      recipe: finalRecipe,
    };

    if (isEditingVideoRecipe && currentVideoRecipeFormData.id) {
      const itemToSave: VideoWithRecipe = {
        ...itemToSaveBase,
        id: currentVideoRecipeFormData.id,
      };
      setVideosWithRecipes(prev =>
        prev.map(item => (item.id === itemToSave.id ? itemToSave : item))
      );
    } else {
      const itemToSave: VideoWithRecipe = {
        ...itemToSaveBase,
        id: Date.now(),
      };
      setVideosWithRecipes(prev => [itemToSave, ...prev]);
    }
    setShowVideoRecipeModal(false);
  };

  const handleDeleteVideoRecipe = (id: number) => {
    if (window.confirm('Are you sure you want to delete this video and its recipe? This will also remove associated reviews.')) {
      setVideosWithRecipes(prev => prev.filter(item => item.id !== id));
      setAllReviews(prev => prev.filter(review => review.videoRecipeId !== id));
    }
  };

  // Review Modal Functions
  const openReviewModal = (item: VideoWithRecipe) => {
    setCurrentItemForReview(item);
    setNewReviewData({ author: '', rating: 5, comment: '' });
    setReviewFormErrors({});
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setCurrentItemForReview(null);
  };

  const handleReviewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewReviewData(prev => ({ ...prev, [name]: name === 'rating' ? parseInt(value, 10) : value }));
    if (reviewFormErrors[name as keyof typeof reviewFormErrors]) {
      setReviewFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateReviewForm = () => {
    const errors: typeof reviewFormErrors = {};
    if (!newReviewData.author.trim()) errors.author = 'Author name is required.';
    if (!newReviewData.comment.trim()) errors.comment = 'Comment cannot be empty.';
    else if (newReviewData.comment.trim().length < 10) errors.comment = 'Comment must be at least 10 characters long.';
    
    const ratingValue = newReviewData.rating;
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) errors.rating = 'Rating must be between 1 and 5.';
    
    setReviewFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReviewForm() || !currentItemForReview) return;
    
    const reviewToAdd: Review = {
      id: Date.now(),
      videoRecipeId: currentItemForReview.id,
      author: newReviewData.author.trim(),
      rating: newReviewData.rating,
      comment: newReviewData.comment.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    setAllReviews(prev => [reviewToAdd, ...prev]);
    setNewReviewData({ author: '', rating: 5, comment: '' });
  };

  const StarRatingDisplay = ({ rating }: { rating: number }) => {
    const totalStars = 5;
    return (
      <div className="star-rating-display">
        {[...Array(totalStars)].map((_, index) => (
          <span key={index} className={index < rating ? 'star filled' : 'star empty'}>★</span>
        ))}
      </div>
    );
  };
  
  const currentPreviewEmbedUrl = youtubeService.convertToEmbedUrl(currentVideoRecipeFormData.userInputVideoUrl);

  return (
    <div className="video-management-page">

            <aside className="w-64 bg-white shadow-md p-5">
              <h2 className="text-lg font-bold mb-4">Settings</h2>
              <ul className="space-y-3">

                <li><Link to="/Admin/Profile" className="block p-2 hover:bg-pink-100 rounded">Profile</Link></li>
                 <li><Link to="/Admin/PublicPage" className="block p-2 hover:bg-pink-100 rounded">Public Profile</Link></li>
                 <li><Link to="/Admin/UserManagement" className="block p-2 hover:bg-pink-100 rounded">User Management</Link></li>
                 <li><Link to="/Admin/SavedPage" className="block p-2 hover:bg-pink-100 rounded">Saved Recipes</Link></li>
                 <li><Link to="/Admin/AddRecipe" className="block p-2 hover:bg-pink-100 rounded">Add Recipe</Link></li>
                 <li><Link to ="/Admin/VideoManagement" className="block p-2 hover:bg-pink-100 rounded"> Video management</Link></li>
                 

                </ul>
            </aside>

      <main className="video-main-content-area">
        <header className="video-management-header">
          <h1 className="page-main-title">Recipe Videos Showcase</h1>
          <button onClick={openVideoRecipeModalForCreate} className="btn btn-success btn-add-new-video-recipe">
            + Add New Video & Recipe
          </button>
        </header>

        {videosWithRecipes.length > 0 ? (
          <div className="video-recipe-cards-container">
            {videosWithRecipes.map(item => (
              <div key={item.id} className="video-recipe-card">
                <article className="card-content">
                  <section className="video-player-area">
                    <h3>{item.videoTitle}</h3>
                    <div className="video-iframe-container">
                      <iframe className="video-iframe" src={item.videoLink} title={item.videoTitle} allowFullScreen></iframe>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => openVideoRecipeModalForEdit(item)} className="btn btn-warning btn-sm">Edit</button>
                      <button onClick={() => handleDeleteVideoRecipe(item.id)} className="btn btn-danger btn-sm">Delete</button>
                      <button onClick={() => openReviewModal(item)} className="btn btn-info btn-sm">Reviews</button>
                    </div>
                  </section>
                  <section className="recipe-details-area">
                    <h4>{item.recipe.title}</h4>
                    <h5>Ingredients:</h5>
                    <ul className="ingredient-list">
                      {item.recipe.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
                    </ul>
                    <h5>Instructions:</h5>
                    <ol className="instruction-list">
                      {item.recipe.instructions.map((step, idx) => <li key={idx}>{step}</li>)}
                    </ol>
                  </section>
                </article>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-message-container">
            <p className="empty-message">No videos and recipes yet. Get started by adding one!</p>
          </div>
        )}
      </main>

      {showVideoRecipeModal && (
        <div className="modal-overlay" onClick={closeVideoRecipeModal}>
          <div className="modal-content video-recipe-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{isEditingVideoRecipe ? 'Update Video & Recipe' : 'Add New Video & Recipe'}</h3>
            <form onSubmit={handleVideoRecipeModalSubmit} className="video-recipe-modal-form" noValidate>
              <fieldset>
                <legend>Video Details</legend>
                <div className="form-group">
                  <label htmlFor="videoTitleModal">Video Title:</label>
                  <input type="text" id="videoTitleModal" name="videoTitle" value={currentVideoRecipeFormData.videoTitle} onChange={handleVideoRecipeInfoInputChange} className="modal-input" />
                  {videoRecipeFormErrors.videoTitle && <p className="error-message">{videoRecipeFormErrors.videoTitle}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="userInputVideoUrlModal">YouTube Video URL:</label>
                  <input type="text" id="userInputVideoUrlModal" name="userInputVideoUrl" value={currentVideoRecipeFormData.userInputVideoUrl} onChange={handleVideoRecipeInfoInputChange} className="modal-input" placeholder="e.g., https://www.youtube.com/watch?v=VIDEO_ID" />
                  {videoRecipeFormErrors.userInputVideoUrl && <p className="error-message">{videoRecipeFormErrors.userInputVideoUrl}</p>}
                </div>
                {currentPreviewEmbedUrl && (
                  <div className="modal-video-preview">
                    <p style={{fontSize: '0.9em', marginBottom: '5px'}}>Preview:</p>
                    <div className="video-iframe-container modal-iframe-container">
                        <iframe className="video-iframe" src={currentPreviewEmbedUrl} title="Video Preview" allowFullScreen></iframe>
                    </div>
                  </div>
                )}
              </fieldset>
              <fieldset>
                <legend>Recipe Details</legend>
                <div className="form-group">
                  <label htmlFor="recipeTitleModal">Recipe Title:</label>
                  <input type="text" id="recipeTitleModal" name="recipeTitle" value={currentVideoRecipeFormData.recipe.title} onChange={handleVideoRecipeInfoInputChange} className="modal-input" />
                  {videoRecipeFormErrors.recipeTitle && <p className="error-message">{videoRecipeFormErrors.recipeTitle}</p>}
                </div>
                
                <div className="form-group">
                    <label className="font-medium">Ingredients</label>
                    {currentVideoRecipeFormData.recipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="dynamic-field-row">
                        <input 
                            type="text" 
                            value={ing} 
                            onChange={(e) => handleRecipeArrayChange("ingredients", idx, e.target.value)} 
                            placeholder={`Ingredient ${idx + 1}`} 
                            className="modal-input dynamic-input" 
                        />
                        {currentVideoRecipeFormData.recipe.ingredients.length > 1 && (
                        <button 
                            type="button" 
                            onClick={() => deleteRecipeArrayField("ingredients", idx)} 
                            className="btn-delete-field"
                        >
                            Remove
                        </button>
                        )}
                    </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={() => addRecipeArrayField("ingredients")} 
                        className="btn-add-field"
                    >
                    + Add Ingredient
                    </button>
                    {videoRecipeFormErrors.recipeIngredients && <p className="error-message">{videoRecipeFormErrors.recipeIngredients}</p>}
                </div>

                <div className="form-group">
                    <label className="font-medium">Instructions</label>
                    {currentVideoRecipeFormData.recipe.instructions.map((inst, idx) => (
                    <div key={idx} className="dynamic-field-row">
                        <textarea 
                            value={inst} 
                            onChange={(e) => handleRecipeArrayChange("instructions", idx, e.target.value)} 
                            placeholder={`Step ${idx + 1}`} 
                            className="modal-textarea dynamic-textarea" // Use textarea for potentially longer instructions
                            rows={2} // Adjust rows as needed
                        />
                        {currentVideoRecipeFormData.recipe.instructions.length > 1 && (
                        <button 
                            type="button" 
                            onClick={() => deleteRecipeArrayField("instructions", idx)} 
                            className="btn-delete-field"
                        >
                            Remove
                        </button>
                        )}
                    </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={() => addRecipeArrayField("instructions")} 
                        className="btn-add-field"
                    >
                    + Add Step
                    </button>
                    {videoRecipeFormErrors.recipeInstructions && <p className="error-message">{videoRecipeFormErrors.recipeInstructions}</p>}
                </div>

              </fieldset>
              <div className="modal-actions">
                <button type="button" onClick={closeVideoRecipeModal} className="btn btn-primary">Cancel</button>
                <button type="submit" className="btn btn-secondary">{isEditingVideoRecipe ? 'Update Details' : 'Save Details'}</button>
              </div>
            </form>
            <button className="modal-close-btn" onClick={closeVideoRecipeModal}>×</button>
          </div>
        </div>
      )}

      {showReviewModal && currentItemForReview && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content review-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Reviews for "{currentItemForReview.recipe.title}"</h3>
            <section className="add-review-section-modal">
              <h4>Leave Your Review</h4>
              <form onSubmit={handleReviewSubmit} className="review-form-modal" noValidate>
                <div className="form-group">
                  <label htmlFor="reviewAuthorModal">Your Name:</label>
                  <input type="text" id="reviewAuthorModal" name="author" value={newReviewData.author} onChange={handleReviewInputChange} className="modal-input" />
                  {reviewFormErrors.author && <p className="error-message">{reviewFormErrors.author}</p>}
                </div>
                <div className="form-group star-rating-input-modal">
                  <label htmlFor="reviewRatingModal">Rating:</label>
                  <select id="reviewRatingModal" name="rating" value={newReviewData.rating} onChange={handleReviewInputChange} className="modal-select">
                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                  </select>
                  <StarRatingDisplay rating={newReviewData.rating} />
                  {reviewFormErrors.rating && <p className="error-message">{reviewFormErrors.rating}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="reviewCommentModal">Comment:</label>
                  <textarea id="reviewCommentModal" name="comment" value={newReviewData.comment} onChange={handleReviewInputChange} className="modal-textarea" rows={4} />
                  {reviewFormErrors.comment && <p className="error-message">{reviewFormErrors.comment}</p>}
                </div>
                <button type="submit" className="btn btn-primary btn-submit-review-modal">Submit Review</button>
              </form>
            </section>
            <section className="reviews-list-section-modal">
              <h4>Customer Feedback</h4>
              {currentVideoRecipeReviews.length === 0 ? (
                <p className="no-reviews-message">Be the first to share your thoughts!</p>
              ) : (
                <div className="reviews-scrollable-area-modal">
                  {currentVideoRecipeReviews.map(review => (
                    <article key={review.id} className="review-item-modal">
                      <header className="review-item-header-modal">
                        <span className="review-author-modal">{review.author}</span>
                        <StarRatingDisplay rating={review.rating} />
                      </header>
                      <p className="review-comment-modal">{review.comment}</p>
                      <footer className="review-date-modal">Reviewed on: {new Date(review.date).toLocaleDateString()}</footer>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <button className="modal-close-btn" onClick={closeReviewModal}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;