import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MealsApiService } from '../../../meals/services/meals-api.service';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [DecimalPipe, RouterLink, FormsModule],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
  private readonly mealsApi = inject(MealsApiService);
  private readonly router = inject(Router);
  public readonly cart = inject(CartStateService);
  public readonly auth = inject(AuthService);

  // Address and state variables
  public street = signal('Zamalek, Cairo');
  public city = signal('Cairo');
  public orderSuccess = signal<string | null>(null);
  public errorMessageModal = signal<string | null>(null);
  public selectedAddress = signal('Guest');

  // Payment simulated transaction variables
  public paymentMethod = signal<string>('Cash'); // 'Cash' or 'Card'
  public cardNumber = signal<string>('');
  public cardExpiry = signal<string>('');
  public cardCvv = signal<string>('');
  public cardName = signal<string>('');
  public isProcessingPayment = signal<boolean>(false);
  public paymentStatusText = signal<string>('');

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
      // Authenticated but no saved addresses -> Default to custom form with empty street
      this.selectedAddress.set('Custom');
      this.street.set('');
      this.city.set('Cairo');
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

  public selectPaymentMethod(method: string) {
    this.paymentMethod.set(method);
  }

  public formatCardNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    let trim = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (trim.length > 16) {
      trim = trim.substring(0, 16);
    }
    const cardNums = [];
    for (let i = 0; i < trim.length; i += 4) {
      cardNums.push(trim.substring(i, i + 4));
    }
    const formatted = cardNums.join('-');
    this.cardNumber.set(formatted);
    input.value = formatted;
  }

  public formatExpiry(event: Event) {
    const input = event.target as HTMLInputElement;
    let trim = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (trim.length > 4) {
      trim = trim.substring(0, 4);
    }
    if (trim.length > 2) {
      trim = trim.substring(0, 2) + '/' + trim.substring(2);
    }
    this.cardExpiry.set(trim);
    input.value = trim;
  }

  public formatCvv(event: Event) {
    const input = event.target as HTMLInputElement;
    let trim = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (trim.length > 3) {
      trim = trim.substring(0, 3);
    }
    this.cardCvv.set(trim);
    input.value = trim;
  }

  public updateStreet(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) this.street.set(input.value);
  }

  public submitOrder(event: Event) {
    event.preventDefault();

    if (this.cart.items().length === 0) {
      this.errorMessageModal.set('Your cart is empty! Add some delicious meals first.');
      return;
    }

    if (!this.street().trim()) {
      this.errorMessageModal.set('Please enter a delivery address.');
      return;
    }

    // Card transaction validation
    if (this.paymentMethod() === 'Card') {
      const cardNumClean = this.cardNumber().replace(/-/g, '');
      if (cardNumClean.length !== 16) {
        this.errorMessageModal.set('Please enter a valid 16-digit credit card number.');
        return;
      }
      if (this.cardExpiry().length !== 5 || !this.cardExpiry().includes('/')) {
        this.errorMessageModal.set('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (this.cardCvv().length !== 3) {
        this.errorMessageModal.set('Please enter a valid 3-digit CVV code.');
        return;
      }
      if (!this.cardName().trim()) {
        this.errorMessageModal.set('Please enter the cardholder name.');
        return;
      }

      // Start loading simulation
      this.isProcessingPayment.set(true);
      this.paymentStatusText.set('Contacting safe secure payment gateway...');

      setTimeout(() => {
        this.paymentStatusText.set(`Authorizing transaction of $${this.grandTotal.toFixed(2)}...`);
      }, 1000);

      setTimeout(() => {
        this.paymentStatusText.set('Finalizing transaction with bank authorization...');
      }, 2200);

      setTimeout(() => {
        this.placeRealOrder();
      }, 3500);
    } else {
      // Cash payment -> Process instantly
      this.placeRealOrder();
    }
  }

  private placeRealOrder() {
    const items = this.cart.items().map(item => ({
      mealId: item.mealId.split('-')[0]!, // Extract base meal ID to check MongoDB
      quantity: item.quantity
    }));

    // Mock transaction reference
    const txnId = this.paymentMethod() === 'Card' 
      ? 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase() 
      : undefined;

    this.mealsApi.placeOrder({
      items,
      deliveryAddress: {
        street: this.street(),
        city: this.city()
      },
      paymentMethod: this.paymentMethod(),
      transactionId: txnId
    }).subscribe({
      next: (res) => {
        this.orderSuccess.set(`Order #${res._id.slice(-6).toUpperCase()} placed successfully!`);
        this.cart.clearCart();
        
        // Award points in database
        if (this.auth.isAuthenticated()) {
          this.auth.adjustPoints(100).subscribe({
            error: (err) => console.error('Failed to award points in database:', err)
          });
        }
        // Turn off loading simulation
        this.isProcessingPayment.set(false);

        // Redirect to live order tracking dashboard
        setTimeout(() => {
          this.router.navigate(['/orders', res._id, 'track']);
        }, 1500);
      },
      error: (err) => {
        console.error('Failed to place order:', err);
        this.errorMessageModal.set('Checkout failed: ' + (err.error?.message || err.message));
        this.isProcessingPayment.set(false);
      }
    });
  }
}
