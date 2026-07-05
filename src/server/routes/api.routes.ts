import { Router } from 'express';
import { getMeals, getMealById, createMeal } from '../controllers/meal.controller';
import { createOrder, getOrders } from '../controllers/order.controller';

const router = Router();

// Meal Routes
router.get('/meals', getMeals);
router.get('/meals/:id', getMealById);
router.post('/meals', createMeal);

// Order Routes
router.post('/orders', createOrder);
router.get('/orders', getOrders);

export default router;
