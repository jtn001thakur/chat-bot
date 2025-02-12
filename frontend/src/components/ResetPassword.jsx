import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { authApi } from '../utils/api';
import { 
  validatePhoneNumber, 
  sanitizePhoneNumber 
} from '../utils/validation';

export default function ResetPassword() {
  console.log("ResetPassword component rendering");

  const navigate = useNavigate();
  const [stage, setStage] = useState('phone'); // 'phone', 'otp', 'reset'
  const [userData, setUserData] = useState({
    countryCode: '+91',
    phoneNumber: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePhoneNumberChange = (e) => {
    const value = sanitizePhoneNumber(e.target.value);
    console.log("handlePhoneNumberChange value ", value)
    setUserData({ ...userData, phoneNumber: value });
    console.log('validations phone nubmer : ', validatePhoneNumber(value))
    if (!validatePhoneNumber(value)) {
      setErrors(prev => ({ ...prev, phoneNumber: "Invalid phone number format." }));
    } else {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  };

  const sendOTP = async () => {
    console.log("Send OTP called with:", userData.phoneNumber);
    
    // Validate phone number before sending OTP
    if (!validatePhoneNumber(userData.phoneNumber)) {
      console.error("Invalid phone number:", userData.phoneNumber);
      setErrors(prev => ({ 
        ...prev, 
        phoneNumber: "Invalid phone number format. Please enter a 10-digit number." 
      }));
      return;
    }

    try {
      setLoading(true);
      setErrors({});  // Clear previous errors
      
      const fullPhoneNumber = `${userData.countryCode}${userData.phoneNumber}`;
      console.log("Full phone number:", fullPhoneNumber);
      
      // Check if phone number exists
      const checkResponse = await authApi.checkPhoneExists(fullPhoneNumber);
      console.log("Check phone exists response:", checkResponse.data);
      
      if (!checkResponse.data.exists) {
        console.warn("Phone number does not exist");
        setErrors(prev => ({ 
          ...prev, 
          phoneNumber: "No account found with this phone number." 
        }));
        return;
      }

      // Send OTP
      const otpResponse = await authApi.sendResetPasswordOTP(fullPhoneNumber);
      console.log("OTP send response:", otpResponse.data);
      
      // Optional: You can handle any additional response from OTP sending
      if (otpResponse.data.otpSent) {
        setStage('otp');
      }
    } catch (error) {
      console.error("OTP Send Error:", error.response ? error.response.data : error);
      setErrors(prev => ({
        ...prev,
        api: error.response?.data?.message || "Failed to send OTP. Please try again."
      }));
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (userData.otp.length !== 6) {
      setErrors(prev => ({ ...prev, otp: "OTP must be 6 digits." }));
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = `${userData.countryCode}${userData.phoneNumber}`;
      
      // Verify OTP
      await authApi.verifyResetPasswordOTP(fullPhoneNumber, userData.otp);
      setStage('reset');
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        otp: error.response?.data?.message || "Invalid OTP. Please try again."
      }));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    // Validate new password
    if (userData.newPassword.length < 6) {
      setErrors(prev => ({ 
        ...prev, 
        newPassword: "Password must be at least 6 characters long." 
      }));
      return;
    }

    // Validate confirm password
    if (userData.newPassword !== userData.confirmPassword) {
      setErrors(prev => ({ 
        ...prev, 
        confirmPassword: "Passwords do not match." 
      }));
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = `${userData.countryCode}${userData.phoneNumber}`;
      
      // Reset password
      await authApi.resetPassword(fullPhoneNumber, userData.newPassword);
      
      // Redirect to login with success message
      navigate('/login', { 
        state: { 
          message: "Password reset successfully. Please log in." 
        } 
      });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        api: error.response?.data?.message || "Failed to reset password. Please try again."
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {stage === 'phone' 
            ? "Reset Password" 
            : stage === 'otp' 
            ? "Verify OTP" 
            : "New Password"}
        </h1>

        {stage === 'phone' && (
          <div className="space-y-4">
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
                  value={userData.phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phoneNumber && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.phoneNumber}
                </div>
              )}
            </div>
            <button
              onClick={sendOTP}
              disabled={!validatePhoneNumber(userData.phoneNumber)}
              className={`w-full cursor-pointer py-2 px-4 rounded-lg text-white font-medium ${
                !validatePhoneNumber(userData.phoneNumber)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              } transition-colors duration-200`}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {stage === 'otp' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-gray-700">
                Enter OTP
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black"
                id="otp"
                type="text"
                maxLength="6"
                value={userData.otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setUserData({ ...userData, otp: value });
                }}
                placeholder="Enter 6-digit OTP"
              />
              {errors.otp && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.otp}
                </div>
              )}
            </div>
            <button
              onClick={verifyOTP}
              disabled={userData.otp.length !== 6}
              className={`w-full cursor-pointer py-2 px-4 rounded-lg text-white font-medium ${
                userData.otp.length !== 6
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              } transition-colors duration-200`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="text-center mt-4">
              <p className="text-gray-600">
                Didn't receive OTP?{" "}
                <span
                  onClick={sendOTP}
                  className="text-indigo-600 hover:underline cursor-pointer"
                >
                  Resend OTP
                </span>
              </p>
            </div>
          </div>
        )}

        {stage === 'reset' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-gray-700">
                New Password
              </label>
              <section className="flex w-full items-center relative">
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black"
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={userData.newPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUserData({ ...userData, newPassword: value });
                    if (value.length > 0 && value.length < 6) {
                      setErrors(prev => ({
                        ...prev,
                        newPassword: "Password must be at least 6 characters long."
                      }));
                    } else {
                      setErrors(prev => ({ ...prev, newPassword: undefined }));
                    }
                  }}
                  placeholder="Enter new password"
                />
                {showNewPassword ? (
                  <VscEye
                    className="text-xl absolute right-2 cursor-pointer top-[50%] translate-y-[-50%]"
                    onClick={() => setShowNewPassword(false)}
                  />
                ) : (
                  <VscEyeClosed
                    className="text-xl absolute right-2 cursor-pointer top-[50%] translate-y-[-50%]"
                    onClick={() => setShowNewPassword(true)}
                  />
                )}
              </section>
              {errors.newPassword && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.newPassword}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700">
                Confirm New Password
              </label>
              <section className="flex w-full items-center relative">
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black"
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={userData.confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUserData({ ...userData, confirmPassword: value });
                    if (value !== userData.newPassword) {
                      setErrors(prev => ({
                        ...prev,
                        confirmPassword: "Passwords do not match."
                      }));
                    } else {
                      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="Confirm new password"
                />
                {showConfirmPassword ? (
                  <VscEye
                    className="text-xl absolute right-2 cursor-pointer top-[50%] translate-y-[-50%]"
                    onClick={() => setShowConfirmPassword(false)}
                  />
                ) : (
                  <VscEyeClosed
                    className="text-xl absolute right-2 cursor-pointer top-[50%] translate-y-[-50%]"
                    onClick={() => setShowConfirmPassword(true)}
                  />
                )}
              </section>
              {errors.confirmPassword && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </div>
              )}
            </div>
            {errors.api && (
              <div className="text-red-500 text-center mb-4">{errors.api}</div>
            )}
            <button
              onClick={resetPassword}
              disabled={
                !userData.newPassword || 
                !userData.confirmPassword || 
                userData.newPassword !== userData.confirmPassword
              }
              className={`w-full py-2 px-4 cursor-pointer rounded-lg text-white font-medium ${
                !userData.newPassword || 
                !userData.confirmPassword || 
                userData.newPassword !== userData.confirmPassword
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              } transition-colors duration-200`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        )}

        <div className="text-center mt-4">
          <p className="text-gray-600">
            Remember your password?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
