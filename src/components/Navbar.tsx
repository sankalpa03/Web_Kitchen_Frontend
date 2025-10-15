import { useState, useEffect, ComponentType, MouseEvent } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChefHat,
  User,
  Bookmark,
  PlusCircle,
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
  LucideIcon
} from 'lucide-react';

// Define interfaces for component props
interface NavIconProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface MobileNavLinkProps {
  to: string;
  label: string;
  onClick: () => void;
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('accessToken'));
  }, [location]);

  const handleLogout = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/user/logout/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      // Optionally handle error
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-pink-600" />
            <span className="text-xl font-bold text-pink-600">Web Kitchen</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <NavIcon to="/user/ingredientSearch" icon={UtensilsCrossed} label="Search by Ingredients" />
                <NavIcon to="/user/addrecipe" icon={PlusCircle} label="Add Recipe" />
                <NavIcon to="/user/savedpage" icon={Bookmark} label="Saved Recipes" />
                <NavIcon to="/user/profile" icon={User} label="Profile" />
                <div className="relative group flex flex-col items-center cursor-pointer">
                  <button onClick={handleLogout} className="text-gray-600 hover:text-pink-600">
                    <LogOut className="h-6 w-6" />
                  </button>
                  <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs text-white bg-pink-600 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Logout
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link to="/signin" className="text-gray-600 hover:text-pink-600 font-medium">Sign In</Link>
                <Link to="/register" className="text-gray-600 hover:text-pink-600 font-medium">Register</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-gray-600 hover:text-pink-600">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden px-4 py-3 space-y-2 bg-gray-50">
          {isAuthenticated ? (
            <>
              <MobileNavLink to="/user/ingredientSearch" label="Search by Ingredients" onClick={toggleMenu} />
              <MobileNavLink to="/user/addrecipe" label="Add Recipe" onClick={toggleMenu} />
              <MobileNavLink to="/user/savedpage" label="Saved Recipes" onClick={toggleMenu} />
              <MobileNavLink to="/user/profile" label="Profile" onClick={toggleMenu} />
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <MobileNavLink to="/signin" label="Sign In" onClick={toggleMenu} />
              <MobileNavLink to="/register" label="Register" onClick={toggleMenu} />
            </>
          )}
        </div>
      )}
    </nav>
  );
};

const NavIcon = ({ to, icon: Icon, label }: NavIconProps) => (
  <div className="relative group flex flex-col items-center">
    <Link to={to} className="text-gray-600 hover:text-pink-600">
      <Icon className="h-6 w-6" />
    </Link>
    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs text-white bg-pink-600 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
      {label}
    </span>
  </div>
);

const MobileNavLink = ({ to, label, onClick }: MobileNavLinkProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200"
  >
    {label}
  </NavLink>
);

export default Navbar;
