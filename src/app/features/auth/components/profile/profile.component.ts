import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { AuthService, UserAddress } from '../../../../core/services/auth.service';
import { MealsApiService } from '../../../meals/services/meals-api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  public readonly auth = inject(AuthService);
  private readonly cart = inject(CartStateService);
  private readonly mealsApi = inject(MealsApiService);
  private readonly router = inject(Router);

  // Dynamic user data from service
  public currentUser = this.auth.currentUser;
  public authLoaded = this.auth.authLoaded;

  // Real order history list
  public recentOrders = signal<any[]>([]);

  // Add Address form states
  public isAddingAddress = signal<boolean>(false);
  public newAddressLabel = '';
  public newAddressStreet = '';
  public newAddressCity = '';

  // Account Settings / Profile Edit Form States
  public isEditingProfile = signal<boolean>(false);
  public isEditingAvatar = signal<boolean>(false);
  public editName = '';
  public editEmail = '';
  public editAvatarUrl = '';
  public selectedFileName = '';
  public profileErrorMessage = signal<string | null>(null);

  // NAPOLI rewards info
  public points = computed(() => this.currentUser()?.points ?? 0);
  public progressToReward = computed(() => {
    const pts = this.points();
    return Math.min(100, (pts / 1000) * 100);
  });
  public activeRewardCode = signal<string | null>(null);
  public feedbackMessage = signal<string | null>(null);
  public showRedeemConfirm = signal<boolean>(false);

  // Pre-configured elegant avatar presets to make editing photo easy
  public readonly avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80'
  ];

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.loadMyOrders();
    }
  }

  public loadMyOrders() {
    this.mealsApi.getMyOrders().subscribe({
      next: (data) => {
        this.recentOrders.set(data);
      },
      error: (err) => {
        console.error('Failed to load user orders:', err);
      }
    });
  }

  public toggleAddAddress() {
    this.isAddingAddress.update(val => !val);
    // Clear inputs
    this.newAddressLabel = '';
    this.newAddressStreet = '';
    this.newAddressCity = '';
  }

  public saveAddress() {
    if (!this.newAddressLabel || !this.newAddressStreet || !this.newAddressCity) {
      this.feedbackMessage.set('Please fill out all address fields.');
      return;
    }

    const currentAddresses = this.currentUser()?.savedAddresses || [];
    const updated = [
      ...currentAddresses,
      {
        label: this.newAddressLabel,
        street: this.newAddressStreet,
        city: this.newAddressCity
      }
    ];

    this.auth.updateAddresses(updated).subscribe({
      next: () => {
        this.toggleAddAddress();
      },
      error: (err) => {
        console.error('Failed to save address:', err);
        this.feedbackMessage.set('Could not save address. Please try again.');
      }
    });
  }

  public deleteAddress(index: number) {
    const currentAddresses = this.currentUser()?.savedAddresses || [];
    const updated = currentAddresses.filter((_, i) => i !== index);

    // Delete address directly to avoid native popups
    this.auth.updateAddresses(updated).subscribe({
      error: (err) => {
        console.error('Failed to delete address:', err);
        this.feedbackMessage.set('Could not delete address.');
      }
    });
  }

  // Edit Profile Info
  public toggleEditProfile() {
    const user = this.currentUser();
    if (user) {
      this.editName = user.name;
      this.editEmail = user.email;
      this.editAvatarUrl = user.avatarUrl || '';
    }
    this.profileErrorMessage.set(null);
    this.isEditingProfile.update(val => !val);
  }

  public saveProfile() {
    if (!this.editName || !this.editEmail) {
      this.profileErrorMessage.set('Name and Email are required.');
      return;
    }

    this.profileErrorMessage.set(null);
    this.auth.updateProfile({
      name: this.editName,
      email: this.editEmail,
      avatarUrl: this.editAvatarUrl
    }).subscribe({
      next: () => {
        this.isEditingProfile.set(false);
        this.feedbackMessage.set('Profile information updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        this.profileErrorMessage.set(err.error?.message || 'Failed to save changes. Email might be in use.');
      }
    });
  }

  // Edit Avatar Photo
  public toggleEditAvatar() {
    const user = this.currentUser();
    if (user) {
      this.editAvatarUrl = user.avatarUrl || '';
    }
    this.selectedFileName = '';
    this.isEditingAvatar.update(val => !val);
  }

  public onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.triggerAlert('Profile photo size must be smaller than 2MB.');
        return;
      }
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.editAvatarUrl = reader.result as string; // Base64 Data URL
      };
      reader.readAsDataURL(file);
    }
  }

  public selectPresetAvatar(url: string) {
    this.editAvatarUrl = url;
  }

  public saveAvatar() {
    const user = this.currentUser();
    if (!user) return;

    this.auth.updateProfile({
      name: user.name,
      email: user.email,
      avatarUrl: this.editAvatarUrl
    }).subscribe({
      next: () => {
        this.isEditingAvatar.set(false);
      },
      error: (err) => {
        console.error('Failed to update profile photo:', err);
        this.feedbackMessage.set('Could not save profile picture.');
      }
    });
  }

  // Redeem Rewards
  public redeemRewards() {
    if (this.points() < 1000) {
      this.feedbackMessage.set('You need at least 1,000 points to redeem a reward.');
      return;
    }

    this.showRedeemConfirm.set(true);
  }

  public confirmRedeem() {
    this.showRedeemConfirm.set(false);
    this.auth.adjustPoints(-1000).subscribe({
      next: () => {
        const voucher = 'NAPOLI-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        this.activeRewardCode.set(voucher);
        this.feedbackMessage.set(`Voucher successfully redeemed: ${voucher}`);
      },
      error: (err: any) => {
        console.error('Redemption failed:', err);
        this.feedbackMessage.set('Redemption failed: ' + (err.error?.message || err.message));
      }
    });
  }

  public triggerAlert(message: string) {
    this.feedbackMessage.set(message);
  }

  public reorder(order: any) {
    if (!order.items || order.items.length === 0) return;
    
    order.items.forEach((item: any) => {
      const mealId = item.mealId || 'temp-' + item.title.toLowerCase().replace(/ /g, '-');
      this.cart.addMeal(mealId, item.title, item.priceAtPurchase || item.price, '');
    });
    this.triggerAlert(`Items from order placed in your basket!`);
    this.router.navigate(['/order']);
  }

  public logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
