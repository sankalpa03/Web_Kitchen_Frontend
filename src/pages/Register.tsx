import React, { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChefHat, Eye, EyeOff } from "lucide-react";

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  username: string;
  address: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    username: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email: string): boolean =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const isValidName = (name: string): boolean => name.trim().length > 2;

  const isValidPhoneNumber = (phone: string): boolean => /^\d{10}$/.test(phone.trim());

  // Enhanced password validation (returns all errors)
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter.");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter.");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number.");
    }
    // Check for common passwords (Django's common password list subset)
    const commonPasswords = [
      'password', '123456789', '12345678', 'password1', 'password123',
      'admin', 'qwerty', 'letmein', 'welcome', 'monkey', '1234567890',
      'abc123', '123456', 'admin123', 'root', 'pass', 'test', 'guest',
      'hello', 'login', 'changeme', 'newpassword', 'secret', 'administrator'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("This password is too common. Please choose a more secure password.");
    }
    return errors;
  };

  // Enhanced username validation
  const validateUsername = (username: string, email: string, firstName: string, lastName: string): { isValid: boolean; message: string } => {
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3) {
      return { isValid: false, message: "Username must be at least 3 characters long." };
    }
    
    if (trimmedUsername.length > 150) {
      return { isValid: false, message: "Username must be 150 characters or fewer." };
    }
    
    // Check for valid characters (Django's default: letters, digits, @/./+/-/_ only)
    if (!/^[a-zA-Z0-9@.+_-]+$/.test(trimmedUsername)) {
      return { isValid: false, message: "Username may only contain letters, numbers, and @/./+/-/_ characters." };
    }
    
    // Check if username is too similar to email
    const emailLocalPart = email.split('@')[0].toLowerCase();
    if (emailLocalPart && trimmedUsername.toLowerCase() === emailLocalPart) {
      return { isValid: false, message: "Username is too similar to your email address." };
    }
    
    // Check if username is too similar to first/last name
    if (trimmedUsername.toLowerCase() === firstName.toLowerCase() || 
        trimmedUsername.toLowerCase() === lastName.toLowerCase()) {
      return { isValid: false, message: "Username is too similar to your personal information." };
    }
    
    // Check if username contains personal info
    if (firstName.length > 2 && trimmedUsername.toLowerCase().includes(firstName.toLowerCase())) {
      return { isValid: false, message: "Username should not contain your first name." };
    }
    
    if (lastName.length > 2 && trimmedUsername.toLowerCase().includes(lastName.toLowerCase())) {
      return { isValid: false, message: "Username should not contain your last name." };
    }
    
    // Check for common usernames
    const commonUsernames = [
      'admin', 'administrator', 'root', 'user', 'test', 'guest', 'demo',
      'anonymous', 'null', 'undefined', 'username', 'password', 'login',
      'register', 'signup', 'signin', 'auth', 'api', 'www', 'mail', 'email'
    ];
    
    if (commonUsernames.includes(trimmedUsername.toLowerCase())) {
      return { isValid: false, message: "This username is not allowed. Please choose a different one." };
    }
    
    return { isValid: true, message: "" };
  };

  // Enhanced email validation
  const validateEmail = (email: string): { isValid: boolean; message: string } => {
    if (!email.trim()) {
      return { isValid: false, message: "Email is required." };
    }
    
    if (!isValidEmail(email)) {
      return { isValid: false, message: "Please enter a valid email address." };
    }
    
    if (email.length > 254) {
      return { isValid: false, message: "Email address is too long." };
    }
    
    return { isValid: true, message: "" };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setErrors([]);

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      confirmPassword,
      username,
      address,
    } = formData;

    const validationErrors: string[] = [];

    // Validate names
    if (!isValidName(firstName)) {
      validationErrors.push("First name must be at least 3 characters long.");
    }
    if (!isValidName(lastName)) {
      validationErrors.push("Last name must be at least 3 characters long.");
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      validationErrors.push(emailValidation.message);
    }

    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      validationErrors.push("Phone number must be exactly 10 digits.");
    }

    // Validate username
    const usernameValidation = validateUsername(username, email, firstName, lastName);
    if (!usernameValidation.isValid) {
      validationErrors.push(usernameValidation.message);
    }

    // Validate address
    if (!address || address.trim().length < 5) {
      validationErrors.push("Address must be at least 5 characters long.");
    }

    // Validate password (collect all password errors)
    const passwordErrors = validatePassword(password);
    validationErrors.push(...passwordErrors);

    // Validate password confirmation
    if (password !== confirmPassword) {
      validationErrors.push("Passwords do not match.");
    }

    // Check if password is too similar to personal info
    if (password && (
        password.toLowerCase().includes(username.toLowerCase()) ||
        password.toLowerCase().includes(firstName.toLowerCase()) ||
        password.toLowerCase().includes(lastName.toLowerCase()) ||
        password.toLowerCase().includes(email.split('@')[0].toLowerCase())
      )) {
      validationErrors.push("Password is too similar to your personal information.");
    }

    // If there are validation errors, display them all
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/user/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          password_again: confirmPassword,
          first_name: firstName,
          last_name: lastName,
          address,
          phone_number: phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Enhanced error handling for Django validation errors
        let errorMessage = "Registration failed.";
        
        if (data.username && Array.isArray(data.username)) {
          errorMessage = data.username[0];
        } else if (data.email && Array.isArray(data.email)) {
          errorMessage = data.email[0];
        } else if (data.password && Array.isArray(data.password)) {
          errorMessage = data.password[0];
        } else if (data.phone_number && Array.isArray(data.phone_number)) {
          errorMessage = data.phone_number[0];
        } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMessage = data.non_field_errors[0];
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          // Handle any other field errors
          const firstError = Object.values(data).find(val => 
            Array.isArray(val) && val.length > 0
          ) as string[] | undefined;
          if (firstError) {
            errorMessage = firstError[0];
          }
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      alert("Registration successful! Please sign in.");
      navigate("/signin");
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <ChefHat className="mx-auto h-12 w-12 text-pink-600" />
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/signin" className="text-pink-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {error && <div className="text-red-500 text-sm mt-4 text-center">{error}</div>}
        
        {errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((errorMsg, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>{errorMsg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
              <span>Password</span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-pink-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
              <span>Confirm Password</span>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-500 hover:text-pink-500"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <button type="submit" className="btn-pink" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
