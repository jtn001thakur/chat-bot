import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { 
      userId: user._id 
    }, 
    process.env.REFRESH_TOKEN_SECRET, 
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
