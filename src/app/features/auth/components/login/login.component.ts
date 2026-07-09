import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Input states
  public email = '';
  public password = '';

  // Form handling states
  public errorMessage = signal<string | null>(null);
  public isLoading = signal<boolean>(false);

  public onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        if (user && user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please try again.');
      }
    });
  }
}
