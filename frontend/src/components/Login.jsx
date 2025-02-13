import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { authApi } from '../utils/api';
import { 
  validatePhoneNumber, 
  sanitizePhoneNumber 
} from '../utils/validation';
import { 
  handleLogin, 
  getAccessToken 
} from '../utils/localStorageUtils';

export default function LoginPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    countryCode: '+91',
    phoneNumber: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Check authentication on component mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Redirect to home or dashboard if already logged in
      navigate('/');
    }
  }, [navigate]);

  // Validate inputs
  useEffect(() => {
    const isPhoneValid = validatePhoneNumber(user.phoneNumber);
    const isPasswordValid = user.password.length >= 6;
    
    setButtonDisabled(!(isPhoneValid && isPasswordValid));
  }, [user]);

  // Handle login submission
  const onLogin = async () => {
    // Reset previous errors
    setErrors({});
    
    try {
      setLoading(true);
      setErrors({}); // Clear previous errors

      // Validate phone number
      const cleanPhoneNumber = sanitizePhoneNumber(user.phoneNumber);
      if (!validatePhoneNumber(cleanPhoneNumber)) {
        setErrors({ phoneNumber: "Please enter a valid 10-digit phone number starting with 6-9" });
        setLoading(false);
        return;
      }

      // Prepare full phone number
      const fullPhoneNumber = `${cleanPhoneNumber}`;
      
      // Attempt login
      await authApi.login(fullPhoneNumber, user.password);

      // Redirect to home or dashboard if login is successful
      navigate('/');
    } catch (error) {
      // Handle specific login errors
      const errorMessage = error.message || "Login failed";
      
      // Map specific error messages
      const errorMap = {
        "Invalid credentials": "Incorrect phone number or password",
        "User not found": "No account exists with this phone number",
        "Account locked": "Too many failed attempts. Please try again later"
      };

      // Set the error message
      setErrors({ 
        api: errorMap[errorMessage] || errorMessage || "Unable to login. Please try again"
      });

      // Optional: Log the error for debugging
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        
        <div className="space-y-4">
          {/* Phone Number Input */}
          <div>
            <label htmlFor="phoneNumber" className="block text-gray-700">
              Phone Number
            </label>
            <div className="flex items-center">
              <div className="flex items-center justify-center border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 bg-gray-100">
                <span className="mr-2">🇮🇳</span>
                <span className="text-sm">+91</span>
              </div>
              <input
                className="flex-1 p-2 border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:border-indigo-500 text-black"
                id="phoneNumber"
                type="tel"
                maxLength="10"
                value={user.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setUser({ ...user, phoneNumber: value });
                  setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                }}
                placeholder="Enter your phone number"
              />
            </div>
            {errors.phoneNumber && (
              <div className="text-red-500 text-sm mt-1">
                {errors.phoneNumber}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <section className="flex w-full items-center relative">
              <input
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black"
                id="password"
                type={showPassword ? "text" : "password"}
                value={user.password}
                onChange={(e) => {
                  setUser({ ...user, password: e.target.value });
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Enter your password"
              />
              {showPassword ? (
                <VscEye
                  className="text-xl absolute right-2 cursor-pointer top-[50%] translate-y-[-50%]"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <VscEyeClosed
                  className="text-xl absolute right-2 cursor-pointer top-[50%] translate-y-[-50%]"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </section>
            {errors.password && (
              <div className="text-red-500 text-sm mt-1">
                {errors.password}
              </div>
            )}
          </div>

          {/* API Error */}
          {errors.api && (
            <div className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded-lg">
              <p className="font-medium">{errors.api}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={onLogin}
            disabled={buttonDisabled}
            className={`w-full cursor-pointer py-2 px-4 rounded-lg text-white font-medium ${
              buttonDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            } transition-colors duration-200`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Register Link */}
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Register
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
