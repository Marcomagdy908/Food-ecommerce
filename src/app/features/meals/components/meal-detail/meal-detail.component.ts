import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MealsApiService, MealItem } from '../../services/meals-api.service';
import { CartStateService } from '../../../cart/services/cart-state.service';

@Component({
  selector: 'app-meal-detail',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './meal-detail.component.html',
  styleUrls: ['./meal-detail.component.css']
})
export class MealDetailComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mealsApi = inject(MealsApiService);
  private readonly cart = inject(CartStateService);

  // Loaded DB data states
  public meal = signal<MealItem | null>(null);
  public drinkPairings = signal<MealItem[]>([]);
  public isLoading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);

  // Selections
  public selectedSize = signal<string>('Classic 12"');
  public selectedDough = signal<string>('Traditional Neapolitan');
  public selectedToppings = signal<Set<string>>(new Set());
  public quantity = signal<number>(1);

  // Added notification state
  public showAddedAlert = signal<boolean>(false);
  public addedMessage = signal<string | null>(null);

  // Prices dictionaries
  public readonly sizePrices: Record<string, number> = {
    'Classic 12"': 0,
    'Large 16"': 6.50
  };

  public readonly doughPrices: Record<string, number> = {
    'Traditional Neapolitan': 0,
    'Whole Grain': 1.50
  };

  public readonly toppingPrices: Record<string, number> = {
    'Buffalo Mozzarella': 3.00,
    'Spicy Salami': 2.50,
    'Fresh Arugula': 1.50,
    'Anchovies': 2.00
  };

  // Computeds
  public sizePriceOffset = computed(() => this.sizePrices[this.selectedSize()] ?? 0);
  public doughPriceOffset = computed(() => this.doughPrices[this.selectedDough()] ?? 0);
  public toppingsPriceOffset = computed(() => {
    let sum = 0;
    this.selectedToppings().forEach(t => {
      sum += this.toppingPrices[t] ?? 0;
    });
    return sum;
  });

  public unitPrice = computed(() => {
    const base = this.meal()?.price ?? 0;
    return base + this.sizePriceOffset() + this.doughPriceOffset() + this.toppingsPriceOffset();
  });

  public totalPrice = computed(() => this.unitPrice() * this.quantity());

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadMealDetails(id);
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      this.loadPairings();
    }
  }

  private loadMealDetails(id: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mealsApi.getMealById(id).subscribe({
      next: (data) => {
        this.meal.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading meal:', err);
        this.errorMessage.set('Could not load meal details. Please select another pizza.');
        this.isLoading.set(false);
      }
    });
  }

  private loadPairings() {
    this.mealsApi.getMeals().subscribe({
      next: (meals) => {
        // Find items in Drinks category
        const drinks = meals.filter(m => m.category === 'Drinks');
        this.drinkPairings.set(drinks.slice(0, 2)); // Show up to 2 drinks
      },
      error: (err) => console.error('Error loading drink pairings:', err)
    });
  }

  public selectSize(size: string) {
    this.selectedSize.set(size);
  }

  public selectDough(dough: string) {
    this.selectedDough.set(dough);
  }

  public toggleTopping(topping: string) {
    const current = new Set(this.selectedToppings());
    if (current.has(topping)) {
      current.delete(topping);
    } else {
      current.add(topping);
    }
    this.selectedToppings.set(current);
  }

  public incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  public decrementQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  public addToOrder() {
    const base = this.meal();
    if (!base) return;

    const toppingsList = Array.from(this.selectedToppings());
    const toppingsDesc = toppingsList.length > 0 ? `, +${toppingsList.join(', +')}` : '';
    
    // Create custom title and unique ID
    const customTitle = `${base.title} (${this.selectedSize()}, ${this.selectedDough()}${toppingsDesc})`;
    const customId = `${base._id}-${this.selectedSize().replace(/ /g, '')}-${this.selectedDough().replace(/ /g, '')}-${toppingsList.join('-').replace(/ /g, '')}`;

    // Add to cart quantity times
    for (let i = 0; i < this.quantity(); i++) {
      this.cart.addMeal(customId, customTitle, this.unitPrice(), base.imageUrl);
    }

    // Visual feedback trigger
    this.addedMessage.set(customTitle);
    this.showAddedAlert.set(true);
    setTimeout(() => {
      this.showAddedAlert.set(false);
    }, 2500);
  }

  public addPairingToOrder(drink: MealItem) {
    this.cart.addMeal(drink._id, drink.title, drink.price, drink.imageUrl);
    this.addedMessage.set(drink.title);
    this.showAddedAlert.set(true);
    setTimeout(() => {
      this.showAddedAlert.set(false);
    }, 2500);
  }
}
