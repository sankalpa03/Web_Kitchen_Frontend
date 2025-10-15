import React from 'react';
import '../../css/profile.css';
import '../../css/saved.css';
import { Link } from 'react-router-dom'; 

function SavedRecipes() {
  return (
    <div className="saved-recipes-container">
       
      <h1 className="title">My Saved Recipes & Collections</h1>

      <div className="illustration-container">
        <img 
          src="https://img.freepik.com/free-photo/top-view-delicious-cooked-vegetables-sliced-with-different-seasonings-dark-background-soup-food-sauce-meal-vegetable_140725-85838.jpg" // Replace with the actual path to your image
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
    </div>
  );
}

export default SavedRecipes;