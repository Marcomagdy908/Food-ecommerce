import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/components/home/home.component';
import { MenuComponent } from './features/meals/components/menu/menu.component';
import { OrderComponent } from './features/orders/components/order/order.component';
import { ProfileComponent } from './features/auth/components/profile/profile.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { SignupComponent } from './features/auth/components/signup/signup.component';
import { MealDetailComponent } from './features/meals/components/meal-detail/meal-detail.component';
import { OrderTrackerComponent } from './features/orders/components/order-tracker/order-tracker.component';
import { AdminComponent } from './features/admin/components/admin/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'order', component: OrderComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'meals/:id', component: MealDetailComponent },
  { path: 'orders/:id/track', component: OrderTrackerComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];
