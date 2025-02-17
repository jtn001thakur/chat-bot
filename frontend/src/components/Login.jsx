import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { authApi } from '../utils/api';
import { 
  validatePhoneNumber, 
  sanitizePhoneNumber 
} from '../utils/validation';
import { 
  handleLogin, 
  getAccessToken,
  isAuthenticated
} from '../utils/localStorageUtils';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({
    countryCode: '+91',
    phoneNumber: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // New state for admin login modal
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminLoginData, setAdminLoginData] = useState({
    applicationName: '',
    phoneNumber: '',
    password: ''
  });
  const [adminLoginErrors, setAdminLoginErrors] = useState({});

  // Check authentication on component mount
  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated()) {
      // Redirect to dashboard or previous page
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  // Validate inputs
  useEffect(() => {
    const isPhoneValid = validatePhoneNumber(user.phoneNumber);
    const isPasswordValid = user.password.length >= 6;
    
    setButtonDisabled(!(isPhoneValid && isPasswordValid));
  }, [user]);

  // Handle admin login
  const onAdminLogin = async () => {
    setAdminLoginErrors({});
    setLoading(true);
    
    try {
      // Validate inputs
      const errors = {};
      if (!adminLoginData.applicationName) {
        errors.applicationName = 'Application name is required';
      }
      if (!validatePhoneNumber(adminLoginData.phoneNumber)) {
        errors.phoneNumber = 'Please enter a valid phone number';
      }
      if (!adminLoginData.password) {
        errors.password = 'Password is required';
      }

      if (Object.keys(errors).length > 0) {
        setAdminLoginErrors(errors);
        setLoading(false);
        return;
      }

      // Attempt admin login
      const response = await authApi.adminLogin({
        applicationName: adminLoginData.applicationName,
        phoneNumber: adminLoginData.phoneNumber,
        password: adminLoginData.password
      });

      // Handle successful login
      handleLogin(response.token, response.user);
      
      // Redirect to dashboard
      navigate('/', { replace: true });
    } catch (error) {
      // Handle login errors
      const errorMessage = error.message || 'Admin login failed';

      // Set error message
      setAdminLoginErrors({ 
        api: errorMessage 
      });

      // Log error details
      console.error('Admin Login Error:', {
        message: errorMessage,
        fullError: error
      });
    } finally {
      setLoading(false);
    }
  };

  // Existing login method
  const onLogin = async () => {
    // Reset previous errors
    setErrors({});
    setLoading(true);
    
    try {
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
      const response = await authApi.login(fullPhoneNumber, user.password);

      // Ensure response has token and user
      if (!response.data || !response.data.accessToken || !response.data.user) {
        throw new Error('Invalid login response: Missing token or user data');
      }

      // Destructure response
      const { accessToken, user: userData } = response.data;

      // Handle successful login
      handleLogin(accessToken, userData);
      
      // Redirect to dashboard or previous page
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (error) {
      // Handle specific login errors
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        "Login failed. Please try again.";
      
      // Map specific error messages
      const errorMap = {
        "Invalid credentials": "Incorrect phone number or password",
        "User not found": "No account exists with this phone number",
        "Account locked": "Too many failed attempts. Please try again later"
      };

      // Set the error message
      setErrors({ 
        api: errorMap[errorMessage] || errorMessage
      });

      // Log error details
      console.error('Login Error:', {
        message: errorMessage,
        fullError: error
      });
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
            disabled={buttonDisabled || loading}
            className={`w-full cursor-pointer py-2 px-4 rounded-lg text-white font-medium ${
              (buttonDisabled || loading)
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

          {/* Admin Login Link */}
          <div className="text-center mt-4">
            <p 
              onClick={() => setShowAdminLoginModal(true)} 
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Login as Admin
            </p>
          </div>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
            
            {/* Application Name Input */}
            <div className="mb-4">
              <label htmlFor="applicationName" className="block text-gray-700 mb-2">
                Application Name
              </label>
              <input
                id="applicationName"
                type="text"
                value={adminLoginData.applicationName}
                onChange={(e) => {
                  setAdminLoginData({ ...adminLoginData, applicationName: e.target.value });
                  setAdminLoginErrors((prev) => ({ ...prev, applicationName: undefined }));
                }}
                placeholder="Enter application name"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              {adminLoginErrors.applicationName && (
                <div className="text-red-500 text-sm mt-1">
                  {adminLoginErrors.applicationName}
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <div className="mb-4">
              <label htmlFor="adminPhoneNumber" className="block text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="flex items-center">
                <div className="flex items-center justify-center border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 bg-gray-100">
                  <span className="mr-2">🇮🇳</span>
                  <span className="text-sm">+91</span>
                </div>
                <input
                  id="adminPhoneNumber"
                  type="tel"
                  maxLength="10"
                  value={adminLoginData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setAdminLoginData({ ...adminLoginData, phoneNumber: value });
                    setAdminLoginErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                  }}
                  placeholder="Enter phone number"
                  className="flex-1 p-2 border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              {adminLoginErrors.phoneNumber && (
                <div className="text-red-500 text-sm mt-1">
                  {adminLoginErrors.phoneNumber}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label htmlFor="adminPassword" className="block text-gray-700 mb-2">
                Password
              </label>
              <section className="flex w-full items-center relative">
                <input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={adminLoginData.password}
                  onChange={(e) => {
                    setAdminLoginData({ ...adminLoginData, password: e.target.value });
                    setAdminLoginErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
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
              {adminLoginErrors.password && (
                <div className="text-red-500 text-sm mt-1">
                  {adminLoginErrors.password}
                </div>
              )}
            </div>

            {/* API Error */}
            {adminLoginErrors.api && (
              <div className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded-lg">
                <p className="font-medium">{adminLoginErrors.api}</p>
              </div>
            )}

            {/* Admin Login Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={onAdminLogin}
                disabled={loading}
                className={`flex-1 text-white py-2 px-4 rounded-lg transition-colors ${
                  loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              <button
                onClick={() => setShowAdminLoginModal(false)}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
