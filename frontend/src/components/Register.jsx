import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { authApi } from '../utils/api';
import { 
  validatePhoneNumber, 
  sanitizePhoneNumber 
} from '../utils/validation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    countryCode: '+91',
    phoneNumber: "",
    otp: ["", "", "", "", "", ""],
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [stage, setStage] = useState('phone'); // 'phone', 'otp', 'details'
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds
  const [otpExpired, setOtpExpired] = useState(false);

  // OTP input refs
  const otpInputRefs = useRef(
    Array(6).fill(null).map(() => React.createRef())
  );

  // Start OTP countdown timer
  const startOtpTimer = () => {
    setOtpExpired(false);
    setOtpTimer(600); // Reset to 10 minutes
    const timer = setInterval(() => {
      setOtpTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(timer);
          setOtpExpired(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  // Format timer to MM:SS
  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    const newOtp = [...user.otp];
    newOtp[index] = value;
    setUser({ ...user, otp: newOtp });

    // Auto focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1].current.focus();
    }
  };

  // Handle OTP input key events
  const handleOtpKeyDown = (index, e) => {
    // Backspace handling
    if (e.key === 'Backspace' && !user.otp[index] && index > 0) {
      otpInputRefs.current[index - 1].current.focus();
    }
  };

  // Send OTP to phone number
  const handleSendOTP = async () => {
    // Validate phone number
    if (!validatePhoneNumber(user.phoneNumber)) {
      setErrors({ phoneNumber: "Invalid phone number format." });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const fullPhoneNumber = `${user.countryCode}${sanitizePhoneNumber(user.phoneNumber)}`;
      
      // Send registration OTP
      const response = await authApi.sendRegistrationOTP(fullPhoneNumber);
      
      // Check if registration is possible
      if (response.data.canRegister) {
        setStage('otp');
        startOtpTimer();
      } else if (response.data.canLogin) {
        // Phone number already exists
        setErrors({ 
          phoneNumber: "Phone number already registered. Please login instead." 
        });
      }
    } catch (error) {
      setErrors({ 
        api: error.response?.data?.message || "Failed to send OTP. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    // Check if OTP has expired
    if (otpExpired) {
      setErrors({ otp: "OTP has expired. Please request a new OTP." });
      return;
    }

    // Validate OTP
    const otpValue = user.otp.join('');
    if (otpValue.length !== 6) {
      setErrors({ otp: "OTP must be 6 digits" });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const fullPhoneNumber = `${user.countryCode}${sanitizePhoneNumber(user.phoneNumber)}`;
      const response = await authApi.verifyOTP({
        phoneNumber: fullPhoneNumber, 
        otp: otpValue, 
        purpose: 'registration'
      });

      // Move to details stage if OTP is verified
      if (response.data.verified) {
        setStage('details');
      }
    } catch (error) {
      setErrors({ 
        otp: error.response?.data?.message || "Invalid OTP. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  // Final registration
  const handleRegister = async () => {
    // Validate name
    const nameError = user.name.length < 2
      ? "Name must be at least 2 characters long."
      : undefined;

    // Validate password
    const passwordError =
      user.password.length > 0 && user.password.length < 6
        ? "Password must be at least 6 characters long."
        : undefined;

    // Validate confirm password
    const confirmPasswordError = 
      user.password !== user.confirmPassword
        ? "Passwords do not match."
        : undefined;

    if (nameError || passwordError || confirmPasswordError) {
      setErrors({
        name: nameError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const fullPhoneNumber = `${user.countryCode}${sanitizePhoneNumber(user.phoneNumber)}`;
      await authApi.register({
        phoneNumber: fullPhoneNumber,
        name: user.name,
        password: user.password
      });

      // Redirect to login after successful registration
      navigate('/login');
    } catch (error) {
      setErrors({
        api: error.response?.data?.message || "Registration failed. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  // Update button disabled state based on current stage
  useEffect(() => {
    switch(stage) {
      case 'phone':
        setButtonDisabled(!validatePhoneNumber(user.phoneNumber));
        break;
      case 'otp':
        setButtonDisabled(user.otp.join('').length !== 6 || otpExpired);
        break;
      case 'details':
        setButtonDisabled(
          user.name.length < 2 || 
          user.password.length < 6 || 
          user.password !== user.confirmPassword
        );
        break;
    }
  }, [user, stage, otpExpired]);

  // Render content based on current stage
  const renderContent = () => {
    switch(stage) {
      case 'phone':
        return (
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
                  setErrors({});
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
        );
      
      case 'otp':
        return (
          <div>
            <label htmlFor="otp" className="block text-gray-700 mb-2">
              Enter OTP sent to +91 {user.phoneNumber}
            </label>
            <div className="flex justify-between space-x-2">
              {user.otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpInputRefs.current[index]}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleOtpChange(index, value);
                  }}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              ))}
            </div>
            {errors.otp && (
              <div className="text-red-500 text-sm mt-1">
                {errors.otp}
              </div>
            )}
            {otpExpired ? (
              <p className="text-red-500 text-sm mt-2">
                OTP has expired. Please request a new OTP.
              </p>
            ) : (
              <p className="text-gray-600 text-sm mt-2">
                OTP expires in {formatTimer(otpTimer)}
              </p>
            )}
            <button 
              onClick={handleSendOTP}
              className="text-indigo-600 cursor-pointer hover:underline mt-2 text-sm"
            >
              Resend OTP
            </button>
          </div>
        );
      
      case 'details':
        return (
          <>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700">
                Full Name
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black"
                id="name"
                type="text"
                value={user.name}
                onChange={(e) => {
                  setUser({ ...user, name: e.target.value });
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.name}
                </div>
              )}
            </div>
            <div className="mb-4">
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
                  placeholder="Create a strong password"
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
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700">
                Confirm Password
              </label>
              <section className="flex w-full items-center relative">
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black"
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={user.confirmPassword}
                  onChange={(e) => {
                    setUser({ ...user, confirmPassword: e.target.value });
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Confirm your password"
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
          </>
        );
      
      default:
        return null;
    }
  };

  // Handle form submission based on current stage
  const handleSubmit = () => {
    switch(stage) {
      case 'phone':
        handleSendOTP();
        break;
      case 'otp':
        handleVerifyOTP();
        break;
      case 'details':
        handleRegister();
        break;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {stage === 'phone' ? 'Register' : 
           stage === 'otp' ? 'Verify OTP' : 
           'Complete Registration'}
        </h1>
        <div className="space-y-4">
          {renderContent()}
          
          {errors.api && (
            <div className="text-red-500 text-center mb-4">{errors.api}</div>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={buttonDisabled || loading}
            className={`w-full cursor-pointer py-2 px-4 rounded-lg text-white font-medium ${
              buttonDisabled || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            } transition-colors duration-200`}
          >
            {loading 
              ? "Processing..." 
              : stage === 'phone' 
                ? "Send OTP" 
                : stage === 'otp' 
                  ? "Verify OTP" 
                  : "Create Account"}
          </button>
          
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Already have an account?{" "}
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
    </div>
  );
}
