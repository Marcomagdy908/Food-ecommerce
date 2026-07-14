import { Component, signal, OnInit, AfterViewInit, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { PizzaStateService } from '../../../meals/services/pizza-state.service';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { MealsApiService, MealItem } from '../../../meals/services/meals-api.service';
import { PizzaCanvasComponent } from '../../../meals/components/pizza-canvas/pizza-canvas.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, PizzaCanvasComponent, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pizzaState = inject(PizzaStateService);
  public readonly cart = inject(CartStateService);
  private readonly mealsApi = inject(MealsApiService);

  public meals = signal<MealItem[]>([]);
  public scrollProgress = 0;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.mealsApi.getMeals().subscribe({
        next: (data) => this.meals.set(data),
        error: (err) => console.error('Failed to fetch meals in Home:', err)
      });

      setTimeout(() => {
        const canvas = this.pizzaState.pizzaCanvas;
        if (canvas) {
          canvas.inBox = false;
          canvas.isIdle = true;
          this.scrollProgress = 0;

          this.updatePizzaPosition();

          const pizza = canvas.pizzaGroup;
          if (pizza) {
            const m = this.pizzaState.getScaleMultiplier();
            gsap.to(pizza.scale, { x: 1.5 * m, y: 1.5 * m, z: 1.5 * m, duration: 0.5 });
            gsap.to(pizza.rotation, { x: Math.PI / 2, y: 0, z: 0, duration: 0.5 });
          }
        }
      }, 150);
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.updatePizzaPosition();
      this.initScrollAnimations();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);

      if (this.pizzaState.pizzaCanvas && this.pizzaState.pizzaCanvas.pizzaGroup) {
        this.initScrollAnimations();
      } else {
        this.pizzaState.pizzaCanvasReady.subscribe(() => {
          this.initScrollAnimations();
        });
      }
    }
  }

  public updatePizzaPosition() {
    const canvas = this.pizzaState.pizzaCanvas;
    const pizza = canvas?.pizzaGroup;
    if (!pizza) return;

    const p1 = this.pizzaState.getTargetWorldPosition('.hero-visual-spacer') || new THREE.Vector3(1.5, 0, 0);
    const p2 = this.pizzaState.getTargetWorldPosition('.craft-visual-spacer') || new THREE.Vector3(-1.5, -0.3, 0);
    const p3 = new THREE.Vector3(0, 0.1, 0);
    const p4 = this.pizzaState.getTargetWorldPosition('.box-spacer') || new THREE.Vector3(0, 0, 0);

    let targetX = 0;
    let targetY = 0;

    console.log(`[Diagnostic] scrollProgress: ${this.scrollProgress}`);
    console.log(`[Diagnostic] Spacers: p1(${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}), p2(${p2.x.toFixed(2)}, ${p2.y.toFixed(2)}), p3(${p3.x.toFixed(2)}, ${p3.y.toFixed(2)}), p4(${p4.x.toFixed(2)}, ${p4.y.toFixed(2)})`);

    if (this.scrollProgress < 1) {
      const t = this.scrollProgress;
      targetX = THREE.MathUtils.lerp(p1.x, p2.x, t);
      targetY = THREE.MathUtils.lerp(p1.y, p2.y, t);
    } else if (this.scrollProgress < 2) {
      const t = this.scrollProgress - 1;
      targetX = THREE.MathUtils.lerp(p2.x, p3.x, t);
      targetY = THREE.MathUtils.lerp(p2.y, p3.y, t);
    } else {
      let t = 0;
      if (this.scrollProgress >= 2.65) {
        t = (this.scrollProgress - 2.65) / (3.0 - 2.65);
      }
      targetX = THREE.MathUtils.lerp(p3.x, p4.x, t);
      targetY = THREE.MathUtils.lerp(p3.y, p4.y, t);
      canvas.inBox = t > 0.05;
    }

    console.log(`[Diagnostic] Result position: x=${targetX.toFixed(2)}, y=${targetY.toFixed(2)}`);

    pizza.position.x = targetX;
    pizza.position.y = targetY;
  }

  private initScrollAnimations() {
    const pizzaCanvas = this.pizzaState.pizzaCanvas;
    if (!pizzaCanvas || !pizzaCanvas.pizzaGroup) return;

    const isDesktop = isPlatformBrowser(this.platformId) && window.innerWidth > 1024;
    if (!isDesktop) {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      return;
    }

    const pizza = pizzaCanvas.pizzaGroup;

    // Clean up previous ScrollTrigger
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    const m = this.pizzaState.getScaleMultiplier();

    // HERO initial state
    gsap.set(pizza.rotation, { x: Math.PI / 2, y: 0, z: 0 });
    gsap.set(pizza.scale, { x: 1.5 * m, y: 1.5 * m, z: 1.5 * m });

    this.scrollProgress = 0;
    this.updatePizzaPosition();


    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.scroll-container',
        start: 'top top',
        end: isDesktop ? '+=4000' : 'bottom bottom',
        scrub: 2.2,
        pin: isDesktop,
        onUpdate: (self) => {
          pizzaCanvas.resetIdleTimer();
          this.updatePizzaPosition();
        }
      },
      onUpdate: () => {
        this.updatePizzaPosition();
      }
    });

    // Set initial states (everything hidden except Hero title/badge)
    gsap.set('.hero-text .hero-title-group', { autoAlpha: 1, y: 0 });
    gsap.set('.hero-text .hero-desc', { autoAlpha: 0, y: 30 });
    gsap.set('.hero-text .hero-cta-group', { autoAlpha: 0, y: 30 });

    gsap.set('.craft-text .craft-title-group', { autoAlpha: 0, y: 30 });
    gsap.set('.craft-text .craft-desc', { autoAlpha: 0, y: 30 });
    gsap.set('.craft-text .features-list', { autoAlpha: 0, y: 30 });

    gsap.set('.ingredients-text .ingredients-title-group', { autoAlpha: 0, y: 30 });
    gsap.set('.ingredients-text .ingredients-desc', { autoAlpha: 0, y: 30 });
    gsap.set('.ingredients-text .ingredients-grid', { autoAlpha: 0 });
    gsap.set('.ing-card', { autoAlpha: 0, y: 20, scale: 0.95 });
    gsap.set('.ingredients-marquee', { autoAlpha: 0 });

    gsap.set('.order-form-container', { autoAlpha: 0 });
    gsap.set('.order-form-container > *', { autoAlpha: 0, y: 30 });
    gsap.set('.order-graphic-container', { autoAlpha: 0, y: 30 });

    tl.to(this, {
      scrollProgress: 3,
      duration: 18.0,
      ease: 'none'
    }, 0);

    // Pizza movements mapped to scroll progress (0 to 3) over timeline duration 18
    // Section 1 -> Section 2 (progress 0 to 1, time 0 to 4)
    tl.to(pizza.rotation, {
      x: 0.9,
      y: -0.25,
      z: 0.2,
      duration: 4.0, ease: 'power2.inOut'
    }, 0)
      .to(pizza.scale, {
        x: 1.1 * m, y: 1.1 * m, z: 1.1 * m,
        duration: 4.0, ease: 'power2.inOut'
      }, 0);

    // Section 2 -> Section 3 (progress 1 to 2, time 4 to 8)
    tl.to(pizza.rotation, {
      x: 0.7,
      y: 0.2,
      z: -0.3,
      duration: 4.0, ease: 'power2.inOut'
    }, 4.0)
      .to(pizza.scale, {
        x: 1.3 * m, y: 1.3 * m, z: 1.3 * m,
        duration: 4.0, ease: 'power2.inOut'
      }, 4.0);

    // Section 3 -> Section 4 (progress 2 to 3, time 8 to 18)
    tl.set('.pizza-viewport', { zIndex: 3 }, 15.8);

    tl.to(pizza.rotation, {
      x: Math.PI / 2, y: 0, z: 0,
      duration: 2.1, ease: 'power2.inOut'
    }, 15.9)
      .to(pizza.scale, {
        x: 0.95 * m, y: 0.95 * m, z: 0.95 * m,
        duration: 2.1, ease: 'power2.inOut'
      }, 15.9);

    // Toppings drop (time 8.0 to 13.5)
    tl.to(pizzaCanvas, {
      toppingProgress: 1,
      duration: 5.5, ease: 'power1.out'
    }, 8.9);


    // --- SECTION 1 TEXT TIMELINES (time 0.0 to 4.0) ---
    // Step 1: Hero Badge & Title
    tl.to('.hero-text .hero-title-group', {
      autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in'
    }, 0.8);

    // Step 2: Hero Description
    tl.to('.hero-text .hero-desc', {
      autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out'
    }, 1.3)
      .to('.hero-text .hero-desc', {
        autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in'
      }, 2.1);

    // Step 3: Hero CTAs & Stats
    tl.to('.hero-text .hero-cta-group', {
      autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out'
    }, 2.6)
      .to('.hero-text .hero-cta-group', {
        autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in'
      }, 3.5);


    // --- SECTION 2 TEXT TIMELINES (time 4.0 to 8.0) ---
    // Step 4: Craft Badge & Title
    tl.to('.craft-text .craft-title-group', {
      autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out'
    }, 4.1)
      .to('.craft-text .craft-title-group', {
        autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in'
      }, 4.9);

    // Step 5: Craft Description
    tl.to('.craft-text .craft-desc', {
      autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out'
    }, 5.4)
      .to('.craft-text .craft-desc', {
        autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in'
      }, 6.2);

    // Step 6: Craft Features List
    tl.to('.craft-text .features-list', {
      autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out'
    }, 6.7)
      .to('.craft-text .features-list', {
        autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in'
      }, 7.6);


    // --- SECTION 3 TEXT TIMELINES (time 8.0 to 14.5) ---
    tl.to('.ingredients-marquee', { autoAlpha: 1, duration: 0.4 }, 8.9)
      .to('.ingredients-marquee span', { xPercent: -40, ease: 'none', duration: 6.5 }, 9.0)
      .to('.ingredients-marquee', { autoAlpha: 0, duration: 0.4 }, 15.9);

    // Step 7: Ingredients Badge & Title
    tl.to('.ingredients-text .ingredients-title-group', {
      autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out'
    }, 8.1)
      .to('.ingredients-text .ingredients-title-group', {
        autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in'
      }, 8.9);

    // Step 8: Ingredients Description
    tl.to('.ingredients-text .ingredients-desc', {
      autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out'
    }, 8.1)
      .to('.ingredients-text .ingredients-desc', {
        autoAlpha: 0, y: -20, duration: 0.4, ease: 'power1.in'
      }, 8.9);


    // --- SECTION 4 TEXT TIMELINES (time 14.8 to 18.0) ---
    // Step 10: Order Form & Pizza Box
    tl.to('.order-form-container', { autoAlpha: 1, duration: 0.2 }, 15.9)
      .to('.order-form-container > *', {
        autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out'
      }, 15.9)
      .to('.order-graphic-container', {
        autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out'
      }, 15.9);
  }

  public addToCart(meal: MealItem) {
    this.cart.addMeal(meal._id, meal.title, meal.price, meal.imageUrl);
  }
}

