import User from '../models/User.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, password, role, permissions } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      password,
      role: role || 'user',
      permissions: permissions || []
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.username = req.body.username || user.username;
      if (req.user.role === 'admin') {
        user.role = req.body.role || user.role;
        user.permissions = req.body.permissions || user.permissions;
      }
      user.email = req.body.email !== undefined ? req.body.email : user.email;
      user.mobile = req.body.mobile !== undefined ? req.body.mobile : user.mobile;
      user.dob = req.body.dob !== undefined ? req.body.dob : user.dob;
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        permissions: updatedUser.permissions,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        dob: updatedUser.dob
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'admin' || user.username === 'admin') {
        return res.status(400).json({ message: 'Cannot delete admin user' });
      }
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
