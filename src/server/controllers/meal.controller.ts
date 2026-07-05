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

// Automatically seed default meals if none exist
export async function seedMeals(): Promise<void> {
  try {
    const count = await Meal.countDocuments();
    if (count === 0) {
      const defaultMeals = [
        {
          title: 'Signature Margherita',
          description: 'Crushed San Marzano tomatoes, fresh mozzarella, aromatic basil leaves, and extra virgin olive oil.',
          price: 14.99,
          category: 'Pizzas',
          imageUrl: 'assets/textures/PIZZA.jpg',
          tags: ['Vegetarian', 'Classic'],
          isAvailable: true
        },
        {
          title: 'Double Pepperoni Feast',
          description: 'Generous layers of spicy Italian pepperoni, aged mozzarella, and zesty tomato sauce.',
          price: 17.99,
          category: 'Pizzas',
          imageUrl: 'assets/textures/PIZZA.jpg',
          tags: ['Spicy', 'Popular'],
          isAvailable: true
        },
        {
          title: 'Wild Mushroom & Truffle',
          description: 'Creamy garlic sauce, roasted portobello and white button mushrooms, mozzarella, and a drizzle of white truffle oil.',
          price: 18.99,
          category: 'Pizzas',
          imageUrl: 'assets/textures/PIZZA.jpg',
          tags: ['Gourmet', 'Vegetarian'],
          isAvailable: true
        },
        {
          title: 'Garden Basil & Pesto',
          description: 'House-made basil pesto, cherry tomatoes, toasted pine nuts, and fresh mozzarella.',
          price: 16.99,
          category: 'Pizzas',
          imageUrl: 'assets/textures/PIZZA.jpg',
          tags: ['Vegetarian', 'Fresh'],
          isAvailable: true
        }
      ];
      await Meal.insertMany(defaultMeals);
      console.log('Database seeded with default meals successfully.');
    }
  } catch (error) {
    console.error('Error seeding meals:', error);
  }
}
