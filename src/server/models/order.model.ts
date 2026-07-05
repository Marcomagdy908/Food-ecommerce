import { Schema, model, models } from 'mongoose';

const OrderItemSchema = new Schema({
  mealId: { type: Schema.Types.ObjectId, ref: 'Meal', required: true },
  title: { type: String, required: true },
  priceAtPurchase: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  items: [OrderItemSchema],
  totalPrice: { type: Number, required: true },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  }
}, { timestamps: true });

export const Order = models['Order'] || model('Order', OrderSchema);
