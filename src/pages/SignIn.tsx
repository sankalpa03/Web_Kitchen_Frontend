import React, { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChefHat, Eye, EyeOff } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/user/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: credentials.email,
          password: credentials.password,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Store access and refresh tokens from backend response
      const accessToken = data.access_token || data.token || "";
      const refreshToken = data.refresh_token || "";
      if (!accessToken) {
        setError("Login successful, but no access token received.");
        setLoading(false);
        return;
      }

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      // Debug: log before navigation
      console.log("Login successful, navigating to /home");
      navigate("/home", { replace: true });
      // Debug: log after navigation (may not run if navigation is successful)
      console.log("Navigation to /home triggered");
      // If you still can't redirect, check your App.tsx route: it should be <Route path="/home" ...>
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-pink-600 mx-auto mb-2" />
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-sm text-gray-600 mt-1">
            Don't have an account?{" "}
            <Link to="/register" className="text-pink-600 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <input
              type="text"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              placeholder="Email or Username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition duration-200"
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Password"
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-pink-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
