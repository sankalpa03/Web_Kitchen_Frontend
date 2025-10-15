import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

// Define a type for the recipe search result data
interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  user: string;
  recipe_image: string;
}

// Define a more comprehensive type for recipe detail response
interface RecipeDetail {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string } | string;
  user: string;
  yield_amount: string;
  ingredients: string;
  recipe_image: string;
  preparations: Array<{
    prep_time: string;
    cook_time: string;
    total_time: string;
    serving: number;
    recipe_video?: string;
  }>;
  directions: Array<{
    step_number: number;
    direction: string;
    direction_photo?: string;
  }>;
  nutrition: Array<{
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
  }>;
  upload_date: string;
}

const AIRecipeSearch = () => {
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailRecipe, setDetailRecipe] = useState<RecipeDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();

  // Function to fetch recipe details
  const fetchRecipeDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const headers: HeadersInit = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`http://127.0.0.1:8000/recipe/detail/${id}/`, {
        headers,
      });

      if (!res.ok) {
        throw new Error("Failed to fetch recipe details");
      }

      const data = await res.json();
      setDetailRecipe(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching recipe details:", err);
      setError("Failed to load recipe details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailRecipe(null);
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setRecipes([]);
    try {
      // Updated API endpoint to match the correct one
      const res = await fetch(
        `http://127.0.0.1:8000/recipes/searchbyingredients/?q=${encodeURIComponent(
          ingredients
        )}`
      );
      if (!res.ok) {
        setError("Failed to fetch recipes.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRecipes(data);
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  };

  // Get category name regardless of whether it's a string or object
  const getCategoryName = (
    category: string | { id: string; name: string }
  ) => {
    if (typeof category === "string") {
      return category;
    }
    return category.name;
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-pink-600 text-center">
        AI Recipe Search
      </h1>
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <input
          type="text"
          placeholder="Enter ingredients (comma separated)..."
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          className="flex-1 border border-pink-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button
          type="submit"
          className="bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-pink-700 transition"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
      {recipes.length === 0 && !loading && !error && (
        <div className="text-gray-400 text-center">
          No recipes found. Try different ingredients.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white rounded-xl shadow p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => fetchRecipeDetail(recipe.id)}
          >
            <img
              src={
                recipe.recipe_image ||
                "https://placehold.co/400x250?text=No+Image"
              }
              alt={recipe.title}
              className="w-full h-40 object-cover rounded mb-3"
            />
            <h2 className="text-xl font-bold text-pink-700 mb-1">
              {recipe.title}
            </h2>
            <p className="text-gray-600 text-sm mb-2">{recipe.description}</p>
            <div className="flex justify-between items-center mt-auto">
              <span className="text-xs text-pink-500 font-semibold">
                {recipe.category}
              </span>
              <span className="text-xs text-gray-500">By: {recipe.user}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      {showDetailModal && detailRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-pink-700">
                  {detailRecipe.title}
                </h2>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-500 hover:text-gray-800 text-xl"
                >
                  ×
                </button>
              </div>

              {detailRecipe.recipe_image && (
                <img
                  src={detailRecipe.recipe_image}
                  alt={detailRecipe.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {getCategoryName(detailRecipe.category)}
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  By: {detailRecipe.user}
                </span>
                {detailRecipe.yield_amount && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Yield: {detailRecipe.yield_amount}
                  </span>
                )}
                {detailRecipe.upload_date && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {new Date(detailRecipe.upload_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {detailRecipe.description && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{detailRecipe.description}</p>
                </div>
              )}

              {detailRecipe.preparations && detailRecipe.preparations.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Preparation</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {detailRecipe.preparations[0].prep_time && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Prep Time</p>
                        <p className="font-medium">
                          {detailRecipe.preparations[0].prep_time}
                        </p>
                      </div>
                    )}
                    {detailRecipe.preparations[0].cook_time && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Cook Time</p>
                        <p className="font-medium">
                          {detailRecipe.preparations[0].cook_time}
                        </p>
                      </div>
                    )}
                    {detailRecipe.preparations[0].total_time && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Total Time</p>
                        <p className="font-medium">
                          {detailRecipe.preparations[0].total_time}
                        </p>
                      </div>
                    )}
                    {detailRecipe.preparations[0].serving && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Servings</p>
                        <p className="font-medium">
                          {detailRecipe.preparations[0].serving}
                        </p>
                      </div>
                    )}
                  </div>

                  {detailRecipe.preparations[0].recipe_video && (
                    <div className="mt-4">
                      <video
                        controls
                        className="w-full rounded"
                        src={detailRecipe.preparations[0].recipe_video}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailRecipe.ingredients && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {typeof detailRecipe.ingredients === "string"
                        ? detailRecipe.ingredients.split(",").map((ingredient, idx) => (
                            <li key={idx} className="text-gray-600">
                              {ingredient.trim()}
                            </li>
                          ))
                        : null}
                    </ul>
                  </div>
                )}

                {detailRecipe.nutrition && detailRecipe.nutrition.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Nutrition</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {detailRecipe.nutrition[0].total_calories !== undefined && (
                        <div className="text-sm">
                          Calories:{" "}
                          <span className="font-medium">
                            {detailRecipe.nutrition[0].total_calories}
                          </span>
                        </div>
                      )}
                      {detailRecipe.nutrition[0].fat !== undefined && (
                        <div className="text-sm">
                          Fat:{" "}
                          <span className="font-medium">
                            {detailRecipe.nutrition[0].fat}g
                          </span>
                        </div>
                      )}
                      {detailRecipe.nutrition[0].protein !== undefined && (
                        <div className="text-sm">
                          Protein:{" "}
                          <span className="font-medium">
                            {detailRecipe.nutrition[0].protein}g
                          </span>
                        </div>
                      )}
                      {detailRecipe.nutrition[0].carbohydrates !== undefined && (
                        <div className="text-sm">
                          Carbs:{" "}
                          <span className="font-medium">
                            {detailRecipe.nutrition[0].carbohydrates}g
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {detailRecipe.directions && detailRecipe.directions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Directions</h3>
                  <ol className="list-decimal pl-5 space-y-3">
                    {detailRecipe.directions.map((step) => (
                      <li key={step.step_number} className="text-gray-600">
                        <p>{step.direction}</p>
                        {step.direction_photo && (
                          <img
                            src={step.direction_photo}
                            alt={`Step ${step.step_number}`}
                            className="mt-2 rounded-md w-full max-w-sm"
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={closeDetailModal}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium shadow hover:bg-pink-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for detail fetching */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="text-center mt-4">Loading recipe details...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecipeSearch;
