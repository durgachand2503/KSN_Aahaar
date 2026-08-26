import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { generateToken } from '../middleware/auth';
import { registerSchema, loginSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import User from '../models/User';

const router = Router();

/**
 * POST /api/auth/register
 */
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      throw new AppError('An account with this email or phone already exists.', 409);
    }

    const user = await User.create({ name, email, phone, password });

    const token = generateToken({ id: String(user._id), email: user.email, role: 'customer' });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: { user: user.toJSON(), token },
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = generateToken({ id: String(user._id), email: user.email, role: 'customer' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user: user.toJSON(), token },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError('User not found.', 404);

    res.json({ success: true, data: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * PUT /api/auth/profile
 */
router.put('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { name, phone },
      { new: true, runValidators: true }
    );
    if (!user) throw new AppError('User not found.', 404);

    res.json({ success: true, data: user.toJSON(), message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
});

export default router;
