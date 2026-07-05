import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  mealId: string;
  title: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  // Read-only public signal exposure, private writable signal backing
  private _items = signal<CartItem[]>([]);
  public readonly items = this._items.asReadonly();

  // Reactive derivations using computed()
  public readonly totalQuantity = computed(() => 
    this._items().reduce((acc, item) => acc + item.quantity, 0)
  );

  public readonly totalPrice = computed(() => 
    this._items().reduce((acc, item) => acc + (item.price * item.quantity), 0)
  );

  public addMeal(mealId: string, title: string, price: number): void {
    this._items.update((currentItems) => {
      const existingIndex = currentItems.findIndex(item => item.mealId === mealId);
      if (existingIndex > -1) {
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }
      return [...currentItems, { mealId, title, price, quantity: 1 }];
    });
  }

  public removeMeal(mealId: string): void {
    this._items.update((currentItems) => {
      const existing = currentItems.find(item => item.mealId === mealId);
      if (!existing) return currentItems;

      if (existing.quantity === 1) {
        return currentItems.filter(item => item.mealId !== mealId);
      }

      return currentItems.map(item => 
        item.mealId === mealId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  }

  public clearCart(): void {
    this._items.set([]);
  }
}
