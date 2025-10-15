import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";

// Layout and Utility Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Page Components
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import Home from './pages/Home';
import IngredientSearch  from './pages/IngredientSearch'; 
import RecipeDetail from './pages/RecipeDetail'; // Added import for RecipeDetail

// User Specific Pages
import UserProfile from './pages/user/Profile';
import UserAddRecipe from './pages/user/AddRecipe';

import UserSavedRecipes from './pages/user/savedPage'; 

// Admin Specific Pages
import AdminProfile from './pages/admin/profile'; 
import AdminAddRecipe from './pages/admin/addrecipe';
// Assuming filename is PublicPageq
import AdminSavedRecipes from './pages/admin/savedpage'; 
// Assuming filename is SavedPage
import AdminUserManagement from './pages/admin/Usermanagement'; 
import AdminVideoManagement from './pages/admin/VideoManagement'; 

// Placeholder for a 404 Not Found page component
const NotFound = () => (
  <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
    <h2>404 - Page Not Found</h2>
    <p>Sorry, the page you are looking for does not exist.</p>
  </div>
);

// MainLayout Component: Renders Navbar and child routes via <Outlet />
const MainLayout = () => {
  return (
    <>
      <Navbar />
      {/* Adjust pt-XX based on your Navbar's height */}
      <main className="pt-16 md:pt-20 lg:pt-24 p-4"> {/* Added padding for content area */}
        <Outlet />
      </main>
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-pink-50"> {/* Assuming bg-pink-50 is defined in your Tailwind config or CSS */}
        <Routes>
          {/* Public routes: No Navbar from MainLayout here */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} /> {/* Added route for RecipeDetail */}

          {/* Protected Routes with MainLayout (includes Navbar) */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            
            {/* User Routes */}
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/addrecipe" element={<UserAddRecipe />} />
            
            <Route path="/user/savedpage" element={<UserSavedRecipes />} /> 
            <Route path="/user/ingredientSearch" element={<IngredientSearch />} />
            {/* Admin Routes */}
            {/* For admin routes, you might want an additional AdminProtectedRoute 
                if admin access is determined by more than just being logged in (e.g., a user role)
                For now, using the general ProtectedRoute.
            */}
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/addrecipe" element={<AdminAddRecipe />} />
            
            <Route path="/admin/savedpage" element={<AdminSavedRecipes />} />
            <Route path="/admin/usermanagement" element={<AdminUserManagement />} />
            <Route path="/admin/videomanagement" element={<AdminVideoManagement />} />
          </Route>

          {/* Catch-all 404 Not Found route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;