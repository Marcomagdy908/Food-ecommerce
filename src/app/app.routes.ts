import { Routes } from '@angular/router';
import { HomeComponent } from './features/meals/components/home/home.component';
import { MenuComponent } from './features/meals/components/menu/menu.component';
import { OrderComponent } from './features/meals/components/order/order.component';
import { ProfileComponent } from './features/meals/components/profile/profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'order', component: OrderComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: '' }
];
