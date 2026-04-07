import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';

const isLocalOrigin = (origin = '') => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const resolveCookieSecurity = (req) => {
  const origin = req.get('origin') || '';
  const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const isSecureRequest = req.secure || forwardedProto === 'https';

  const envSecure = process.env.COOKIE_SECURE;
  const secure = envSecure
    ? envSecure === 'true'
    : isSecureRequest && !isLocalOrigin(origin);

  const sameSite = process.env.COOKIE_SAMESITE || (secure ? 'none' : 'lax');

  return { secure, sameSite };
};

const getAuthCookieOptions = (req) => {
  const { secure, sameSite } = resolveCookieSecurity(req);

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 60 * 60 * 1000,
  };
};

export const signup = async (req, res, next) => {
  const { username, email, password, fullName, dob, role, secretCode } = req.body;
  
  try {
    if (role === 'admin') {
      const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || 'admin123'; 
      
      if (!secretCode) {
        return next(errorHandler(400, 'Secret code is required for admin registration'));
      }
      
      if (secretCode !== ADMIN_SECRET_CODE) {
        return next(errorHandler(401, 'Invalid admin secret code'));
      }
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return next(errorHandler(400, 'Email already exists'));
      }
      if (existingUser.username === username) {
        return next(errorHandler(400, 'Username already exists'));
      }
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);
    
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
      dob,
      role: role || 'user' 
    });

    await newUser.save();
    
    if (role === 'admin') {
      console.log(`New admin registered: ${email} at ${new Date().toISOString()}`);
    }
    
    res.status(201).json({ 
      success: true,
      message: `${role === 'admin' ? 'Administrator' : 'User'} created successfully` 
    });
    
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  
  try {
    if (!process.env.JWT_SECRET) {
      return next(errorHandler(500, 'JWT_SECRET is not configured on server'));
    }

    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, 'User not found'));
    
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, 'Wrong credentials'));

    const token = jwt.sign({
      id: validUser._id,
      role: validUser.role
    }, process.env.JWT_SECRET, {
      expiresIn: '1h' // Add explicit expiration
    });

    const { password: hashedPassword, ...rest } = validUser._doc;
    
    res
      .cookie('access_token', token, getAuthCookieOptions(req))
      .status(200)
      .json({
        success: true,
        token, // Also send token in response body for debugging
        ...rest
      });
      
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return next(errorHandler(500, 'JWT_SECRET is not configured on server'));
    }

    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ 
        id: user._id, 
        role: user.role 
      }, process.env.JWT_SECRET, {
        expiresIn: '1h'
      });
      
      const { password: hashedPassword, ...rest } = user._doc;
      res
        .cookie('access_token', token, getAuthCookieOptions(req))
        .status(200)
        .json({
          success: true,
          token,
          ...rest
        });
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      
      const username = req.body.username || 
        req.body.email.split('@')[0].toLowerCase() +
        Math.random().toString(36).slice(-8);
      
      const newUser = new User({
        username: username,
        email: req.body.email,
        password: hashedPassword,
        fullName: req.body.fullName || 'Google User',
        dob: req.body.dob || new Date(),
        profilePicture: req.body.profilePicture || req.body.photo,
        role: req.body.role || 'user',
      });
      
      await newUser.save();
      
      const token = jwt.sign({ 
        id: newUser._id, 
        role: newUser.role 
      }, process.env.JWT_SECRET, {
        expiresIn: '1h'
      });
      
      const { password: hashedPassword2, ...rest } = newUser._doc;
      res
        .cookie('access_token', token, getAuthCookieOptions(req))
        .status(200)
        .json({
          success: true,
          token,
          ...rest
        });
    }
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res) => {
  const { secure, sameSite } = resolveCookieSecurity(req);

  res.clearCookie('access_token', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  }).status(200).json({
    success: true,
    message: 'User has been logged out.'
  });
};
