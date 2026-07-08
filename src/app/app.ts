import { Component, signal, Inject, PLATFORM_ID, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CartStateService } from './features/cart/services/cart-state.service';
import { MealsApiService, MealItem } from './features/meals/services/meals-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class App implements OnInit {
  protected readonly title = signal('SliceCraft - Premium 3D Pizza');

  public readonly cart = inject(CartStateService);
  private readonly mealsApi = inject(MealsApiService);

  public meals = signal<MealItem[]>([]);
  public orderSuccess = signal<string | null>(null);

  // Address fields
  public street = signal('');
  public city = signal('Cairo');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.mealsApi.getMeals().subscribe({
        next: (data) => {
          this.meals.set(data);
        },
        error: (err) => console.error('Failed to fetch meals:', err)
      });
    }
  }

  public addToCart(meal: MealItem) {
    this.cart.addMeal(meal._id, meal.title, meal.price, meal.imageUrl);
  }

  public removeFromCart(mealId: string) {
    this.cart.removeMeal(mealId);
  }

  public updateStreet(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) this.street.set(input.value);
  }

  public updateCity(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) this.city.set(input.value);
  }

  public placeOrder() {
    const items = this.cart.items().map(item => ({
      mealId: item.mealId,
      quantity: item.quantity
    }));

    if (items.length === 0) {
      alert('Your cart is empty! Add some delicious pizza first.');
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
      },
      error: (err) => {
        console.error('Failed to place order:', err);
        alert('Checkout failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
