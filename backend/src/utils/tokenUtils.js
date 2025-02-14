import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '2h' }  // Extended from 15m to 2 hours
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
