import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MealsApiService } from '../../services/meals-api.service';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
  private readonly mealsApi = inject(MealsApiService);
  public readonly cart = inject(CartStateService);
  public readonly auth = inject(AuthService);

  // Address and state variables
  public street = signal('Via dei Tribunali, 32');
  public city = signal('Napoli');
  public selectedAddress = signal('Guest'); // 'Guest', 'Custom', or the label of the saved address
  public orderSuccess = signal<string | null>(null);

  // Computed calculations for the sidebar summary block
  public get taxAmount(): number {
    return this.cart.totalPrice() * 0.08;
  }

  public get deliveryFee(): number {
    return this.cart.totalPrice() > 0 ? 4.50 : 0;
  }

  public get grandTotal(): number {
    return this.cart.totalPrice() + this.taxAmount + this.deliveryFee;
  }

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user && user.savedAddresses && user.savedAddresses.length > 0) {
      const defaultAddr = user.savedAddresses[0]!;
      this.selectedAddress.set(defaultAddr.label);
      this.street.set(defaultAddr.street);
      this.city.set(defaultAddr.city);
    } else {
      if (user) {
        // Authenticated but no saved addresses -> Default to custom form with empty street
        this.selectedAddress.set('Custom');
        this.street.set('');
        this.city.set('Napoli');
      } else {
        // Guest -> Default to guest mockup address
        this.selectedAddress.set('Guest');
        this.street.set('Via dei Tribunali, 32');
        this.city.set('Napoli');
      }
    }
  }

  public incrementQuantity(mealId: string, title: string, price: number, imageUrl?: string) {
    this.cart.addMeal(mealId, title, price, imageUrl);
  }

  public decrementQuantity(mealId: string) {
    this.cart.removeMeal(mealId);
  }

  public removeItem(mealId: string) {
    this.cart.removeItemCompletely(mealId);
  }

  public selectAddress(type: string, streetVal: string, cityVal: string) {
    this.selectedAddress.set(type);
    this.street.set(streetVal);
    this.city.set(cityVal);
  }

  public updateStreet(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) this.street.set(input.value);
  }

  public submitOrder(event: Event) {
    event.preventDefault();

    const items = this.cart.items().map(item => ({
      mealId: item.mealId,
      quantity: item.quantity
    }));

    if (items.length === 0) {
      alert('Your cart is empty! Add some delicious meals first.');
      return;
    }

    if (!this.street().trim()) {
      alert('Please enter a delivery address.');
      return;
    }

    this.mealsApi.placeOrder({
      items,
      deliveryAddress: {
        street: this.street(),
        city: this.city()
      }
    }).subscribe({
      next: (res) => {
        this.orderSuccess.set(`Order #${res._id.slice(-6).toUpperCase()} placed successfully!`);
        this.cart.clearCart();
        
        // Update rewards points in the database (+100 points)
        if (this.auth.isAuthenticated()) {
          this.auth.adjustPoints(100).subscribe({
            error: (err) => console.error('Failed to award points in database:', err)
          });
        }
      },
      error: (err) => {
        console.error('Failed to place order:', err);
        alert('Checkout failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
