import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/*
This middleware:
  1. Reads the JWT from the cookie
  2. verifies it
  3. finds the user
  4. attaches the user to req.user
*/

const protect = async (req, res, next) => {
  try {
    // CHECK IF COOKIE EXISTS
    const token = req.cookies.token;

    // IF NO TOKEN, SEND ERROR
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // DECODE THE JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    // IF JWT IS NOT VALID
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // SAVE USER TO REQ.USER FOR FUTURE REQUESTS
    req.user = user;
    next();
  } catch (error) {
    console.error('protect middleware error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export default protect;
