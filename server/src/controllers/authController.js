const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { MockUser } = require('../utils/mockUsers');

const isMongooseModel = (model) => {
  return model && model.constructor && model.constructor.name === 'Model';
};

const getUserModel = () => {
  try {
    if (isMongooseModel(User)) {
      return User;
    }
  } catch (e) {
    // Use mock
  }
  return MockUser;
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, userId: user.userId },
    process.env.JWT_SECRET || 'boutique-secret-key',
    { expiresIn: '24h' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const UserModel = getUserModel();
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = await UserModel.create({
      userId: `USER-${uuidv4().substr(0, 8)}`,
      name,
      email,
      password,
      phone,
      role: role || 'staff'
    });
    const token = generateToken(newUser);
    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser._id, userId: newUser.userId, name: newUser.name, email: newUser.email, role: newUser.role },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const UserModel = getUserModel();
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'User account is inactive' });
    }
    const isPasswordValid = user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    user.lastLogin = new Date();
    if (user.save) {
      await user.save();
    }
    const token = generateToken(user);
    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, userId: user.userId, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const UserModel = getUserModel();
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};
