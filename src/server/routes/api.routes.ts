import { Router } from 'express';
import { getMeals, getMealById, createMeal } from '../controllers/meal.controller';
import { createOrder, getOrders, getMyOrders, getOrderById, updateOrderStatus } from '../controllers/order.controller';
import { signup, login, logout, getMe, updateAddresses, updateProfile, adjustPoints } from '../controllers/auth.controller';
import { logClientError, getErrorLogs } from '../controllers/error.controller';
import { authenticate, requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Run authentication middleware on all API routes to populate req.user if logged in
router.use(authenticate);

// Authentication Routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', requireAuth, getMe);
router.put('/auth/profile', requireAuth, updateProfile);
router.put('/auth/addresses', requireAuth, updateAddresses);
router.post('/auth/points', requireAuth, adjustPoints);

// Meal Routes
router.get('/meals', getMeals);
router.get('/meals/:id', getMealById);
router.post('/meals', createMeal);

// Order Routes
router.post('/orders', createOrder); // Optional authentication, handled in controller
router.get('/orders/my', requireAuth, getMyOrders); // Protected, user specific orders
router.get('/orders/:id', getOrderById); // Open tracker/details page
router.put('/orders/:id/status', updateOrderStatus); // Admin status updates
router.get('/orders', getOrders); // Admin/general (all orders)

// Error Logging Routes
router.post('/errors/log', logClientError); // Open endpoint for clients to log errors
router.get('/errors', requireAuth, getErrorLogs); // Protected log listing

export default router;
