import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CartStateService } from '../../../cart/services/cart-state.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  private readonly cart = inject(CartStateService);

  // Profile data matching Alessandro Ricci from the Stitch mockup
  public user = {
    name: 'Alessandro Ricci',
    email: 'alessandro.ricci@artisan-mail.com',
    memberStatus: 'Gold Member',
    joinedDate: 'Joined Jan 2023',
    points: 850,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQbn6jopJ1farg2CRYtzpiyBi_IZAYfbsUyAxSK8Uh005PhhSEJdwS1jx2ISgSkLPsDLtiM2tMUB0XvHFhuMy7nPV1fXeeODxPdxkPHMUGKcnghwalCeAKZ0KzS99MJiNCe-pm8g-hqvJSt5zzMIqkUw4PqYEpzx5oIHyalptrsX-pkpqjLuPrLUlWcwsaN2SrJDl_LKnX7unyYIyqds5-WQso_2td0JweODPu9i31fPXtvV58KNI_fvUyCslWkUiJjjpxklUeEHA',
    addresses: [
      { type: 'Home', street: '124 Via San Carlo, Apt 4B', city: 'New York, NY 10014' },
      { type: 'Studio', street: '88 Greenwich St, Floor 12', city: 'New York, NY 10006' }
    ]
  };

  // Recent order history items matching the mockup
  public recentOrders = [
    {
      title: 'Margherita Verace',
      description: 'Double Buffalo Mozzarella, Basil, Extra Virgin Olive Oil',
      price: 18.50,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt1Esa3Xi0oxc0GTsY_L_MigPHTB71BuzyOc9Zqa4u8mIA8iAykc2GQhxGh0hYhiel1B2Pqj6UhC34m0PM4aM5G3Wzye7o5XlnOOgRHZwn8fHoWYLzvs3CE6ElFu1E6CE1moA00Iprk8wqlMa7qz1_hJ-1a540ampqQI6xCB2jX93Nl4TJyA0rjDO15bO6bojJ3Ixf9A_eCQJmCQnP6OYtB0-bP9h0qJNib5ZVQreT0ZmqmjOLQrr1KkDcYwz5bhypmSZnGGCKYQ0'
    },
    {
      title: 'Diavola Arrabbiata',
      description: 'Spicy Salami, Hot Honey, Peperoncino, Red Onion',
      price: 21.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMXqVlRTuzYywih4CtUVnz2b7nemRITtReQCZJAG_U8L2m1XEdoVdLdmFqUskiUqWZPV5BIgJf6azFRyNl_3j8QEkGHqRqZzq8nrydlQOINqJ-qJQclBXON9DHLxVkl5Pt1Pbie8a_sH1XusuK_Lwn1rJbxSjvyCZZEvH_kI0_Zyubwd_6nZIc5kD8T3Ildc1hURVZnnEWAcaJvcP8bOnrldwTS_v6TjoO4IPxcWMTRX5Q3uo2amqGCTE2bfUFOlMsOCH7u80wbC0'
    },
    {
      title: 'Pistacchio e Mortadella',
      description: 'Ricotta Base, Mortadella Bologna, Pistachio Crumble',
      price: 24.50,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYPMy_uSTkvGo7EHBEfTQODTEVFetWv7N7piG-4dlbCTx97YKELBera9IRUoHKxGSSjCgx6Gla3yeK9-zqRy8ktPg4m0VBRUxs9XX6FjxytYjvWx83whbtlOf0LNUnz1cOzH8FtN87lFS8mvgpSgKpNKi0K_Z1CEyUGYik7PZOZNVt2ybP2yNXd-VNZm61mlZEhLMzQYM9_JEVsynEC5jzbYgmqIkdTYH1l2prwEv28bpR4dVsvLDiHkcThMB9evugUZ-NcGaD2Ls'
    }
  ];

  public reorder(order: { title: string, price: number, imageUrl?: string }) {
    // Generate a temporary ID format for cart items
    const mealId = 'temp-' + order.title.toLowerCase().replace(/ /g, '-');
    this.cart.addMeal(mealId, order.title, order.price, order.imageUrl);
    alert(`${order.title} added to your basket!`);
  }

  public logout() {
    alert('Logging out of Alessandro Ricci...');
  }
}
