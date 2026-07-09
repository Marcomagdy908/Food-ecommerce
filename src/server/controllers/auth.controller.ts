import { Response } from 'express';
import { User } from '../models/user.model';
import { hashPassword, verifyPassword, signToken } from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    const emailLower = email.toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      res.status(400).json({ message: 'Email is already registered' });
      return;
    }

    // Hash password and create user
    const passwordHash = hashPassword(password);
    const user = new User({
      name,
      email: emailLower,
      passwordHash,
      avatarUrl: '',
      points: 0,
      savedAddresses: []
    });

    const savedUser = await user.save();

    // Generate JWT token
    const token = signToken({
      id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name
    });

    // Set cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(201).json({
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      avatarUrl: savedUser.avatarUrl,
      points: savedUser.points,
      savedAddresses: savedUser.savedAddresses,
      joinedDate: 'Joined ' + new Date(savedUser.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' })
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const emailLower = email.toLowerCase();

    // Find user
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = signToken({
      id: user._id,
      email: user.email,
      name: user.name
    });

    // Set cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      points: user.points,
      savedAddresses: user.savedAddresses,
      joinedDate: 'Joined ' + new Date(user.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' })
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.cookie('token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.status(200).json({ message: 'Logged out successfully' });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      points: user.points,
      savedAddresses: user.savedAddresses,
      joinedDate: 'Joined ' + new Date(user.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' })
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
}

export async function updateAddresses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { addresses } = req.body;

    if (!Array.isArray(addresses)) {
      res.status(400).json({ message: 'Addresses must be an array' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.savedAddresses = addresses;
    await user.save();

    res.status(200).json({
      savedAddresses: user.savedAddresses
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update addresses', error: error.message });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { name, email, avatarUrl } = req.body;

    if (!name || !email) {
      res.status(400).json({ message: 'Name and email are required' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check email uniqueness if email is changed
    if (email.toLowerCase() !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase() });
      if (taken) {
        res.status(400).json({ message: 'Email is already registered' });
        return;
      }
    }

    user.name = name;
    user.email = email.toLowerCase();
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      points: user.points,
      savedAddresses: user.savedAddresses,
      joinedDate: 'Joined ' + new Date(user.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' })
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update profile info', error: error.message });
  }
}

export async function adjustPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { amount } = req.body;

    if (amount === undefined || typeof amount !== 'number') {
      res.status(400).json({ message: 'Adjustments amount must be a number' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const newPoints = (user.points || 0) + amount;
    if (newPoints < 0) {
      res.status(400).json({ message: 'Insufficient points' });
      return;
    }

    user.points = newPoints;
    await user.save();

    res.status(200).json({
      points: user.points
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to adjust points', error: error.message });
  }
}
