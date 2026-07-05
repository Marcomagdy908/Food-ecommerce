import { Component, signal, Inject, PLATFORM_ID, AfterViewInit, ViewChild, OnInit, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PizzaCanvasComponent } from './features/meals/components/pizza-canvas/pizza-canvas.component';
import { CartStateService } from './features/cart/services/cart-state.service';
import { MealsApiService, MealItem } from './features/meals/services/meals-api.service';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PizzaCanvasComponent, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit {
  protected readonly title = signal('SliceCraft - Premium 3D Pizza');

  @ViewChild(PizzaCanvasComponent) pizzaCanvas!: PizzaCanvasComponent;

  public readonly cart = inject(CartStateService);
  private readonly mealsApi = inject(MealsApiService);

  public meals = signal<MealItem[]>([]);
  public orderSuccess = signal<string | null>(null);

  // Address fields
  public street = signal('');
  public city = signal('Cairo');

  // Virtual progress variable for the checkout box landing transition
  public checkoutProgress = 0;

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

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);

      // Wire GSAP only after the OBJ model has fully loaded (async!)
      this.pizzaCanvas.onReadyCallback = () => {
        this.initScrollAnimations();
      };
    }
  }

  /**
   * Calculates the LIVE 3D world coordinate at Z=0 corresponding to the
   * current screen position of the HTML '.box-spacer' element.
   */
  private getPizzaTargetPosition(): THREE.Vector3 {
    const defaultPos = new THREE.Vector3(3.0, -0.5, 0.0);
    if (!isPlatformBrowser(this.platformId) || !this.pizzaCanvas || !this.pizzaCanvas.camera) {
      return defaultPos;
    }
    const spacer = document.querySelector('.box-spacer');
    if (!spacer) return defaultPos;

    const rect = spacer.getBoundingClientRect();

    // Calculate coordinates of target spacer center in current viewport space
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Convert pixel coordinates to Normalized Device Coordinates (NDC)
    const ndcX = (centerX / window.innerWidth) * 2 - 1;
    const ndcY = -(centerY / window.innerHeight) * 2 + 1;

    // Project from screen NDC back to 3D world space at Z=0
    const camera = this.pizzaCanvas.camera;
    const tempV = new THREE.Vector3(ndcX, ndcY, 0.5);
    tempV.unproject(camera);
    const dir = tempV.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    return camera.position.clone().add(dir.multiplyScalar(distance));
  }

  /**
   * Updates the pizza position dynamically during the final scroll segment
   * by lerping towards the live screen coordinates of the delivery box.
   */
  public updatePizzaPosition() {
    const pizza = this.pizzaCanvas?.pizzaGroup;
    if (!pizza) return;

    if (this.checkoutProgress > 0) {
      const targetPos = this.getPizzaTargetPosition();
      // Smoothly interpolate from Section 3 coordinates (1.8, 0.3) to the box center
      pizza.position.x = THREE.MathUtils.lerp(1.8, targetPos.x, this.checkoutProgress);
      pizza.position.y = THREE.MathUtils.lerp(0.3, targetPos.y, this.checkoutProgress);
    }
  }

  private initScrollAnimations() {
    const pizza = this.pizzaCanvas.pizzaGroup;

    // HERO initial state: Standing upright coin view facing the camera
    gsap.set(pizza.rotation, { x: Math.PI / 2, y: 0, z: 0 });
    gsap.set(pizza.position, { x: 1.5, y: 0, z: 0 });
    gsap.set(pizza.scale, { x: 1.5, y: 1.5, z: 1.5 });

    // Master scroll timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2.2, // Smoother, slower lag for scroll updates
        onUpdate: (self) => {
          this.pizzaCanvas.resetIdleTimer();
          // Force live position recalculation during scrolling in Section 4
          this.updatePizzaPosition();
        }
      }
    });

    // Set initial state for scroll-triggered text animations
    gsap.set('.craft-text > *', { opacity: 0, y: 40 });
    gsap.set('.ingredients-text > *:not(.ingredients-grid)', { opacity: 0, y: 40 });
    gsap.set('.ing-card', { opacity: 0, y: 30, scale: 0.95 });
    gsap.set('.order-form-container > *', { opacity: 0, y: 40 });

    // ── Section 1 (Hero) → Section 2 (Craftsmanship) ─────────────
    // Pizza slides left and tilts down to reveal the toppings/cheese surface
    tl.to(pizza.position, {
      x: -1.5, y: -0.3, z: 0,
      duration: 1, ease: 'power2.inOut'
    }, 0)
      .to(pizza.rotation, {
        x: 0.9,    // Tilted forward (shows top surface from perspective)
        y: -0.25,   // Slight side angle for depth
        z: 0.2,
        duration: 1, ease: 'power2.inOut'
      }, 0)
      .to(pizza.scale, {
        x: 1.1, y: 1.1, z: 1.1,
        duration: 1, ease: 'power2.inOut'
      }, 0);

    // Hero content fades out smoothly
    tl.to('.hero-text > *', {
      opacity: 0, y: -30, stagger: 0.08, duration: 0.5, ease: 'power1.in'
    }, 0.1);

    // Craftsmanship content fades and slides up in a premium stagger
    tl.to('.craft-text > *', {
      opacity: 1, y: 0, stagger: 0.12, duration: 0.8, ease: 'power2.out'
    }, 0.35);

    // Toppings drop onto the pizza — driven by a single progress value,
    // the component's render loop handles per-group stagger internally
    // (pepperoni first → mushrooms → basil, one type at a time)
    tl.to(this.pizzaCanvas, {
      toppingProgress: 1,
      duration: 2.0, ease: 'none'
    }, 0.1);

    // ── Section 2 → Section 3 (Ingredients) ──────────────────────
    // Craftsmanship content fades out before Section 3 content arrives
    tl.to('.craft-text > *', {
      opacity: 0, y: -30, stagger: 0.08, duration: 0.5, ease: 'power1.in'
    }, 1.0);

    // Pizza slides right, tilts to show topics clearly
    tl.to(pizza.position, {
      x: 1.8, y: 0.3, z: 0,
      duration: 1, ease: 'power2.inOut'
    }, 1.2)
      .to(pizza.rotation, {
        x: 0.7,    // Tilted more so we see the flat face clearly
        y: 0.2,
        z: -0.3,
        duration: 1, ease: 'power2.inOut'
      }, 1.2)
      .to(pizza.scale, {
        x: 0.9, y: 0.9, z: 0.9,
        duration: 1, ease: 'power2.inOut'
      }, 1.2);

    // Ingredients section header text fades and slides up
    tl.to('.ingredients-text > *:not(.ingredients-grid)', {
      opacity: 1, y: 0, stagger: 0.12, duration: 0.8, ease: 'power2.out'
    }, 1.4)
      // Ingredients grid cards fade, slide up, and scale in with a neat stagger
      .to('.ing-card', {
        opacity: 1, y: 0, scale: 1, stagger: 0.08, duration: 0.8, ease: 'back.out(1.2)'
      }, 1.55);

    // ── Section 3 → Section 4 (Checkout / Box) ───────────────────
    // Ingredients content fades out
    tl.to('.ingredients-text > *:not(.ingredients-grid)', {
      opacity: 0, y: -30, stagger: 0.08, duration: 0.5, ease: 'power1.in'
    }, 2.2)
      .to('.ing-card', {
        opacity: 0, y: -20, scale: 0.95, stagger: 0.04, duration: 0.4, ease: 'power1.in'
      }, 2.2);

    // Animate the virtual progress variable to blend into the live box position
    this.checkoutProgress = 0;
    tl.to(this, {
      checkoutProgress: 1,
      duration: 1, ease: 'power2.inOut',
      onUpdate: () => {
        this.updatePizzaPosition();
        // Disable idle float once the pizza starts entering the box
        this.pizzaCanvas.inBox = this.checkoutProgress > 0.05;
      }
    }, 2.4)
      .to('.pizza-viewport', {
        zIndex: 3, duration: 0.5, ease: 'none'
      }, 2.4)
      .to(pizza.rotation, {
        x: Math.PI / 2, y: 0, z: 0,  // Face camera directly to look flat top-down inside the 2D box
        duration: 1, ease: 'power2.inOut'
      }, 2.4)
      .to(pizza.scale, {
        x: 0.95, y: 0.95, z: 0.95,
        duration: 1, ease: 'power2.inOut'
      }, 2.4);

    // Checkout form fades and slides up at the end of scroll
    tl.to('.order-form-container > *', {
      opacity: 1, y: 0, stagger: 0.12, duration: 0.8, ease: 'power2.out'
    }, 2.6);
  }

  public addToCart(meal: MealItem) {
    this.cart.addMeal(meal._id, meal.title, meal.price);
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

  public placeOrder(event?: Event) {
    if (event) event.preventDefault();

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
