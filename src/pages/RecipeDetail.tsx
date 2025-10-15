import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:8000/recipe/detail/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch recipe');
        return res.json();
      })
      .then((data) => {
        setRecipe(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="text-center py-10 text-pink-600 font-semibold">Loading...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }
  if (!recipe) {
    return <div className="text-center py-10 text-gray-400">Recipe not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <Link to="/" className="text-pink-600 hover:underline mb-4 inline-block">&larr; Back to Recipes</Link>
        <h1 className="text-3xl font-bold text-pink-700 mb-2">{recipe.title}</h1>
        <div className="mb-2 text-gray-500 text-sm">
          <span className="mr-2">By: {recipe.user}</span>
          <span className="mr-2">| Category: {recipe.category?.name}</span>
          <span className="mr-2">| Yield: {recipe.yield_amount}</span>
        </div>
        <div className="mb-4 text-gray-600">{recipe.description}</div>
        {recipe.recipe_image && (
          <img
            src={recipe.recipe_image}
            alt={recipe.title}
            className="w-full h-64 object-cover rounded-xl mb-6 border border-pink-100 shadow"
          />
        )}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-pink-600 mb-1">Ingredients</h2>
          <ul className="list-disc list-inside text-gray-700">
            {recipe.ingredients.split(',').map((ing: string, idx: number) => (
              <li key={idx}>{ing.trim()}</li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-pink-600 mb-1">Preparation</h2>
          {recipe.preparations && recipe.preparations.length > 0 && (
            <ul className="list-disc list-inside text-gray-700">
              <li>Prep time: {recipe.preparations[0].prep_time}</li>
              <li>Cook time: {recipe.preparations[0].cook_time}</li>
              <li>Total time: {recipe.preparations[0].total_time}</li>
              <li>Serving: {recipe.preparations[0].serving}</li>
            </ul>
          )}
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-pink-600 mb-1">Directions</h2>
          <ol className="list-decimal list-inside text-gray-700">
            {recipe.directions.map((step: any) => (
              <li key={step.step_number}>{step.direction}</li>
            ))}
          </ol>
        </div>
        {recipe.nutrition && recipe.nutrition.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-pink-600 mb-1">Nutrition</h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Calories: {recipe.nutrition[0].total_calories}</li>
              <li>Fat: {recipe.nutrition[0].fat}g</li>
              <li>Saturated Fat: {recipe.nutrition[0].saturated_fat}g</li>
              <li>Cholesterol: {recipe.nutrition[0].cholesterol}mg</li>
              <li>Sodium: {recipe.nutrition[0].sodium}mg</li>
              <li>Carbohydrates: {recipe.nutrition[0].carbohydrates}g</li>
              <li>Fiber: {recipe.nutrition[0].fiber}g</li>
              <li>Sugar: {recipe.nutrition[0].sugar}g</li>
              <li>Protein: {recipe.nutrition[0].protein}g</li>
              {/* ...add more nutrition fields as needed... */}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;
