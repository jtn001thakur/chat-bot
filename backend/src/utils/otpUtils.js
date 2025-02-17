// Generate a random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Simulated SMS sending function (replace with actual SMS service)
export const sendOTPViaSMS = async (phoneNumber, otp) => {
  // In a real-world scenario, you would integrate with an SMS gateway
  console.log(`Sending OTP ${otp} to ${phoneNumber}`);
    
  // Simulate SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
    
  return true;
};

// Calculate OTP expiry time (10 minutes from now)
export const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};
