import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);

router.route('/:id')
  .put(protect, (req, res, next) => {
    if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized to update this user' });
    }
  }, updateUser)
  .delete(protect, admin, deleteUser);

export default router;
