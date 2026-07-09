import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MealItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  tags?: string[];
  isAvailable?: boolean;
}

export interface PlaceOrderPayload {
  items: Array<{
    mealId: string;
    quantity: number;
  }>;
  deliveryAddress: {
    street: string;
    city: string;
  };
  paymentMethod?: string;
  transactionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MealsApiService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1';

  public getMeals(): Observable<MealItem[]> {
    return this.http.get<MealItem[]>(`${this.apiUrl}/meals`);
  }

  public getMealById(id: string): Observable<MealItem> {
    return this.http.get<MealItem>(`${this.apiUrl}/meals/${id}`);
  }

  public placeOrder(orderPayload: PlaceOrderPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders`, orderPayload);
  }

  public getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orders/my`);
  }
}
