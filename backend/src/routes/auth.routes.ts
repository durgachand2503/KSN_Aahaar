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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
    if (!user) {
      // Token is valid but user was deleted — clear the stale cookie and return 401
      res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0),
      });
      res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
      return;
    }

    res.json({ success: true, data: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.cookie('token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', expires: new Date(0) });
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


/**
 * POST /api/auth/addresses
 * Add a new delivery address to the user's profile
 */
router.post('/addresses', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { label, houseFlat, street, area, city, state, pincode, instructions, isDefault } = req.body;

    if (!houseFlat || !street || !area || !pincode) {
      throw new AppError('houseFlat, street, area, and pincode are required', 400);
    }
    if (!/^\d{6}$/.test(pincode)) {
      throw new AppError('Please enter a valid 6-digit pincode', 400);
    }

    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError('User not found', 404);

    // If this is set as default, clear existing defaults first
    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }
    // If no addresses exist, make the first one default automatically
    const makeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
      label: label || '',
      houseFlat,
      street,
      area,
      city: city || 'Hyderabad',
      state: state || 'Telangana',
      pincode,
      instructions: instructions || '',
      isDefault: makeDefault,
    });

    await user.save();
    res.status(201).json({ success: true, data: user.toJSON(), message: 'Address added successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/addresses/:addressId
 * Update an existing address
 */
router.put('/addresses/:addressId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError('User not found', 404);

    const addrIndex = user.addresses.findIndex(a => String(a._id) === req.params.addressId);
    const address = user.addresses[addrIndex];
    if (addrIndex === -1 || !address) throw new AppError('Address not found', 404);

    const { label, houseFlat, street, area, city, state, pincode, instructions } = req.body;
    if (houseFlat !== undefined) address.houseFlat = houseFlat;
    if (street !== undefined) address.street = street;
    if (area !== undefined) address.area = area;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) {
      if (!/^\d{6}$/.test(pincode)) throw new AppError('Please enter a valid 6-digit pincode', 400);
      address.pincode = pincode;
    }
    if (instructions !== undefined) address.instructions = instructions;
    if (label !== undefined) address.label = label;

    await user.save();
    res.json({ success: true, data: user.toJSON(), message: 'Address updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/auth/addresses/:addressId
 * Remove an address
 */
router.delete('/addresses/:addressId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError('User not found', 404);

    const addrIndex = user.addresses.findIndex(a => String(a._id) === req.params.addressId);
    if (addrIndex === -1) throw new AppError('Address not found', 404);

    const wasDefault = user.addresses[addrIndex].isDefault;
    user.addresses.splice(addrIndex, 1);

    // If deleted address was default, promote the first remaining one
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, data: user.toJSON(), message: 'Address removed' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/auth/addresses/:addressId/default
 * Set an address as the default
 */
router.patch('/addresses/:addressId/default', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError('User not found', 404);

    const foundIndex = user.addresses.findIndex(a => String(a._id) === req.params.addressId);
    const found = user.addresses[foundIndex];
    if (foundIndex === -1 || !found) throw new AppError('Address not found', 404);

    // Clear all defaults, then set the chosen one
    user.addresses.forEach(addr => { addr.isDefault = false; });
    found.isDefault = true;

    await user.save();
    res.json({ success: true, data: user.toJSON(), message: 'Default address updated' });
  } catch (error) {
    next(error);
  }
});

export default router;

