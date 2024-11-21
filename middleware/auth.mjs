import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const protect = (req, res, next) => {
    let token;
    if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired, please log in again' });
      }
      res.status(401).json({ message: 'Invalid token' });
    }
  };
  
  export default protect;
  