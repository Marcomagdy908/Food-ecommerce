import { Request, Response } from 'express';
import { Order } from '../models/order.model';
import { Meal } from '../models/meal.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const { items, deliveryAddress, paymentMethod, transactionId } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Order must contain at least one item' });
      return;
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      res.status(400).json({ message: 'Delivery address is required' });
      return;
    }

    // Resolve current prices of all items to embed snapshots securely
    const orderItems = [];
    let calculatedTotalPrice = 0;

    for (const item of items) {
      const meal = await Meal.findById(item.mealId);
      if (!meal) {
        res.status(404).json({ message: `Meal with ID ${item.mealId} not found` });
        return;
      }

      const priceAtPurchase = meal.price;
      const quantity = Number(item.quantity) || 1;
      calculatedTotalPrice += priceAtPurchase * quantity;

      orderItems.push({
        mealId: meal._id,
        title: meal.title,
        priceAtPurchase: priceAtPurchase,
        quantity: quantity
      });
    }

    const calculatedPaymentStatus = paymentMethod === 'Card' ? 'Paid' : 'Unpaid';

    const order = new Order({
      userId: authReq.user ? authReq.user.id : undefined,
      items: orderItems,
      totalPrice: Number(calculatedTotalPrice.toFixed(2)),
      deliveryAddress: {
        street: deliveryAddress.street,
        city: deliveryAddress.city
      },
      status: 'Pending',
      paymentStatus: calculatedPaymentStatus,
      paymentMethod: paymentMethod || 'Cash',
      transactionId: transactionId || undefined
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
}

export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
  }
}

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const orders = await Order.find({ userId: authReq.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve user orders', error: error.message });
  }
}
