// AddRecipePage.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/add.css';

// Helper function to parse time string
const parseTimeToMinutes = (timeString: string | undefined): number => {
  if (!timeString || typeof timeString !== 'string' || timeString.trim() === '') return 0;
  let totalMinutes = 0;
  const segments = timeString.toLowerCase().match(/(\d+)\s*(h(?:rs?|ours?)?|m(?:ins?|inutes?)?)/g);
  if (segments) {
    segments.forEach(segment => {
      const valueMatch = segment.match(/(\d+)/);
      const unitMatch = segment.match(/([hm])/);
      if (valueMatch && unitMatch) {
        const value = parseInt(valueMatch[1], 10);
        const unit = unitMatch[1];
        if (unit === 'h') totalMinutes += value * 60;
        else if (unit === 'm') totalMinutes += value;
      }
    });
  } else if (/^\d+$/.test(timeString.trim())) {
    const val = parseInt(timeString.trim(), 10);
    if (!isNaN(val)) return val;
  }
  return totalMinutes;
};

// Helper function to format total minutes
const formatMinutesToTime = (totalMinutes: number): string => {
  if (totalMinutes <= 0 || isNaN(totalMinutes)) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = '';
  if (hours > 0) result += `${hours} hr${hours > 1 ? 's' : ''}`;
  if (minutes > 0) {
    if (result !== '') result += ' ';
    result += `${minutes} min${minutes > 1 ? 's' : ''}`;
  }
  return result.trim();
};

interface RecipeWithImage {
  id: number;
  title: string;
  description: string;
  category: string;
  yield_amount: string;
  imageUrl?: string;
  videoUrl?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: number | string; // Change to support both number and string
  nutrition?: Array<{
    total_calories?: number;
    fat?: number;
    saturated_fat?: number;
    cholesterol?: number;
    sodium?: number;
    carbohydrates?: number;
    fiber?: number;
    sugar?: number;
    protein?: number;
    vitamin_c?: number;
    calcium?: number;
    iron?: number;
    potassium?: number;
    magnesium?: number;
    vitamin_a?: number;
  }>;
}

// Update RecipeFormData to match required fields for API
type RecipeFormData = {
  id?: string;
  title: string;
  description: string;
  category: string;
  imageFile?: File | null;
  videoFile?: File | null;
  imageUrl?: string; // Add this property to fix the TypeScript errors
  ingredients: string[]; // UI uses array, converted to comma-separated string for API
  instructions: string[]; // UI uses array, converted to objects for API
  yield_amount: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: number | '';
  nutrition?: {
    total_calories?: number;
    fat?: number;
    saturated_fat?: number;
    cholesterol?: number;
    sodium?: number;
    carbohydrates?: number;
    fiber?: number;
    sugar?: number;
    protein?: number;
    vitamin_c?: number;
    calcium?: number;
    iron?: number;
    potassium?: number;
    magnesium?: number;
    vitamin_a?: number;
  };
  // For direction photos (one per step)
  directionPhotos: (File | null)[];
};

const initialRecipeFormState: RecipeFormData = {
  title: '',
  description: '',
  category: '',
  imageFile: null,
  videoFile: null,
  ingredients: [''],
  instructions: [''],
  yield_amount: '',
  prepTime: '',
  cookTime: '',
  totalTime: '',
  servings: '',
  nutrition: {
    total_calories: 0,
    fat: 0,
    saturated_fat: 0,
    cholesterol: 0,
    sodium: 0,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    protein: 0,
    vitamin_c: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    magnesium: 0,
    vitamin_a: 0
  },
  directionPhotos: []
};

const RECIPES_LOCAL_STORAGE_KEY = 'myKitchenRecipes';

const AddRecipePage: React.FC = () => {
  const navigate = useNavigate();
  const [recipes] = useState<RecipeWithImage[]>([]);
  const [showRecipeFormModal, setShowRecipeFormModal] = useState(false);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [currentRecipeFormData, setCurrentRecipeFormData] = useState<RecipeFormData>(initialRecipeFormState);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RecipeFormData | 'general', string>>>({});
  const [backendRecipes, setBackendRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState<string>('');
  const [directionPhotoErrors, setDirectionPhotoErrors] = useState<string[]>([]);
  // Remove unused state variables
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      navigate("/signin");
    } else {
      fetchBackendRecipes(accessToken);
    }
  }, [navigate]);

  // Fetch all recipes from backend
  const fetchBackendRecipes = async (accessToken: string) => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/user/recipe/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBackendRecipes(data);
      } else if (res.status === 401) {
        navigate("/signin");
      }
    } catch {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipe detail by id (uuid)
  const fetchRecipeDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetailRecipe(null);
    
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        navigate("/signin");
        return;
      }

      console.log("Fetching recipe details for ID:", id);
      
      const res = await fetch(`http://127.0.0.1:8000/recipe/detail/${id}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          navigate("/signin");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch recipe detail");
      }
      
      const data = await res.json();
      
      // Process data with better error handling
      const processedData = {
        ...data,
        ingredients: data.ingredients || "",
        category: typeof data.category === 'string' 
          ? { name: data.category } 
          : (data.category || { name: "Uncategorized" }),
        yield_amount: data.yield_amount || "",
        preparations: data.preparations && data.preparations.length > 0 
          ? data.preparations 
          : [{ prep_time: "", cook_time: "", total_time: "", serving: 0 }],
        directions: data.directions && data.directions.length > 0 
          ? data.directions.sort((a: any, b: any) => a.step_number - b.step_number) // Sort steps by number
          : [],
        nutrition: data.nutrition && data.nutrition.length > 0 
          ? data.nutrition 
          : []
      };
      
      setDetailRecipe(processedData);
      setShowDetailModal(true);
    } catch (err: any) {
      setDetailError("Failed to load recipe detail.");
      console.error("Recipe detail error:", err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // Add this function to fix the showRecipeDetail error
  const showRecipeDetail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    fetchRecipeDetail(id);
  };

  // Delete a recipe
  const deleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
    if (!window.confirm("Are you sure you want to delete this recipe?")) {
      return;
    }
    
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      navigate("/signin");
      return;
    }

    try {
      setLoading(true);
      
      // The DELETE request to the recipe endpoint should cascade delete related items
      // according to the Django model relationships
      const res = await fetch(`http://127.0.0.1:8000/user/recipe/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (res.ok) {
        // Refresh the recipes list after deletion
        await fetchBackendRecipes(accessToken);
        setSuccessMessage("Recipe deleted successfully!");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else if (res.status === 401) {
        navigate("/signin");
      } else {
        // Try to get error details
        try {
          const errorData = await res.json();
          alert(`Failed to delete recipe: ${errorData.detail || "Unknown error"}`);
        } catch {
          alert("Failed to delete recipe. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("An error occurred while deleting the recipe.");
    } finally {
      setLoading(false);
    }
  };

  // Render empty state when no recipes exist
  const renderEmptyState = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      <div style={{ fontSize: '60px', marginBottom: '20px' }}>🍽️</div>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>No Recipes Yet</h3>
      <p style={{ margin: '0 0 20px 0', color: '#666', maxWidth: '500px' }}>
        You haven't added any recipes yet. Click the "Add New Recipe" button above to create your first culinary masterpiece!
      </p>
      <button 
        onClick={openRecipeFormModalForCreate}
        style={{
          backgroundColor: '#ff1493',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '999px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(255,20,147,0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,20,147,0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,20,147,0.3)';
        }}
      >
        + Create Your First Recipe
      </button>
    </div>
  );

  // Fetch categories from API on mount
  useEffect(() => {
    fetch("http://127.0.0.1:8000/category/")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (recipes && (recipes.length > 0 || localStorage.getItem(RECIPES_LOCAL_STORAGE_KEY))) {
      // Remove imageFile property safely (it only exists on RecipeFormData, not RecipeWithImage)
      const recipesToStore = recipes.map((r) => {
        const { /* imageFile, */ ...rest } = r as any;
        return rest;
      });
      localStorage.setItem(RECIPES_LOCAL_STORAGE_KEY, JSON.stringify(recipesToStore));
    }
  }, [recipes]);

  useEffect(() => {
    const timeRegex = /^(?:\d+\s*(?:mins?|minutes?|hrs?|hours?|m|h)\s*)*$/i;
    const prepTimeStr = currentRecipeFormData.prepTime?.trim() || '';
    const cookTimeStr = currentRecipeFormData.cookTime?.trim() || '';
    const isPrepTimeValidFormat = prepTimeStr === '' || timeRegex.test(prepTimeStr);
    const isCookTimeValidFormat = cookTimeStr === '' || timeRegex.test(cookTimeStr);
    let newTotalTime = '';
    if (isPrepTimeValidFormat && isCookTimeValidFormat) {
      const prepMinutes = parseTimeToMinutes(prepTimeStr);
      const cookMinutes = parseTimeToMinutes(cookTimeStr);
      if (prepMinutes > 0 || cookMinutes > 0) {
        newTotalTime = formatMinutesToTime(prepMinutes + cookMinutes);
      }
    }
    setCurrentRecipeFormData(prev => ({ ...prev, totalTime: newTotalTime }));
  }, [currentRecipeFormData.prepTime, currentRecipeFormData.cookTime]);

  // Keep only one instance of handleInputChange and remove the others
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as (HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement);
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
    if ((e.target as HTMLInputElement).type === 'number') {
      setCurrentRecipeFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseInt(value, 10)
      }));
    } else {
      setCurrentRecipeFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
        setFormErrors(prev => ({ ...prev, imageFile: "Invalid file type (JPG, PNG, GIF, WEBP)." }));
        setImagePreviewUrl(isEditingRecipe ? currentRecipeFormData.imageUrl || null : null);
        setCurrentRecipeFormData(prev => ({ ...prev, imageFile: undefined }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setCurrentRecipeFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setCurrentRecipeFormData(prev => ({ ...prev, imageFile: undefined }));
      setImagePreviewUrl(isEditingRecipe && currentRecipeFormData.imageUrl ? currentRecipeFormData.imageUrl : null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // First, add this improved handler for nutrition fields
  const handleNutritionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear any previous errors for this field
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
    
    // Parse value as float or set to 0 if empty
    const numValue = value === '' ? 0 : parseFloat(value);
    
    // Update the nutrition object within the form data
    setCurrentRecipeFormData(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        [name]: numValue
      }
    }));
  };

  const handleImageUploadButtonClick = () => {
    document.getElementById('recipeImageUpload')?.click();
  };

  const handleVideoUploadButtonClick = () => {
    document.getElementById('recipeVideoUpload')?.click();
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormErrors(prev => ({ ...prev, videoFile: undefined }));
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, videoFile: "Video size should not exceed 50MB." }));
        setCurrentRecipeFormData(prev => ({ ...prev, videoFile: undefined }));
        return;
      }
      if (!['video/mp4', 'video/webm', 'video/ogg'].includes(file.type)) {
        setFormErrors(prev => ({ ...prev, videoFile: "Invalid video type (MP4, WebM, Ogg)." }));
        setCurrentRecipeFormData(prev => ({ ...prev, videoFile: undefined }));
        return;
      }
      setCurrentRecipeFormData(prev => ({ ...prev, videoFile: file }));
    } else {
      setCurrentRecipeFormData(prev => ({ ...prev, videoFile: undefined }));
    }
  };

  const handleRecipeArrayChange = (type: 'ingredients' | 'instructions', index: number, value: string) => {
    setCurrentRecipeFormData(prev => {
      const updatedArray = [...prev[type]];
      updatedArray[index] = value;
      return { ...prev, [type]: updatedArray };
    });
    if (formErrors[type]) setFormErrors(prev => ({ ...prev, [type]: undefined }));
  };

  // Handle direction photo uploads
  const handleDirectionPhotoChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const newDirectionPhotoErrors = [...directionPhotoErrors];
    newDirectionPhotoErrors[index] = '';
    setDirectionPhotoErrors(newDirectionPhotoErrors);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        newDirectionPhotoErrors[index] = "Photo size should not exceed 2MB.";
        setDirectionPhotoErrors(newDirectionPhotoErrors);
        return;
      }
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        newDirectionPhotoErrors[index] = "Invalid file type (JPG, PNG, GIF, WEBP).";
        setDirectionPhotoErrors(newDirectionPhotoErrors);
        return;
      }

      // Update the direction photos array
      setCurrentRecipeFormData(prev => {
        const newDirectionPhotos = [...(prev.directionPhotos || [])];
        newDirectionPhotos[index] = file;
        return { ...prev, directionPhotos: newDirectionPhotos };
      });
    } else {
      // Clear the photo at this index if no file selected
      setCurrentRecipeFormData(prev => {
        const newDirectionPhotos = [...(prev.directionPhotos || [])];
        newDirectionPhotos[index] = null;
        return { ...prev, directionPhotos: newDirectionPhotos };
      });
    }
  };

  // Ensure directionPhotos array is updated when instructions change
  useEffect(() => {
    setCurrentRecipeFormData(prev => {
      // Make sure directionPhotos array is same length as instructions
      const newDirectionPhotos = [...(prev.directionPhotos || [])];
      while (newDirectionPhotos.length < prev.instructions.length) {
        newDirectionPhotos.push(null);
      }
      // Trim excess
      if (newDirectionPhotos.length > prev.instructions.length) {
        newDirectionPhotos.length = prev.instructions.length;
      }
      return { ...prev, directionPhotos: newDirectionPhotos };
    });

    // Also update direction photo errors array
    setDirectionPhotoErrors(prev => {
      const newErrors = [...prev];
      while (newErrors.length < currentRecipeFormData.instructions.length) {
        newErrors.push('');
      }
      if (newErrors.length > currentRecipeFormData.instructions.length) {
        newErrors.length = currentRecipeFormData.instructions.length;
      }
      return newErrors;
    });
  }, [currentRecipeFormData.instructions]);

  // Add a step (instruction) with its associated photo field
  const addRecipeArrayField = (type: 'ingredients' | 'instructions') => {
    setCurrentRecipeFormData(prev => {
      const updatedArray = [...prev[type], ''];
      // If adding instruction, extend the directionPhotos array too
      if (type === 'instructions') {
        const updatedPhotos = [...prev.directionPhotos, null];
        return { ...prev, [type]: updatedArray, directionPhotos: updatedPhotos };
      }
      return { ...prev, [type]: updatedArray };
    });
  };

  // Delete a step (instruction) and its associated photo
  const deleteRecipeArrayField = (type: 'ingredients' | 'instructions', index: number) => {
    setCurrentRecipeFormData(prev => {
      let updatedArray = prev[type].filter((_, i) => i !== index);
      if (updatedArray.length === 0) updatedArray = [''];
      
      // If deleting instruction, also remove corresponding photo
      if (type === 'instructions') {
        const updatedPhotos = prev.directionPhotos.filter((_, i) => i !== index);
        return { ...prev, [type]: updatedArray, directionPhotos: updatedPhotos };
      }
      return { ...prev, [type]: updatedArray };
    });

    // Update errors array for direction photos
    if (type === 'instructions') {
      setDirectionPhotoErrors(prev => {
        const updatedErrors = prev.filter((_, i) => i !== index);
        return updatedErrors;
      });
    }
  };

  const openRecipeFormModalForCreate = () => {
    setIsEditingRecipe(false);
    setCurrentRecipeFormData(initialRecipeFormState);
    setImagePreviewUrl(null);
    setFormErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowRecipeFormModal(true);
  };

  // Modify the openRecipeFormModalForEdit function to handle the updated API pattern
  const openRecipeFormModalForEdit = (recipeToEdit: any) => {
    setIsEditingRecipe(true);
    
    // First, fetch complete recipe details including preparations, directions, and nutrition
    const fetchCompleteRecipeDetails = async (recipeId: string) => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          navigate("/signin");
          return;
        }
        
        // Fetch recipe details
        const detailsResponse = await fetch(`http://127.0.0.1:8000/recipe/detail/${recipeId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        });
        
        if (!detailsResponse.ok) {
          throw new Error("Failed to fetch recipe details for editing");
        }
        
        const detailData = await detailsResponse.json();
        console.log("Fetched recipe details for editing:", detailData);
        
        // Convert the backend data format to match our form structure
        setCurrentRecipeFormData({
          id: detailData.id,
          title: detailData.title || '',
          imageUrl: detailData.recipe_image || null,
          imageFile: undefined,
          // If ingredients is a string, split by comma, otherwise use empty array
          ingredients: typeof detailData.ingredients === 'string' 
            ? detailData.ingredients.split(',').map((ing: string) => ing.trim()).filter((ing: string) => ing !== '')
            : [''],
          // If directions exist, map them to extract just the direction text, otherwise use empty array
          instructions: detailData.directions && detailData.directions.length > 0
            ? detailData.directions.map((dir: any) => dir.direction)
            : [''],
          prepTime: detailData.preparations && detailData.preparations.length > 0 
            ? detailData.preparations[0].prep_time 
            : '',
          cookTime: detailData.preparations && detailData.preparations.length > 0 
            ? detailData.preparations[0].cook_time 
            : '',
          totalTime: detailData.preparations && detailData.preparations.length > 0 
            ? detailData.preparations[0].total_time 
            : '',
          servings: detailData.preparations && detailData.preparations.length > 0 
            ? detailData.preparations[0].serving 
            : '',
          description: detailData.description || '',
          // If category is an object with an ID, use that ID, otherwise use the string value
          category: typeof detailData.category === 'object' && detailData.category !== null 
            ? detailData.category.id 
            : detailData.category || '',
          yield_amount: detailData.yield_amount || '',
          nutrition: detailData.nutrition && detailData.nutrition.length > 0 
            ? { ...detailData.nutrition[0] } 
            : undefined,
          // Initialize direction photos array to match instructions length with null values
          directionPhotos: Array(detailData.directions ? detailData.directions.length : 1).fill(null)
        });
        
        setImagePreviewUrl(detailData.recipe_image || null);
        
      } catch (error) {
        console.error("Error fetching complete recipe details:", error);
        alert("Failed to load recipe details for editing.");
        return;
      } finally {
        setLoading(false);
      }
    };
    
    // Start the fetch process if we have an ID
    if (recipeToEdit.id) {
      fetchCompleteRecipeDetails(recipeToEdit.id);
    } else {
      // Basic fallback if we don't have an ID for some reason
      setCurrentRecipeFormData({
        ...initialRecipeFormState,
        title: recipeToEdit.title || '',
        description: recipeToEdit.description || '',
        category: recipeToEdit.category || '',
      });
    }
    
    setFormErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowRecipeFormModal(true);
  };

  const closeRecipeFormModal = () => {
    setShowRecipeFormModal(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setImagePreviewUrl(null);
    setCurrentRecipeFormData(prev => ({...prev, imageFile: undefined}));
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailRecipe(null);
  };

  // Add function to close approval modal
  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setApprovalMessage('');
  };

  // Remove redundant closeViewRecipeModal function which duplicates closeDetailModal
  
  // Fix validateForm function - correct the cookTime validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof RecipeFormData | 'general', string>> = {};
    if (!currentRecipeFormData.title.trim()) errors.title = "Recipe title is required.";

    // Check for image
    if (!currentRecipeFormData.imageFile && !isEditingRecipe) {
      errors.imageFile = "Recipe image is required for new recipes.";
    }
    
    // Validate ingredients
    const filledIngredients = currentRecipeFormData.ingredients.filter(ing => ing.trim() !== '');
    if (filledIngredients.length === 0) errors.ingredients = "At least one ingredient is required.";
    else if (currentRecipeFormData.ingredients.some(ing => ing.trim() === '') && currentRecipeFormData.ingredients.length > filledIngredients.length) {
      errors.ingredients = "All ingredient fields must be filled or removed if empty.";
    }

    // Validate instructions
    const filledInstructions = currentRecipeFormData.instructions.filter(inst => inst.trim() !== '');
    if (filledInstructions.length === 0) errors.instructions = "At least one instruction step is required.";
    else if (currentRecipeFormData.instructions.some(inst => inst.trim() === '') && currentRecipeFormData.instructions.length > filledInstructions.length) {
      errors.instructions = "All instruction fields must be filled or removed if empty.";
    }
    
    // Check direction photo errors
    const hasPhotoError = directionPhotoErrors.some(error => error !== '');
    if (hasPhotoError) {
      errors.instructions = "Please fix issues with step photos.";
    }
    
    const servingsVal = currentRecipeFormData.servings;
    if (servingsVal !== undefined && servingsVal !== '' && (isNaN(Number(servingsVal)) || Number(servingsVal) < 1)) {
      errors.servings = "Servings must be a positive number if provided.";
    }

    const timeFormatRegex = /^(?:\d+\s*(?:mins?|minutes?|hrs?|hours?|m|h)\s*)*$/i;
    if (currentRecipeFormData.prepTime?.trim() && !timeFormatRegex.test(currentRecipeFormData.prepTime.trim())) {
      errors.prepTime = "Invalid prep time (e.g., '30 mins', '1 hr').";
    }
    if (currentRecipeFormData.cookTime?.trim() && !timeFormatRegex.test(currentRecipeFormData.cookTime.trim())) {
      errors.cookTime = "Invalid cook time (e.g., '45 mins', '2 hrs').";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      navigate("/signin");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the base recipe first
      const baseRecipeData = {
        title: currentRecipeFormData.title,
        description: currentRecipeFormData.description || "",
        category: currentRecipeFormData.category,
        ingredients: currentRecipeFormData.ingredients
          .filter(ing => ing.trim() !== '')
          .join(", "),
        yield_amount: currentRecipeFormData.yield_amount || ""
      };

      console.log("Creating base recipe with data:", baseRecipeData);

      // Create FormData for the base recipe
      const formData = new FormData();
      
      // Add the recipe image if provided
      if (currentRecipeFormData.imageFile) {
        formData.append('recipe_image', currentRecipeFormData.imageFile);
      }
      
      // Add each field to formData
      Object.entries(baseRecipeData).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      // Step 1: Create the recipe first
      const isUpdate = Boolean(currentRecipeFormData.id);
      const baseUrl = "http://127.0.0.1:8000/user/recipe/";
      const recipeUrl = isUpdate ? `${baseUrl}${currentRecipeFormData.id}/` : baseUrl;
      const method = isUpdate ? "PUT" : "POST";

      const recipeResponse = await fetch(recipeUrl, {
        method: method,
        headers: {
          "Authorization": `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!recipeResponse.ok) {
        const errorData = await recipeResponse.json();
        handleApiError(recipeResponse.status, errorData);
        throw new Error("Failed to create base recipe");
      }

      // Get the recipe data with ID
      const recipeData = await recipeResponse.json();
      const recipeId = recipeData.id;
      console.log("Recipe created with ID:", recipeId);

      // Step 2: Handle preparation data
      const preparationData = {
        prep_time: currentRecipeFormData.prepTime?.trim() || "0 mins",
        cook_time: currentRecipeFormData.cookTime?.trim() || "0 mins", 
        total_time: currentRecipeFormData.totalTime?.trim() || "0 mins",
        serving: currentRecipeFormData.servings !== '' ? Number(currentRecipeFormData.servings) : 4
      };

      // Validate time formats
      const timeRegex = /^(?:\d+\s*(?:mins?|minutes?|hrs?|hours?|m|h)\s*)*$/i;
      if (preparationData.prep_time && !timeRegex.test(preparationData.prep_time)) {
        preparationData.prep_time = "0 mins";
      }
      if (preparationData.cook_time && !timeRegex.test(preparationData.cook_time)) {
        preparationData.cook_time = "0 mins";
      }
      if (preparationData.total_time && !timeRegex.test(preparationData.total_time)) {
        preparationData.total_time = "0 mins";
      }

      console.log("Creating preparation data:", preparationData);
      
      const prepFormData = new FormData();
      
      // Add recipe video if provided
      if (currentRecipeFormData.videoFile) {
        prepFormData.append('recipe_video', currentRecipeFormData.videoFile);
      }

      // Add all preparation data fields
      prepFormData.append('prep_time', preparationData.prep_time);
      prepFormData.append('cook_time', preparationData.cook_time);
      prepFormData.append('total_time', preparationData.total_time);
      prepFormData.append('serving', String(preparationData.serving));

      // Debug log to see what's being sent
      console.log("Preparation FormData contents:");
      for (let pair of prepFormData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      // Handle preparation creation/update properly
      if (isUpdate) {
        // For updates, first fetch existing preparations to get the correct ID
        try {
          const existingPrepResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/preparation/`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          });
          
          if (existingPrepResponse.ok) {
            const existingPreparations = await existingPrepResponse.json();
            console.log("Existing preparations:", existingPreparations);
            
            if (existingPreparations && existingPreparations.length > 0) {
              // Update the first existing preparation
              const prepId = existingPreparations[0].id;
              const prepResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/preparation/${prepId}/`, {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${accessToken}`
                },
                body: prepFormData
              });
              
              if (!prepResponse.ok) {
                const errorText = await prepResponse.text();
                console.error("Failed to update preparation data:", errorText);
                console.error("Response status:", prepResponse.status);
              } else {
                const prepResult = await prepResponse.json();
                console.log("Preparation updated successfully:", prepResult);
              }
            } else {
              // No existing preparation, create new one
              const prepResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/preparation/`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`
                },
                body: prepFormData
              });
              
              if (!prepResponse.ok) {
                const errorText = await prepResponse.text();
                console.error("Failed to create preparation data:", errorText);
              } else {
                console.log("Preparation created successfully");
              }
            }
          } else {
            console.error("Failed to fetch existing preparations");
          }
        } catch (error) {
          console.error("Error handling preparation update:", error);
        }
      } else {
        // For new recipes, create preparation
        const prepResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/preparation/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`
          },
          body: prepFormData
        });

        if (!prepResponse.ok) {
          const errorText = await prepResponse.text();
          console.error("Failed to create preparation data:", errorText);
          console.error("Response status:", prepResponse.status);
        } else {
          const prepResult = await prepResponse.json();
          console.log("Preparation created successfully:", prepResult);
        }
      }

      // Step 3: Create direction data
      // If updating, first delete existing directions
      if (isUpdate) {
        try {
          const existingDirResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/direction/`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          });
          
          if (existingDirResponse.ok) {
            const existingDirections = await existingDirResponse.json();
            
            // Delete each existing direction
            for (const dir of existingDirections) {
              await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/direction/${dir.id}/`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${accessToken}`
                }
              });
            }
          }
        } catch (error) {
          console.error("Error handling existing directions:", error);
        }
      }

      // Create all new directions
      const directions = currentRecipeFormData.instructions
        .filter(inst => inst.trim() !== '')
        .map((direction, idx) => ({
          step_number: idx + 1,
          direction: direction.trim(),
          direction_photo: null
        }));

      console.log("Creating directions:", directions);

      // Add each direction separately with its photo
      for (let i = 0; i < directions.length; i++) {
        const directionFormData = new FormData();
        directionFormData.append('step_number', String(directions[i].step_number));
        directionFormData.append('direction', directions[i].direction);
        
        // Add direction photo if available
        if (currentRecipeFormData.directionPhotos[i]) {
          directionFormData.append('direction_photo', currentRecipeFormData.directionPhotos[i] as File);
        }

        const dirResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/direction/`, {
          method: "POST", // Always POST for new directions after clearing
          headers: {
            "Authorization": `Bearer ${accessToken}`
          },
          body: directionFormData
        });

        if (!dirResponse.ok) {
          console.error(`Failed to create direction ${i + 1}:`, await dirResponse.text());
          // Continue with other directions even if one fails
        } else {
          console.log(`Direction ${i + 1} created successfully`);
        }
      }

      // Step 4: Handle nutrition data
      const nutritionData = {
        total_calories: Number(currentRecipeFormData.nutrition?.total_calories) || 0,
        fat: Number(currentRecipeFormData.nutrition?.fat) || 0,
        saturated_fat: Number(currentRecipeFormData.nutrition?.saturated_fat) || 0,
        cholesterol: Number(currentRecipeFormData.nutrition?.cholesterol) || 0,
        sodium: Number(currentRecipeFormData.nutrition?.sodium) || 0,
        carbohydrates: Number(currentRecipeFormData.nutrition?.carbohydrates) || 0,
        fiber: Number(currentRecipeFormData.nutrition?.fiber) || 0,
        sugar: Number(currentRecipeFormData.nutrition?.sugar) || 0,
        protein: Number(currentRecipeFormData.nutrition?.protein) || 0,
        vitamin_c: Number(currentRecipeFormData.nutrition?.vitamin_c) || 0,
        calcium: Number(currentRecipeFormData.nutrition?.calcium) || 0,
        iron: Number(currentRecipeFormData.nutrition?.iron) || 0,
        potassium: Number(currentRecipeFormData.nutrition?.potassium) || 0,
        magnesium: Number(currentRecipeFormData.nutrition?.magnesium) || 0,
        vitamin_a: Number(currentRecipeFormData.nutrition?.vitamin_a) || 0
      };

      console.log("Creating nutrition data:", nutritionData);

      // Handle nutrition creation/update properly
      if (isUpdate) {
        // For updates, first fetch existing nutrition to get the correct ID
        try {
          const existingNutritionResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/nutrition/`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          });
          
          if (existingNutritionResponse.ok) {
            const existingNutrition = await existingNutritionResponse.json();
            console.log("Existing nutrition:", existingNutrition);
            
            if (existingNutrition && existingNutrition.length > 0) {
              // Update the first existing nutrition
              const nutritionId = existingNutrition[0].id;
              const nutritionResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/nutrition/${nutritionId}/`, {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(nutritionData)
              });
              
              if (!nutritionResponse.ok) {
                console.error("Failed to update nutrition data:", await nutritionResponse.text());
              } else {
                console.log("Nutrition data updated successfully");
              }
            } else {
              // No existing nutrition, create new one
              const nutritionResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/nutrition/`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(nutritionData)
              });
              
              if (!nutritionResponse.ok) {
                console.error("Failed to create nutrition data:", await nutritionResponse.text());
              } else {
                console.log("Nutrition data created successfully");
              }
            }
          } else {
            console.error("Failed to fetch existing nutrition");
          }
        } catch (error) {
          console.error("Error handling nutrition update:", error);
        }
      } else {
        // For new recipes, create nutrition
        const nutritionResponse = await fetch(`http://127.0.0.1:8000/user/recipe/${recipeId}/nutrition/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(nutritionData)
        });

        if (!nutritionResponse.ok) {
          console.error("Failed to create nutrition data:", await nutritionResponse.text());
        } else {
          console.log("Nutrition data created successfully");
        }
      }

      // Refresh the recipe list
      await fetchBackendRecipes(accessToken);
      closeRecipeFormModal();
      
      // Show approval message for new recipes, update message for edits
      if (isUpdate) {
        setSuccessMessage("Recipe updated successfully!");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setApprovalMessage("Your food recipe is undergoing admin approval. After approved by admin  available to other users.");
        setShowApprovalModal(true);
      }
      
    } catch (error) {
      console.error("Error saving recipe:", error);
      if (!formErrors.general) {
        setFormErrors(prev => ({
          ...prev,
          general: "An unexpected error occurred. Please try again later."
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle API errors
  const handleApiError = (status: number, errorData: any) => {
    if (status === 400) {
      // Process validation errors
      let errorsObj: Record<string, string> = {};
      
      // Process different error formats
      if (errorData.title && Array.isArray(errorData.title)) {
        errorsObj.title = errorData.title[0];
      }
      
      // Handle nested error objects
      Object.entries(errorData).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          errorsObj[key] = value[0] as string;
        } else if (typeof value === 'string') {
          errorsObj[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested errors (e.g., for preparations, directions, etc.)
          Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
            if (Array.isArray(nestedValue) && nestedValue.length > 0) {
              errorsObj[`${key}.${nestedKey}`] = nestedValue[0] as string;
            }
          });
        }
      });
      
      if (Object.keys(errorsObj).length === 0) {
        errorsObj.general = "Failed to save recipe. Please check your input.";
      }
      
      setFormErrors(errorsObj as any);
    } else {
      // Handle other error statuses
      setFormErrors({ general: errorData.detail || "An error occurred while saving the recipe." });
    }
  };

  // Fetch categories from API on mount
  useEffect(() => {
    fetch("http://127.0.0.1:8000/category/")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  return (
    <div className="add-recipe-page">
      <main className="add-recipe-main-content">
        <header className="add-recipe-header">
          <h1 className="page-main-title">Manage Your Recipes</h1>
          <button 
            onClick={openRecipeFormModalForCreate} 
            className="btn btn-success btn-add-new-recipe"
            style={{ cursor: 'pointer' }}
          >
            + Add New Recipe
          </button>
        </header>

        {successMessage && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '10px 15px',
            borderRadius: '4px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {successMessage}
          </div>
        )}

        <div className="recipes-display-area">
          {loading ? (
            <div>Loading...</div>
          ) : backendRecipes.length > 0 ? (
            <div className="recipe-cards-container">
              {backendRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  className="recipe-card"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => showRecipeDetail(recipe.id, e)}
                >
                  {recipe.recipe_image ? (
                    <img 
                      src={recipe.recipe_image} 
                      alt={recipe.title} 
                      className="recipe-card-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px 8px 0 0'
                      }}
                    />
                  ) : (
                    <div className="recipe-card-image-placeholder" style={{
                      height: '200px',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px 8px 0 0'
                    }}>
                      No Image
                    </div>
                  )}
                  <div className="recipe-card-content" style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{recipe.title}</h3>
                    <div className="recipe-card-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p style={{ color: '#666' }}>{recipe.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          backgroundColor: '#ffebf5', 
                          color: '#ff1493', 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '999px',
                          fontSize: '0.875rem',
                          textTransform: 'capitalize'
                        }}>
                          {recipe.category}
                        </span>
                        <span style={{ color: '#666', fontSize: '0.875rem' }}>By {recipe.user}</span>
                      </div>
                    </div>
                  </div>
                  <div className="recipe-card-actions" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderTop: '1px solid #eee'
                  }}>
                    <button 
                      onClick={(e) => showRecipeDetail(recipe.id, e)}
                      style={{
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(74,144,226,0.2)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(74,144,226,0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(74,144,226,0.2)';
                      }}
                    >
                      View Details
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openRecipeFormModalForEdit(recipe);
                      }}
                      style={{
                        backgroundColor: '#ff1493',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(255,20,147,0.2)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(255,20,147,0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(255,20,147,0.2)';
                      }}
                    >
                      Edit Recipe
                    </button>
                    
                    <button 
                      onClick={(e) => deleteRecipe(recipe.id, e)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(220,53,69,0.2)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(220,53,69,0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(220,53,69,0.2)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

            </div>
          ) : (
            renderEmptyState()
          )}
        </div>

        {/* Fix the modal visibility with proper overlay */}
        {showRecipeFormModal && (
          <div className="modal-overlay active">
            <div className="modal-content add-recipe-modal-content">
              <button 
                onClick={closeRecipeFormModal} 
                className="modal-close-btn"
                aria-label="Close modal"
                type="button"
              >
                &times;
              </button>
              

              <h2 className="modal-title">{isEditingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</h2>
              

              <form onSubmit={handleFormSubmit} className="add-recipe-modal-form">
                {/* Title field */}
                <div className="form-group">
                  <label htmlFor="title">Recipe Title</label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title" 
                    value={currentRecipeFormData.title} 
                    onChange={handleInputChange} 
                    className="modal-input"
                    required
                  />
                  {formErrors.title && <div className="error-message">{formErrors.title}</div>}
                </div>
                
                {/* Description field */}
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description" 
                    name="description" 
                    value={currentRecipeFormData.description} 
                    onChange={handleInputChange} 
                    className="modal-textarea"
                    rows={3}
                  />
                </div>
                
                {/* Category field */}
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select 
                    id="category" 
                    name="category" 
                    value={currentRecipeFormData.category} 
                    onChange={handleInputChange}
                    className="modal-input"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {formErrors.category && <div className="error-message">{formErrors.category}</div>}
                </div>
                
                {/* Yield field */}
                <div className="form-group">
                  <label htmlFor="yield_amount">Yield</label>
                  <input 
                    type="text" 
                    id="yield_amount" 
                    name="yield_amount" 
                    value={currentRecipeFormData.yield_amount} 
                    onChange={handleInputChange} 
                    className="modal-input"
                    placeholder="e.g., 4 servings"
                  />
                </div>
                
                {/* Image upload field - fixed */}
                <div className="form-group">
                  <label htmlFor="recipeImageUpload">Recipe Image</label>
                  <input 
                    type="file" 
                    id="recipeImageUpload" 
                    name="imageFile" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="modal-input-file-hidden"
                  />
                  <button 
                    type="button" 
                    className="btn-upload-image"
                    onClick={handleImageUploadButtonClick}
                  >
                    {imagePreviewUrl ? 'Change Image' : 'Upload Image'}
                  </button>
                  
                  {imagePreviewUrl && (
                    <div className="image-preview-container">
                      <img 
                        src={imagePreviewUrl} 
                        alt="Recipe preview" 
                        className="image-preview" 
                      />
                    </div>
                  )}
                  
                  {formErrors.imageFile && <div className="error-message">{formErrors.imageFile}</div>}
                </div>
                
                {/* Video upload field - fixed */}
                <div className="form-group">
                  <label htmlFor="recipeVideoUpload">Recipe Video (optional)</label>
                  <input 
                    type="file" 
                    id="recipeVideoUpload" 
                    name="videoFile" 
                    accept="video/*" 
                    onChange={handleVideoChange} 
                    className="modal-input-file-hidden"
                  />
                  <button 
                    type="button" 
                    className="btn-upload-image"
                    onClick={handleVideoUploadButtonClick}
                  >
                    {currentRecipeFormData.videoFile ? 'Change Video' : 'Upload Video'}
                  </button>
                  
                  {currentRecipeFormData.videoFile && (
                    <div className="file-info">
                      Selected video: {currentRecipeFormData.videoFile.name}
                    </div>
                  )}
                  
                  {formErrors.videoFile && <div className="error-message">{formErrors.videoFile}</div>}
                </div>
                
                {/* Ingredients section */}
                <fieldset>
                  <legend>Ingredients</legend>
                  <div className="form-group">
                    {currentRecipeFormData.ingredients.map((ingredient, index) => (
                      <div key={index} className="dynamic-field-row">
                        <input 
                          type="text" 
                          value={ingredient} 
                          onChange={(e) => handleRecipeArrayChange('ingredients', index, e.target.value)} 
                          className="modal-input dynamic-input"
                          placeholder={`Ingredient ${index + 1}`}
                        />
                        
                        {currentRecipeFormData.ingredients.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => deleteRecipeArrayField('ingredients', index)}
                            className="btn-delete-field"
                            aria-label="Delete ingredient"
                          >×</button>
                        )}
                      </div>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={() => addRecipeArrayField('ingredients')}
                      className="btn-add-field"
                    >
                      + Add Ingredient
                    </button>
                    
                    {formErrors.ingredients && <div className="error-message">{formErrors.ingredients}</div>}
                  </div>
                </fieldset>
                
                {/* Instructions section with photo uploads */}
                <fieldset>
                  <legend>Instructions</legend>
                  <div className="form-group">
                    {currentRecipeFormData.instructions.map((instruction, index) => (
                      <div key={index} className="instruction-row">
                        <div className="instruction-content">
                          <div className="step-number">{index + 1}</div>
                          <textarea 
                            value={instruction} 
                            onChange={(e) => handleRecipeArrayChange('instructions', index, e.target.value)} 
                            className="modal-textarea dynamic-textarea" 
                            placeholder={`Step ${index + 1} instructions`}
                            rows={2}
                          />
                          {currentRecipeFormData.instructions.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => deleteRecipeArrayField('instructions', index)}
                              className="btn-delete-field"
                              aria-label="Delete instruction"
                            >×</button>
                          )}
                        </div>
                        
                        <div className="instruction-photo">
                          <label className="photo-upload-label">
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/gif, image/webp"
                              onChange={(e) => handleDirectionPhotoChange(index, e)}
                              className="direction-photo-input"
                            />
                            {currentRecipeFormData.directionPhotos[index] ? (
                              <div className="photo-preview">
                                <img
                                  src={URL.createObjectURL(currentRecipeFormData.directionPhotos[index] as File)}
                                  alt={`Step ${index + 1} preview`} // Fix step.step_number reference
                                  className="direction-photo-preview"
                                />
                                <span className="photo-preview-text">Change photo</span>
                              </div>
                            ) : (
                              <div className="photo-upload-button">
                                <span>+ Upload step photo</span>
                              </div>
                            )}
                          </label>
                          {directionPhotoErrors[index] && (
                            <p className="error-message photo-error">{directionPhotoErrors[index]}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={() => addRecipeArrayField('instructions')}
                      className="btn-add-field"
                    >
                      + Add Step
                    </button>
                    
                    {formErrors.instructions && <div className="error-message">{formErrors.instructions}</div>}
                  </div>
                </fieldset>
                
                {/* Time and servings info */}
                <fieldset>
                  <legend>Time & Servings</legend>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="prepTime">Preparation Time</label>
                      <input 
                        type="text" 
                        id="prepTime" 
                        name="prepTime" 
                        value={currentRecipeFormData.prepTime} 
                        onChange={handleInputChange} 
                        className="modal-input"
                        placeholder="e.g., 15 mins"
                      />
                      {formErrors.prepTime && <div className="error-message">{formErrors.prepTime}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="cookTime">Cooking Time</label>
                      <input 
                        type="text" 
                        id="cookTime" 
                        name="cookTime" 
                        value={currentRecipeFormData.cookTime} 
                        onChange={handleInputChange} 
                        className="modal-input"
                        placeholder="e.g., 30 mins"
                      />
                      {formErrors.cookTime && <div className="error-message">{formErrors.cookTime}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="totalTime">Total Time</label>
                      <input 
                        type="text" 
                        id="totalTime" 
                        name="totalTime" 
                        value={currentRecipeFormData.totalTime} 
                        onChange={handleInputChange} 
                        className="modal-input"
                        placeholder="e.g., 45 mins"
                        readOnly
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="servings">Servings</label>
                      <input 
                        type="number" 
                        id="servings" 
                        name="servings" 
                        value={currentRecipeFormData.servings === '' ? '' : currentRecipeFormData.servings} 
                        onChange={handleInputChange} 
                        className="modal-input"
                        min="1"
                        placeholder="e.g., 4"
                      />
                      {formErrors.servings && <div className="error-message">{formErrors.servings}</div>}
                    </div>
                  </div>
                </fieldset>
                
                {/* Nutrition fields - FIXED with proper handler */}
                <fieldset>
                  <legend>Nutrition Information</legend>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="total_calories">Total Calories</label>
                      <input 
                        type="number" 
                        id="total_calories" 
                        name="total_calories" 
                        value={currentRecipeFormData.nutrition?.total_calories || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="fat">Fat (g)</label>
                      <input 
                        type="number" 
                        id="fat" 
                        name="fat" 
                        value={currentRecipeFormData.nutrition?.fat || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="saturated_fat">Saturated Fat (g)</label>
                      <input 
                        type="number" 
                        id="saturated_fat" 
                        name="saturated_fat" 
                        value={currentRecipeFormData.nutrition?.saturated_fat || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="cholesterol">Cholesterol (mg)</label>
                      <input 
                        type="number" 
                        id="cholesterol" 
                        name="cholesterol" 
                        value={currentRecipeFormData.nutrition?.cholesterol || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="sodium">Sodium (mg)</label>
                      <input 
                        type="number" 
                        id="sodium" 
                        name="sodium" 
                        value={currentRecipeFormData.nutrition?.sodium || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="carbohydrates">Carbohydrates (g)</label>
                      <input 
                        type="number" 
                        id="carbohydrates" 
                        name="carbohydrates" 
                        value={currentRecipeFormData.nutrition?.carbohydrates || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="fiber">Fiber (g)</label>
                      <input 
                        type="number" 
                        id="fiber" 
                        name="fiber" 
                        value={currentRecipeFormData.nutrition?.fiber || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="sugar">Sugar (g)</label>
                      <input 
                        type="number" 
                        id="sugar" 
                        name="sugar" 
                        value={currentRecipeFormData.nutrition?.sugar || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="protein">Protein (g)</label>
                      <input 
                        type="number" 
                        id="protein" 
                        name="protein" 
                        value={currentRecipeFormData.nutrition?.protein || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="vitamin_c">Vitamin C (mg)</label>
                      <input 
                        type="number" 
                        id="vitamin_c" 
                        name="vitamin_c" 
                        value={currentRecipeFormData.nutrition?.vitamin_c || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="calcium">Calcium (mg)</label>
                      <input 
                        type="number" 
                        id="calcium" 
                        name="calcium" 
                        value={currentRecipeFormData.nutrition?.calcium || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="iron">Iron (mg)</label>
                      <input 
                        type="number" 
                        id="iron" 
                        name="iron" 
                        value={currentRecipeFormData.nutrition?.iron || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="potassium">Potassium (mg)</label>
                      <input 
                        type="number" 
                        id="potassium" 
                        name="potassium" 
                        value={currentRecipeFormData.nutrition?.potassium || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="magnesium">Magnesium (mg)</label>
                      <input 
                        type="number" 
                        id="magnesium" 
                        name="magnesium" 
                        value={currentRecipeFormData.nutrition?.magnesium || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="vitamin_a">Vitamin A (IU)</label>
                      <input 
                        type="number" 
                        id="vitamin_a" 
                        name="vitamin_a" 
                        value={currentRecipeFormData.nutrition?.vitamin_a || 0} 
                        onChange={handleNutritionChange} 
                        className="modal-input"
                        min="0"
                        step="any"
                      />
                    </div>
                  </div>
                </fieldset>
                
                {/* General error display */}
                {formErrors.general && (
                  <div className="general-error">{formErrors.general}</div>
                )}
                
                {/* Form buttons */}
                <div className="modal-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Recipe'}
                  </button>
                  <button 
                    type="button"
                    onClick={closeRecipeFormModal} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDetailModal && detailRecipe && (
          <div className="modal-overlay active">
            <div className="modal-content recipe-detail-modal">
              <div className="recipe-detail-container">
                {/* Recipe Header */}
                <div className="recipe-detail-header">
                  <h2 className="recipe-detail-title">{detailRecipe.title}</h2>
                  <div className="recipe-meta-info">
                    <span className="recipe-category-badge">
                      {typeof detailRecipe.category === 'object' && detailRecipe.category !== null 
                        ? detailRecipe.category.name 
                        : detailRecipe.category || "Uncategorized"}
                    </span>
                    <span className="recipe-date">
                      {new Date(detailRecipe.upload_date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Main Content Section */}
                <div className="recipe-detail-content">
                  {/* Left Column - Main Recipe Content */}
                  <div className="recipe-detail-main">
                    {/* Recipe Image */}
                    {detailRecipe.recipe_image && (
                      <div className="recipe-detail-image-container">
                        <div className="w-full max-w-md mx-auto overflow-hidden rounded-lg">
                          <img 
                            src={detailRecipe.recipe_image} 
                            alt={detailRecipe.title} 
                            className="w-full h-64 object-cover" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Recipe Video Section */}
                    {detailRecipe.preparations && 
                     detailRecipe.preparations.length > 0 && 
                     detailRecipe.preparations[0].recipe_video && (
                      <div className="recipe-detail-section recipe-video-section" style={{ margin: '2rem 0' }}>
                        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', fontSize: '1.6rem', color: '#333' }}>
                          <span className="section-icon" style={{ marginRight: '0.5rem', fontSize: '1.5rem' }}>🎬</span>
                          Recipe Video
                        </h3>
                        <div style={{ 
                          width: '100%', 
                          borderRadius: '12px', 
                          overflow: 'hidden', 
                          boxShadow: '0 8px 24px rgba(0, 0, 0,  0.15)', 
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
                            poster={detailRecipe.recipe_image || undefined}
                            preload="metadata"
                            controlsList="nodownload"
                          >
                            <source src={detailRecipe.preparations[0].recipe_video} type="video/mp4" />
                            <source src={detailRecipe.preparations[0].recipe_video} type="video/webm" />
                            <source src={detailRecipe.preparations[0].recipe_video} type="video/ogg" />
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
                    )}

                    {/* Key Info Cards */}
                    <div className="recipe-info-cards">
                      <div className="info-card">
                        <div className="info-card-icon">⏱️</div>
                        <div className="info-card-content">
                          <h4>Prep Time</h4>
                          <p>{detailRecipe.preparations[0]?.prep_time || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="info-card">
                        <div className="info-card-icon">🍳</div>
                        <div className="info-card-content">
                          <h4>Cook Time</h4>
                          <p>{detailRecipe.preparations[0]?.cook_time || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="info-card">
                        <div className="info-card-icon">⌛</div>
                        <div className="info-card-content">
                          <h4>Total Time</h4>
                          <p>{detailRecipe.preparations[0]?.total_time || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="info-card">
                        <div className="info-card-icon">👥</div>
                        <div className="info-card-content">
                          <h4>Servings</h4>
                          <p>{detailRecipe.yield_amount || detailRecipe.preparations[0]?.serving || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Recipe Description */}
                    <div className="recipe-detail-section recipe-description">
                      <h3 className="section-title">
                        <span className="section-icon">📄</span>
                        Description
                      </h3>
                      <p>{detailRecipe.description || "No description provided."}</p>
                    </div>

                    {/* Ingredients Section */}
                    <div className="recipe-detail-section">
                      <h3 className="section-title">
                        <span className="section-icon">🧂</span>
                        Ingredients
                      </h3>
                      {detailRecipe.ingredients ? (
                        <ul className="ingredients-list">
                          {typeof detailRecipe.ingredients === 'string' ? 
                            detailRecipe.ingredients.split(',').map((ingredient: string, idx: number) => (
                              <li key={idx} className="ingredient-item">
                                <span className="ingredient-bullet"></span>
                                {ingredient.trim()}
                              </li>
                            )) : 
                            <li className="ingredient-item">No ingredients listed</li>
                          }
                        </ul>
                      ) : (
                        <p className="empty-message">No ingredients listed</p>
                      )}
                    </div>

                    {/* Directions Section */}
                    <div className="recipe-detail-section">
                      <h3 className="section-title">
                        <span className="section-icon">📝</span>
                        Directions
                      </h3>
                      {detailRecipe.directions && detailRecipe.directions.length > 0 ? (
                        <ol className="directions-list">
                          {detailRecipe.directions.map((step: any) => (
                            <li key={step.step_number} className="direction-step">
                              <div className="step-number-badge">{step.step_number}</div>
                              <div className="direction-content">
                                <p>{step.direction}</p>
                                {step.direction_photo && (
                                  <div className="direction-photo-container">
                                    <img 
                                      src={step.direction_photo} 
                                      alt={`Step ${step.step_number}`}
                                      className="direction-photo" 
                                      loading="lazy"
                                    />
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="empty-message">No instructions provided</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Sidebar with Nutrition */}
                  <div className="recipe-detail-sidebar">
                    <div className="sidebar-section nutrition-facts">
                      <h3 className="section-title">
                        <span className="section-icon">🍎</span>
                        Nutrition Facts
                      </h3>
                      
                      {detailRecipe.nutrition && detailRecipe.nutrition.length > 0 ? (
                        <div className="nutrition-container">
                          <div className="nutrition-header">
                            <h4>Per Serving</h4>
                            <p className="calories-large">
                              {detailRecipe.nutrition[0].total_calories} 
                              <span className="unit">cal</span>
                            </p>
                          </div>
                          
                          <div className="nutrition-grid">
                            <div className="nutrition-item">
                              <span className="nutrient-name">Protein</span>
                              <span className="nutrient-value">{detailRecipe.nutrition[0].protein}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrient-name">Carbs</span>
                              <span className="nutrient-value">{detailRecipe.nutrition[0].carbohydrates}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrient-name">Fat</span>
                              <span className="nutrient-value">{detailRecipe.nutrition[0].fat}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrient-name">Fiber</span>
                              <span className="nutrient-value">{detailRecipe.nutrition[0].fiber}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrient-name">Sugar</span>
                              <span className="nutrient-value">{detailRecipe.nutrition[0].sugar}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrient-name">Sodium</span>
                              <span className="nutrient-value">{detailRecipe.nutrition[0].sodium}mg</span>
                            </div>
                          </div>

                          <div className="nutrition-details-toggle">
                            <details>
                              <summary>More Nutrition Details</summary>
                              <div className="nutrition-details-content">
                                <div className="nutrition-item">
                                  <span className="nutrient-name">Saturated Fat</span>
                                  <span className="nutrient-value">{detailRecipe.nutrition[0].saturated_fat}g</span>
                                </div>
                                <div className="nutrition-item">
                                  <span className="nutrient-name">Cholesterol</span>
                                  <span className="nutrient-value">{detailRecipe.nutrition[0].cholesterol}mg</span>
                                </div>
                                <div className="nutrition-item">
                                  <span className="nutrient-name">Vitamin C</span>
                                  <span className="nutrient-value">{detailRecipe.nutrition[0].vitamin_c}mg</span>
                                </div>
                                <div className="nutrition-item">
                                  <span className="nutrient-name">Calcium</span>
                                  <span className="nutrient-value">{detailRecipe.nutrition[0].calcium}mg</span>
                                </div>
                                <div className="nutrition-item">
                                  <span className="nutrient-name">Iron</span>
                                  <span className="nutrient-value">{detailRecipe.nutrition[0].iron}mg</span>
                                </div>
                                <div className="nutrition-item">
                                  <span className="nutrient-name">Potassium</span>
                                  <span className="nutrient-value">{detailRecipe.nutrition[0].potassium}mg</span>
                                </div>
                                <div className="nutrition-item">
                                  <span className="nutrient-name">Magnesium</span>
                                  <span className="nutrient-value">{detailRecipe.nutrition[0].magnesium}mg</span>
                                </div>
                                <div className="nutrition-item">
                                  <span className="nutrient-name">Vitamin A</span>
                                  <span className="nutrient-value">{detailRecipe.nutrition[0].vitamin_a}IU</span>
                                </div>
                              </div>
                            </details>
                          </div>
                        </div>
                      ) : (
                        <p className="empty-message">No nutrition information available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close Button at Bottom */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '2rem 0 1rem 0',
                  borderTop: '1px solid #eee',
                  marginTop: '2rem'
                }}>
                  <button 
                    onClick={closeDetailModal} 
                    aria-label="Close modal"
                    type="button"
                    style={{
                      backgroundColor: '#ff1493',
                      color: 'white',
                      border: 'none',
                      padding: '12px 32px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      boxShadow: '0 4px 12px rgba(255,20,147,0.3)',
                      transition: 'all 0.3s ease',
                      minWidth: '120px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e6127a';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,20,147,0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff1493';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,20,147,0.3)';
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailError && !detailLoading && (
          <div className="modal-overlay active">
            <div className="modal-content recipe-detail-modal">
              <button 
                onClick={closeDetailModal} 
                className="modal-close-btn"
                aria-label="Close modal"
                type="button"
              >
                &times;
              </button>
              <div className="recipe-error">
                <div className="error-icon">⚠️</div>
                <h2>Recipe Not Found</h2>
                <p>{detailError}</p>
                <button 
                  onClick={closeDetailModal}
                  className="action-button"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Approval Modal */}
        {showApprovalModal && (
          <div className="modal-overlay active">
            <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }}>
              <div style={{ padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
                <h2 style={{ 
                  color: '#333', 
                  marginBottom: '1rem',
                  fontSize: '1.5rem'
                }}>
                  Recipe Submitted Successfully!
                </h2>
                <p style={{ 
                  color: '#666', 
                  lineHeight: '1.6',
                  marginBottom: '2rem',
                  fontSize: '1rem'
                }}>
                  {approvalMessage}
                </p>
                <button 
                  onClick={closeApprovalModal}
                  style={{
                    backgroundColor: '#ff1493',
                    color: 'white',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    boxShadow: '0 4px 12px rgba(255,20,147,0.3)',
                    transition: 'all 0.3s ease',
                    minWidth: '120px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6127a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,20,147,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff1493';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,20,147,0.3)';
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AddRecipePage;
