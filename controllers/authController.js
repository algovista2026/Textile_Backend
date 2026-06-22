import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createAlert } from './alertController.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const authUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      await createAlert('User Login', `${user.username} logged into the system.`, 'User', 'info', user._id);

      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        email: user.email,
        mobile: user.mobile,
        dob: user.dob,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        email: user.email,
        mobile: user.mobile,
        dob: user.dob,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const switchProfile = async (req, res) => {
  const { targetUserId } = req.body;

  try {
    const targetUser = await User.findById(targetUserId);

    if (targetUser) {
      if (!targetUser.isActive) {
        return res.status(401).json({ message: 'Target user account is deactivated' });
      }

      res.json({
        _id: targetUser._id,
        username: targetUser.username,
        role: targetUser.role,
        permissions: targetUser.permissions,
        email: targetUser.email,
        mobile: targetUser.mobile,
        dob: targetUser.dob,
        token: generateToken(targetUser._id),
      });
    } else {
      res.status(404).json({ message: 'Target user not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
