import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealsApiService } from '../../../meals/services/meals-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  private readonly mealsApi = inject(MealsApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // UI Tabs State
  public activeTab = signal<string>('overview');
  public feedbackMessage = signal<string | null>(null);
  public orderStatusFeedback = signal<Record<string, { message: string, isError: boolean }>>({});

  // Data Stores
  public orders = signal<any[]>([]);
  public meals = signal<any[]>([]);
  public errorLogs = signal<any[]>([]);
  public isLoading = signal<boolean>(true);

  // New Meal Form States
  public newMealTitle = '';
  public newMealDesc = '';
  public newMealPrice = 12.50;
  public newMealCategory = 'Pizzas';
  public newMealTags = '';
  public newMealImageUrl = '';
  public selectedFileName = '';

  // Revenue & Activity statistics (Signals Computed)
  public nonCancelledOrders = computed(() => 
    this.orders().filter(o => o.status !== 'Cancelled')
  );

  public totalRevenue = computed(() => {
    let sum = 0;
    this.nonCancelledOrders().forEach(o => sum += o.totalPrice);
    return sum;
  });

  public averageOrderValue = computed(() => {
    const list = this.nonCancelledOrders();
    return list.length > 0 ? this.totalRevenue() / list.length : 0;
  });

  public activeOrdersCount = computed(() => 
    this.orders().filter(o => ['Pending', 'Preparing', 'OutForDelivery'].includes(o.status)).length
  );

  public deliveredOrdersCount = computed(() => 
    this.orders().filter(o => o.status === 'Delivered').length
  );

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
    this.loadAllData();
  }

  public changeTab(tabName: string) {
    this.activeTab.set(tabName);
  }

  public logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  public loadAllData() {
    this.isLoading.set(true);
    this.mealsApi.getAllOrders().subscribe({
      next: (ordersData) => {
        this.orders.set(ordersData);
        
        this.mealsApi.getMeals().subscribe({
          next: (mealsData) => {
            this.meals.set(mealsData);
            
            this.mealsApi.getErrorLogs().subscribe({
              next: (errorsData) => {
                this.errorLogs.set(errorsData);
                this.isLoading.set(false);
              },
              error: (err) => {
                console.error('Failed to load error logs:', err);
                this.isLoading.set(false);
              }
            });
          },
          error: (err) => {
            console.error('Failed to load meals list:', err);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load orders list:', err);
        this.isLoading.set(false);
      }
    });
  }

  public onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.feedbackMessage.set('Meal image must be smaller than 5MB.');
        return;
      }
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.newMealImageUrl = reader.result as string; // Base64 encoding
      };
      reader.readAsDataURL(file);
    }
  }

  public submitNewMeal() {
    if (!this.newMealTitle || !this.newMealDesc || !this.newMealImageUrl) {
      this.feedbackMessage.set('Please fill out the title, description, and upload a photo.');
      return;
    }

    const tagsArr = this.newMealTags
      ? this.newMealTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    const payload = {
      title: this.newMealTitle,
      description: this.newMealDesc,
      price: Number(this.newMealPrice),
      category: this.newMealCategory,
      tags: tagsArr,
      imageUrl: this.newMealImageUrl
    };

    this.mealsApi.createMeal(payload).subscribe({
      next: () => {
        this.feedbackMessage.set(`Successfully added new meal: ${this.newMealTitle}!`);
        // Reset form
        this.newMealTitle = '';
        this.newMealDesc = '';
        this.newMealPrice = 12.50;
        this.newMealCategory = 'Pizzas';
        this.newMealTags = '';
        this.newMealImageUrl = '';
        this.selectedFileName = '';
        // Reload
        this.loadAllData();
      },
      error: (err) => {
        console.error('Failed to create meal:', err);
        this.feedbackMessage.set('Failed to save meal: ' + (err.error?.message || err.message));
      }
    });
  }

  public updateOrderStatus(orderId: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;

    this.mealsApi.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.orderStatusFeedback.update(prev => ({
          ...prev,
          [orderId]: { message: `Updated to ${newStatus}`, isError: false }
        }));
        
        setTimeout(() => {
          this.orderStatusFeedback.update(prev => {
            const next = { ...prev };
            delete next[orderId];
            return next;
          });
        }, 3000);

        this.loadAllData();
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        const errMsg = err.error?.message || err.message || 'Error updating';
        this.orderStatusFeedback.update(prev => ({
          ...prev,
          [orderId]: { message: errMsg, isError: true }
        }));

        setTimeout(() => {
          this.orderStatusFeedback.update(prev => {
            const next = { ...prev };
            delete next[orderId];
            return next;
          });
        }, 5000);
      }
    });
  }
}
