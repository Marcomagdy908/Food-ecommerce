import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MealsApiService, MealItem } from '../../services/meals-api.service';
import { CartStateService } from '../../../cart/services/cart-state.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mealsApi = inject(MealsApiService);
  private readonly cart = inject(CartStateService);

  public allMeals: MealItem[] = [];
  public filteredMeals: MealItem[] = [];
  public activeCategory: string = 'Pizzas';

  // Category cards metadata matching the Stitch design
  public categories = [
    {
      name: 'Pizzas',
      icon: 'fa-solid fa-pizza-slice',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDovr-aFiAa3KwbRap736XGC95JBmllgk79WJnFXDtVLfEpz9Rtw5FwUsFMXuoLrkVooUF5xOdgS1OxoYfFKp9-DlS81L0UBlHQ_nGmA6gW8p1M-Wdej1l2iK8BWFovgp8vEOOIA4h36NvsNfmuqrSQiS3RQ65oUyUE5nVKwnozTshPsKY8ulXAg2UhxNHMdBQ0ChqT-7kc2U3QZQPAA6Io9gehxqKIVzra1ToaD82zKO3tX5FMiSh31_tXgp_ohHWodELCCbuoRBU'
    },
    {
      name: 'Pastas',
      icon: 'fa-solid fa-mound',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHAB-KICqKgroTBeMhHBy7xlyjNIqXz7-MzQ-Aruc71PVWkzwYtlgksRSEd6iNPrJVl1aWwetcx3P4lFWBwZVBsO8maNgE_PXtZS0Yo_rfVXWExnBkX4K2TbYD2o4U7F1DbLxGzAJTtjtJMOpJBR7bgnBurVL0qSGdYO9sgfGFbtNcPMP3IsPNI9ZGMaN93FC1yRKgYUZf2cbsque1xYXH8b0BhOTKajqfC9Y-khj-bXk3K9tDG99zklcqcuiWOiandOA1SadQIiY'
    },
    {
      name: 'Antipasti',
      icon: 'fa-solid fa-cheese',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpCjOlbcWh2VtkBk_ObZ3xeVmWPHJtIhQy_OXYKgIcu3E87N8J_8c0_Jw5iK7Mg0gBA8obsM0COWx_fzLeSn2RnLtbeJTpUw9DWd0bDMQhCmiANqaDabaiWauoPt5P67f1vcSqTLjmIanTQx-AcDHWUfWs0n2TxBXG3F1UClEpXox6HrODy_VJLzaD9Nh3wAOj28pSG3oGpzu9cDELJwiw6AW4hqPv8uK8LgHNWlcWKnZIf6wRGgmWiYSIZ93aRWa4_wu_sXlp67M'
    },
    {
      name: 'Drinks',
      icon: 'fa-solid fa-wine-glass-empty',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbWxxH-FG5Dzo5CbkMeqkvjzzULUmjdBh8zSU_taHlnO4ehzmeZzgJLKsWR9pQf7ykpCj4TL0_ObOCRDGhWByJsb1N11xDjEWE7kTM59chb9YrJr1eBOMH8ssl6LN-3GBycguimT3LfVfyivkR-fQY66CHOvCOuez5jjxJC9cXfGBWcQTq7Dva44Fe7Dt7Es9_EhY2ikzvVi0G2E8agzarE-fy5HSoMAw_DuU0cn9WWSwV9pX0soI3COnI3Hk3d0u21ClIfNexxIE'
    }
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.mealsApi.getMeals().subscribe({
        next: (data) => {
          this.allMeals = data;
          this.filterByCategory(this.activeCategory);
        },
        error: (err) => console.error('Failed to load meals in MenuComponent:', err)
      });
    }
  }

  public filterByCategory(category: string) {
    this.activeCategory = category;
    this.filteredMeals = this.allMeals.filter(m => m.category === category);
  }

  public addToCart(meal: MealItem) {
    this.cart.addMeal(meal._id, meal.title, meal.price, meal.imageUrl);
  }
}
