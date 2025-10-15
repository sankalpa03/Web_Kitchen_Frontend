import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../css/add.css'; // Ensure this CSS file exists and is styled

// Helper function to parse time string like "1 hr 30 mins" into total minutes
const parseTimeToMinutes = (timeString: string | undefined): number => {
  if (!timeString || typeof timeString !== 'string' || timeString.trim() === '') {
    return 0;
  }

  let totalMinutes = 0;
  // Matches segments like "1h", "30m", "2hr", "15mins"
  const segments = timeString.toLowerCase().match(/(\d+)\s*(h(?:rs?|ours?)?|m(?:ins?|inutes?)?)/g);

  if (segments) {
    segments.forEach(segment => {
      const valueMatch = segment.match(/(\d+)/);
      const unitMatch = segment.match(/([hm])/); // Simple check for h or m

      if (valueMatch && unitMatch) {
        const value = parseInt(valueMatch[1], 10);
        const unit = unitMatch[1];

        if (unit === 'h') {
          totalMinutes += value * 60;
        } else if (unit === 'm') {
          totalMinutes += value;
        }
      }
    });
  } else if (/^\d+$/.test(timeString.trim())) {
    // If the string is just a number (e.g., "30"), assume minutes
    const val = parseInt(timeString.trim(), 10);
    if (!isNaN(val)) return val;
  }
  return totalMinutes;
};

// Helper function to format total minutes into "X hr Y mins" string
const formatMinutesToTime = (totalMinutes: number): string => {
  if (totalMinutes <= 0 || isNaN(totalMinutes)) {
    return '';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let result = '';
  if (hours > 0) {
    result += `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    if (result !== '') {
      result += ' ';
    }
    result += `${minutes} min${minutes > 1 ? 's' : ''}`;
  }
  return result.trim();
};


// Interfaces
interface RecipeDetails {
  title: string;
  ingredients: string[];
  instructions: string[];
}

interface RecipeWithImage {
  id: number;
  title: string;
  imageUrl?: string;
  imageFile?: File; // For holding the File object before processing
  ingredients: string[];
  instructions: string[];
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: number;
}

const initialRecipeFormState: Omit<RecipeWithImage, 'id'> = {
  title: '',
  imageUrl: undefined,
  imageFile: undefined,
  ingredients: [''],
  instructions: [''],
  description: '',
  prepTime: '',
  cookTime: '',
  totalTime: '', // Will be auto-calculated
  servings: undefined,
};

const RECIPES_LOCAL_STORAGE_KEY = 'myKitchenRecipes';

const AddRecipePage: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeWithImage[]>([]);
  const [showRecipeFormModal, setShowRecipeFormModal] = useState(false);
  const [showViewRecipeModal, setShowViewRecipeModal] = useState(false);
  const [selectedRecipeForView, setSelectedRecipeForView] = useState<RecipeWithImage | null>(null);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [currentRecipeFormData, setCurrentRecipeFormData] = useState<Omit<RecipeWithImage, 'id'> & { id?: number }>(initialRecipeFormState);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formErrors, setFormErrors] = useState<{
    title?: string;
    imageFile?: string;
    ingredients?: string;
    instructions?: string;
    description?: string;
    servings?: string;
    prepTime?: string;
    cookTime?: string;
    totalTime?: string; // Error for totalTime likely won't be used if auto-calculated
  }>({});

  // Load recipes from localStorage
  useEffect(() => {
    const storedRecipes = localStorage.getItem(RECIPES_LOCAL_STORAGE_KEY);
    if (storedRecipes) {
      try {
        const parsedRecipes: RecipeWithImage[] = JSON.parse(storedRecipes);
        setRecipes(parsedRecipes.map(r => ({ ...r, imageFile: undefined })));
      } catch (e) {
        console.error("Error parsing recipes from localStorage:", e);
        setRecipes([]);
        localStorage.removeItem(RECIPES_LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  // Save recipes to localStorage
  useEffect(() => {
    if (recipes.length > 0 || localStorage.getItem(RECIPES_LOCAL_STORAGE_KEY)) {
      const recipesToStore = recipes.map(({ imageFile, ...rest }) => rest);
      localStorage.setItem(RECIPES_LOCAL_STORAGE_KEY, JSON.stringify(recipesToStore));
    }
  }, [recipes]);

  // Auto-calculate Total Time
  useEffect(() => {
    const timeRegex = /^(?:\d+\s*(?:mins?|minutes?|hrs?|hours?|m|h)\s*)*$/i;

    const prepTimeStr = currentRecipeFormData.prepTime?.trim() || '';
    const cookTimeStr = currentRecipeFormData.cookTime?.trim() || '';

    // Check if formats are valid (or empty strings)
    const isPrepTimeValidFormat = prepTimeStr === '' || timeRegex.test(prepTimeStr);
    const isCookTimeValidFormat = cookTimeStr === '' || timeRegex.test(cookTimeStr);

    let newTotalTime = '';

    if (isPrepTimeValidFormat && isCookTimeValidFormat) {
      const prepMinutes = parseTimeToMinutes(prepTimeStr);
      const cookMinutes = parseTimeToMinutes(cookTimeStr);

      if (prepMinutes > 0 || cookMinutes > 0) {
        const totalCalcMinutes = prepMinutes + cookMinutes;
        newTotalTime = formatMinutesToTime(totalCalcMinutes);
      }
    }
    
    setCurrentRecipeFormData(prev => ({
      ...prev,
      totalTime: newTotalTime,
    }));

    if (formErrors.totalTime && newTotalTime !== '') {
        setFormErrors(prev => ({ ...prev, totalTime: undefined }));
    }

  }, [currentRecipeFormData.prepTime, currentRecipeFormData.cookTime]);


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
    setCurrentRecipeFormData(prev => ({
      ...prev,
      [name]: type === 'number' && value !== '' ? parseInt(value, 10) : value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormErrors(prev => ({ ...prev, imageFile: undefined }));
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, imageFile: "Image size should not exceed 2MB." }));
        setImagePreviewUrl(isEditingRecipe ? currentRecipeFormData.imageUrl || null : null);
        setCurrentRecipeFormData(prev => ({ ...prev, imageFile: undefined }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setFormErrors(prev => ({ ...prev, imageFile: "Invalid file type. Please upload JPG, PNG, GIF, or WEBP." }));
        setImagePreviewUrl(isEditingRecipe ? currentRecipeFormData.imageUrl || null : null);
        setCurrentRecipeFormData(prev => ({ ...prev, imageFile: undefined }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setCurrentRecipeFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentRecipeFormData(prev => ({ ...prev, imageFile: undefined }));
      setImagePreviewUrl(isEditingRecipe && currentRecipeFormData.imageUrl ? currentRecipeFormData.imageUrl : null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    }
  };

  const handleImageUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRecipeArrayChange = (
    type: 'ingredients' | 'instructions',
    index: number,
    value: string
  ) => {
    setCurrentRecipeFormData(prev => {
      const updatedArray = [...prev[type]];
      updatedArray[index] = value;
      return { ...prev, [type]: updatedArray };
    });
    if (formErrors[type]) {
      setFormErrors(prev => ({ ...prev, [type]: undefined }));
    }
  };

  const addRecipeArrayField = (type: 'ingredients' | 'instructions') => {
    setCurrentRecipeFormData(prev => ({
      ...prev, [type]: [...prev[type], ''],
    }));
  };

  const deleteRecipeArrayField = (type: 'ingredients' | 'instructions', index: number) => {
    setCurrentRecipeFormData(prev => {
      let updatedArray = prev[type].filter((_, i) => i !== index);
      if (updatedArray.length === 0) updatedArray = [''];
      return { ...prev, [type]: updatedArray };
    });
  };

  const openRecipeFormModalForCreate = () => {
    setIsEditingRecipe(false);
    setCurrentRecipeFormData(initialRecipeFormState);
    setImagePreviewUrl(null);
    setFormErrors({});
    setShowRecipeFormModal(true);
  };

  const openRecipeFormModalForEdit = (recipeToEdit: RecipeWithImage) => {
    setIsEditingRecipe(true);
    // The useEffect for totalTime will re-calculate it based on prep/cook from recipeToEdit
    setCurrentRecipeFormData({
      ...recipeToEdit,
      ingredients: recipeToEdit.ingredients.length > 0 ? [...recipeToEdit.ingredients] : [''],
      instructions: recipeToEdit.instructions.length > 0 ? [...recipeToEdit.instructions] : [''],
      imageFile: undefined,
    });
    setImagePreviewUrl(recipeToEdit.imageUrl || null);
    setFormErrors({});
    setShowRecipeFormModal(true);
  };

  const closeRecipeFormModal = () => {
    setShowRecipeFormModal(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const openViewRecipeModal = (recipeToView: RecipeWithImage) => {
    setSelectedRecipeForView(recipeToView);
    setShowViewRecipeModal(true);
  };

  const closeViewRecipeModal = () => {
    setShowViewRecipeModal(false);
    setSelectedRecipeForView(null);
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    if (!currentRecipeFormData.title.trim()) errors.title = "Recipe title is required.";

    if (!isEditingRecipe && !currentRecipeFormData.imageFile) {
      errors.imageFile = "Recipe image is required for new recipes.";
    } else if (currentRecipeFormData.imageFile) {
      if (currentRecipeFormData.imageFile.size > 2 * 1024 * 1024) {
        errors.imageFile = "Image size should not exceed 2MB.";
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(currentRecipeFormData.imageFile.type)) {
        errors.imageFile = "Invalid file type. Please upload JPG, PNG, GIF, or WEBP.";
      }
    }

    const filledIngredients = currentRecipeFormData.ingredients.filter(ing => ing.trim() !== '');
    if (filledIngredients.length === 0) {
      errors.ingredients = "At least one ingredient is required.";
    } else if (currentRecipeFormData.ingredients.some(ing => ing.trim() === '') && currentRecipeFormData.ingredients.length > filledIngredients.length) {
      errors.ingredients = "All ingredient fields must be filled or removed.";
    }

    const filledInstructions = currentRecipeFormData.instructions.filter(inst => inst.trim() !== '');
    if (filledInstructions.length === 0) {
      errors.instructions = "At least one instruction step is required.";
    } else if (currentRecipeFormData.instructions.some(inst => inst.trim() === '') && currentRecipeFormData.instructions.length > filledInstructions.length) {
      errors.instructions = "All instruction fields must be filled or removed.";
    }

    if (currentRecipeFormData.servings !== undefined &&
        currentRecipeFormData.servings !== null &&
        String(currentRecipeFormData.servings).trim() !== '' &&
        (isNaN(Number(currentRecipeFormData.servings)) || Number(currentRecipeFormData.servings) < 1)) {
      errors.servings = "Servings must be a positive number.";
    }

    const timeRegex = /^(?:\d+\s*(?:mins?|minutes?|hrs?|hours?|m|h)\s*)*$/i;
    if (currentRecipeFormData.prepTime && currentRecipeFormData.prepTime.trim() !== '' && !timeRegex.test(currentRecipeFormData.prepTime.trim())) {
      errors.prepTime = "Invalid prep time format (e.g., '30 mins', '1 hr 15 mins').";
    }
    if (currentRecipeFormData.cookTime && currentRecipeFormData.cookTime.trim() !== '' && !timeRegex.test(currentRecipeFormData.cookTime.trim())) {
      errors.cookTime = "Invalid cook time format (e.g., '45 mins', '2 hours').";
    }
    // No need to validate totalTime format as it's auto-generated and will be valid or empty.

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let finalImageUrl = currentRecipeFormData.imageUrl;

    if (currentRecipeFormData.imageFile) {
      try {
        finalImageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(currentRecipeFormData.imageFile!);
        });
      } catch (error) {
        console.error("Error reading image file:", error);
        setFormErrors(prev => ({...prev, imageFile: "Error processing image. Please try again."}));
        return;
      }
    } else if (!isEditingRecipe && !finalImageUrl) {
      setFormErrors(prev => ({ ...prev, imageFile: "Recipe image is required." }));
      return;
    }

   
    const recipeToSave: Omit<RecipeWithImage, 'id' | 'imageFile'> = {
      title: currentRecipeFormData.title.trim(),
      imageUrl: finalImageUrl,
      ingredients: currentRecipeFormData.ingredients.map(s => s.trim()).filter(Boolean),
      instructions: currentRecipeFormData.instructions.map(s => s.trim()).filter(Boolean),
      description: currentRecipeFormData.description?.trim() || undefined,
      prepTime: currentRecipeFormData.prepTime?.trim() || undefined,
      cookTime: currentRecipeFormData.cookTime?.trim() || undefined,
      totalTime: currentRecipeFormData.totalTime?.trim() || undefined, // Already calculated
      servings: currentRecipeFormData.servings ? Number(currentRecipeFormData.servings) : undefined,
    };

    if (isEditingRecipe && currentRecipeFormData.id !== undefined) {
      setRecipes(prev =>
        prev.map(r => (r.id === currentRecipeFormData.id ? { ...recipeToSave, id: currentRecipeFormData.id! } : r))
      );
    } else {
      setRecipes(prev => [{ ...recipeToSave, id: Date.now() }, ...prev]);
    }
    closeRecipeFormModal();
  };

  const handleDeleteRecipe = (id: number) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      setRecipes(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="add-recipe-page">

            <aside className="w-64 bg-white shadow-md p-5">
              <h2 className="text-lg font-bold mb-4">Settings</h2>
              <ul className="space-y-3">

               <li><Link to="/UserpublicPage" className="block p-2 hover:bg-pink-100 rounded">Public pages </Link></li>
                <li><Link to="/UsersavedPage" className="block p-2 hover:bg-pink-100 rounded">Saved Recipes</Link></li>
                <li><Link to="/Useraddrecipe" className="block p-2 hover:bg-pink-100 rounded">Add Recipe</Link></li>
                <li><Link to="/UserProfile" className="block p-2 hover:bg-pink-100 rounded">Video Profile</Link></li>



                <li><Link to="/AdminProfile" className="block p-2 hover:bg-pink-100 rounded">Admin Profile</Link></li>
                <li><Link to="/AdminPublicPage" className="block p-2 hover:bg-pink-100 rounded">Admin Public Profile</Link></li>
                <li><Link to="/AdminUserManagement" className="block p-2 hover:bg-pink-100 rounded">Admin User Management</Link></li>
                <li><Link to="/AdminSavedPage" className="block p-2 hover:bg-pink-100 rounded">Admin Saved Recipes</Link></li>
                <li><Link to="/AdminAddRecipe" className="block p-2 hover:bg-pink-100 rounded">Admin Add Recipe</Link></li>
                <li><Link to ="/AdminVideoManagement" className="block p-2 hover:bg-pink-100 rounded"> Admin video management</Link></li>
                

                </ul>
            </aside>

      <main className="add-recipe-main-content">
        <header className="add-recipe-header">
          <h1 className="page-main-title">Manage Your Recipes</h1>
          <button onClick={openRecipeFormModalForCreate} className="btn btn-success btn-add-new-recipe">
            + Add New Recipe
          </button>
        </header>

        <div className="recipes-display-area">
          {recipes.length > 0 ? (
            <div className="recipe-cards-container">
              {recipes.map(recipe => (
                <div key={recipe.id} className="recipe-card">
                  {recipe.imageUrl && (
                    <img src={recipe.imageUrl} alt={recipe.title} className="recipe-card-image" />
                  )}
                  <div className="recipe-card-content">
                    <h3>{recipe.title}</h3>
                    {recipe.description && <p className="recipe-card-description">{recipe.description}</p>}
                    
                    <div className="recipe-card-details">
                        {recipe.prepTime && <p><strong>Prep:</strong> {recipe.prepTime}</p>}
                        {recipe.cookTime && <p><strong>Cook:</strong> {recipe.cookTime}</p>}
                        {recipe.totalTime && <p><strong>Total:</strong> {recipe.totalTime}</p>}
                        {recipe.servings && <p><strong>Servings:</strong> {recipe.servings}</p>}
                    </div>

                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <div className="recipe-card-section">
                            <h4>Ingredients:</h4>
                            <ul className="recipe-card-list">
                                {recipe.ingredients.slice(0, 3).map((ing, idx) => <li key={`ing-preview-${recipe.id}-${idx}`}>{ing}</li>)}
                                {recipe.ingredients.length > 3 && <li>...and more</li>}
                            </ul>
                        </div>
                    )}
                    
                    <div className="recipe-card-actions">
                      <button onClick={() => openViewRecipeModal(recipe)} className="btn btn-info btn-sm">View Recipe</button>
                      <button onClick={() => openRecipeFormModalForEdit(recipe)} className="btn btn-warning btn-sm">Edit</button>
                      <button onClick={() => handleDeleteRecipe(recipe.id)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-message-container">
              <p className="empty-message">No recipes added yet. Click "Add New Recipe" to start!</p>
            </div>
          )}
        </div>

        {/* Add/Edit Recipe Form Modal */}
        {showRecipeFormModal && (
          <div className="modal-overlay" onClick={closeRecipeFormModal}>
            <div className="modal-content add-recipe-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">{isEditingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</h3>
              <form onSubmit={handleFormSubmit} className="add-recipe-modal-form" noValidate>
                <fieldset>
                  <legend>Basic Information</legend>
                  <div className="form-group">
                    <label htmlFor="title">Recipe Title:</label>
                    <input type="text" id="title" name="title" value={currentRecipeFormData.title} onChange={handleInputChange} className="modal-input" required/>
                    {formErrors.title && <p className="error-message">{formErrors.title}</p>}
                  </div>

                  <div className="form-group">
                    <label>Recipe Image:</label>
                    <input 
                        type="file" 
                        id="imageFile" 
                        name="imageFile" 
                        accept="image/jpeg, image/png, image/gif, image/webp" 
                        onChange={handleImageChange} 
                        ref={fileInputRef}
                        className="modal-input-file-hidden"
                    />
                    <button 
                        type="button" 
                        onClick={handleImageUploadButtonClick} 
                        className="btn btn-upload-image"
                    >
                        {imagePreviewUrl || (isEditingRecipe && currentRecipeFormData.imageUrl) ? 'Change Image' : 'Upload Image'}
                    </button>
                    {imagePreviewUrl && (
                      <div className="image-preview-container">
                        <img src={imagePreviewUrl} alt="Recipe preview" className="image-preview" />
                      </div>
                    )}
                    {formErrors.imageFile && <p className="error-message">{formErrors.imageFile}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description (Optional):</label>
                    <textarea id="description" name="description" value={currentRecipeFormData.description || ''} onChange={handleInputChange} className="modal-textarea" rows={3} />
                  </div>
                </fieldset>

                <fieldset>
                    <legend>Details (Optional)</legend>
                     <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="prepTime">Prep Time :</label>
                            <input type="text" id="prepTime" name="prepTime" value={currentRecipeFormData.prepTime || ''} onChange={handleInputChange} className="modal-input" />
                            {formErrors.prepTime && <p className="error-message">{formErrors.prepTime}</p>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="cookTime">Cook Time :</label>
                            <input type="text" id="cookTime" name="cookTime" value={currentRecipeFormData.cookTime || ''} onChange={handleInputChange} className="modal-input" />
                            {formErrors.cookTime && <p className="error-message">{formErrors.cookTime}</p>}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="totalTime">Total Time:</label>
                            <input 
                                type="text" 
                                id="totalTime" 
                                name="totalTime" 
                                value={currentRecipeFormData.totalTime || ''} 
                                className="modal-input" 
                                readOnly // Make it read-only
                            />
                            
                        </div>
                        <div className="form-group">
                            <label htmlFor="servings">Servings:</label>
                            <input type="number" id="servings" name="servings" value={currentRecipeFormData.servings || ''} onChange={handleInputChange} className="modal-input" min="1" />
                            {formErrors.servings && <p className="error-message">{formErrors.servings}</p>}
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                  <legend>Recipe Steps</legend>
                  <div className="form-group">
                    <label className="font-medium">Ingredients:</label>
                    {currentRecipeFormData.ingredients.map((ing, idx) => (
                      <div key={`ingredient-field-${idx}`} className="dynamic-field-row">
                        <input type="text" value={ing} onChange={(e) => handleRecipeArrayChange('ingredients', idx, e.target.value)} placeholder={`Ingredient ${idx + 1}`} className="modal-input dynamic-input" />
                        {currentRecipeFormData.ingredients.length > 1 && (
                          <button type="button" onClick={() => deleteRecipeArrayField('ingredients', idx)} className="btn-delete-field">Remove</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addRecipeArrayField('ingredients')} className="btn-add-field">+ Add Ingredient</button>
                    {formErrors.ingredients && <p className="error-message">{formErrors.ingredients}</p>}
                  </div>

                  <div className="form-group">
                    <label className="font-medium">Instructions:</label>
                    {currentRecipeFormData.instructions.map((inst, idx) => (
                      <div key={`instruction-field-${idx}`} className="dynamic-field-row">
                        <textarea value={inst} onChange={(e) => handleRecipeArrayChange('instructions', idx, e.target.value)} placeholder={`Step ${idx + 1}`} className="modal-textarea dynamic-textarea" rows={2} />
                        {currentRecipeFormData.instructions.length > 1 && (
                          <button type="button" onClick={() => deleteRecipeArrayField('instructions', idx)} className="btn-delete-field">Remove</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addRecipeArrayField('instructions')} className="btn-add-field">+ Add Step</button>
                    {formErrors.instructions && <p className="error-message">{formErrors.instructions}</p>}
                  </div>
                </fieldset>

                <div className="modal-actions">
                  <button type="button" onClick={closeRecipeFormModal} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">{isEditingRecipe ? 'Update Recipe' : 'Save Recipe'}</button>
                </div>
              </form>
              <button className="modal-close-btn" onClick={closeRecipeFormModal}>×</button>
            </div>
          </div>
        )}

        {/* View Recipe Details Modal */}
        {showViewRecipeModal && selectedRecipeForView && (
            <div className="modal-overlay" onClick={closeViewRecipeModal}>
                <div className="modal-content view-recipe-modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3 className="modal-title">{selectedRecipeForView.title}</h3>
                    
                    {selectedRecipeForView.imageUrl && (
                        <div className="view-recipe-image-container">
                            <img src={selectedRecipeForView.imageUrl} alt={selectedRecipeForView.title} className="view-recipe-image" />
                        </div>
                    )}

                    {selectedRecipeForView.description && (
                        <p className="view-recipe-description">{selectedRecipeForView.description}</p>
                    )}

                    <div className="view-recipe-details-grid">
                        {selectedRecipeForView.prepTime && <p><strong>Prep Time:</strong> {selectedRecipeForView.prepTime}</p>}
                        {selectedRecipeForView.cookTime && <p><strong>Cook Time:</strong> {selectedRecipeForView.cookTime}</p>}
                        {selectedRecipeForView.totalTime && <p><strong>Total Time:</strong> {selectedRecipeForView.totalTime}</p>}
                        {selectedRecipeForView.servings && <p><strong>Servings:</strong> {selectedRecipeForView.servings}</p>}
                    </div>
                    
                    {selectedRecipeForView.ingredients && selectedRecipeForView.ingredients.length > 0 && (
                      <div className="view-recipe-section">
                        <h4>Ingredients</h4>
                        <ul className="view-recipe-list list-disc ml-5 space-y-1 text-gray-800">
                          {selectedRecipeForView.ingredients.map((ing, idx) => (
                            <li key={`view-ing-${selectedRecipeForView.id}-${idx}`}>{ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedRecipeForView.instructions && selectedRecipeForView.instructions.length > 0 && (
                      <div className="view-recipe-section">
                        <h4>Instructions</h4>
                        <ul className="view-recipe-list space-y-1 text-gray-800">
                          {selectedRecipeForView.instructions.map((inst, idx) => (
                            <li key={`view-inst-${selectedRecipeForView.id}-${idx}`}>
                              <strong>Step {idx + 1}:</strong> {inst}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" onClick={closeViewRecipeModal} className="btn btn-primary">Close</button>
                    </div>
                    <button className="modal-close-btn" onClick={closeViewRecipeModal}>×</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default AddRecipePage;