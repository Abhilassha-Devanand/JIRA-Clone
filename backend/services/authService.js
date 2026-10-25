const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

/**
 * Helper: Generate signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Register a new user
 */
const registerUser = async ({ name, email, password, department, jobTitle }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error('A user is already registered with this email address.');
    error.statusCode = 400;
    throw error;
  }

  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password,
    department: department ? department.trim() : 'Engineering',
    jobTitle: jobTitle ? jobTitle.trim() : 'Team Member',
  });

  await user.save();
  const token = generateToken(user._id);

  return {
    user,
    token,
  };
};

/**
 * Authenticate existing user with email and password
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);
  // Ensure password is not present in returned object
  const userObj = user.toJSON();

  return {
    user: userObj,
    token,
  };
};

/**
 * Fetch current authenticated user by ID
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update user profile details
 */
const updateUserProfile = async (userId, { name, department, jobTitle, avatar }) => {
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (department !== undefined) updates.department = department.trim();
  if (jobTitle !== undefined) updates.jobTitle = jobTitle.trim();
  if (avatar !== undefined) updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
};
