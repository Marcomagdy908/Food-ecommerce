import { Request, Response } from 'express';
import { Meal } from '../models/meal.model';

export async function getMeals(req: Request, res: Response): Promise<void> {
  try {
    const { category } = req.query;
    const filter = category ? { category: String(category) } : {};
    const meals = await Meal.find(filter);
    res.status(200).json(meals);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving meals', error: error.message });
  }
}

export async function getMealById(req: Request, res: Response): Promise<void> {
  try {
    const meal = await Meal.findById(req.params['id']);
    if (!meal) {
      res.status(404).json({ message: 'Meal not found' });
      return;
    }
    res.status(200).json(meal);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving meal', error: error.message });
  }
}

export async function createMeal(req: Request, res: Response): Promise<void> {
  try {
    const newMeal = new Meal(req.body);
    const saved = await newMeal.save();
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating meal', error: error.message });
  }
}


