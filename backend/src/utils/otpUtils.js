// Generate a random 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Calculate OTP expiry time (5 minutes from now)
export const getOTPExpiry = () => {
    return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};
