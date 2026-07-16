import { Router } from 'express';
import { getMeals, getMealById, createMeal } from '../controllers/meal.controller';
import { createOrder, getOrders, getMyOrders, getOrderById, updateOrderStatus } from '../controllers/order.controller';
import { signup, login, logout, getMe, updateAddresses, updateProfile, adjustPoints, getAllUsers, updateUserRole, deleteUser } from '../controllers/auth.controller';
import { logClientError, getErrorLogs } from '../controllers/error.controller';
import { authenticate, requireAuth, requireAdmin } from '../middleware/auth.middleware';

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

// User Management Routes (Admins only)
router.get('/users', requireAdmin, getAllUsers);
router.put('/users/:id/role', requireAdmin, updateUserRole);
router.delete('/users/:id', requireAdmin, deleteUser);


// Meal Routes
router.get('/meals', getMeals);
router.get('/meals/:id', getMealById);
router.post('/meals', requireAdmin, createMeal); // Protected: Admins only

// Order Routes
router.post('/orders', requireAuth, createOrder); // Protected: users only
router.get('/orders/my', requireAuth, getMyOrders); // Protected, user specific orders
router.get('/orders/:id', getOrderById); // Open tracker/details page
router.put('/orders/:id/status', requireAdmin, updateOrderStatus); // Protected: Admins only status updates
router.get('/orders', requireAdmin, getOrders); // Protected: Admins only (all orders)

// Error Logging Routes
router.post('/errors/log', logClientError); // Open endpoint for clients to log errors
router.get('/errors', requireAdmin, getErrorLogs); // Protected: Admins only log listing

export default router;
