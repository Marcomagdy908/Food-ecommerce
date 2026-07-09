import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap, catchError, of } from 'rxjs';

export interface UserAddress {
  label: string;
  street: string;
  city: string;
  coordinates?: number[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  savedAddresses: UserAddress[];
  joinedDate: string;
  points: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = '/api/v1/auth';

  // Signals for state management
  public currentUser = signal<User | null>(null);
  public authLoaded = signal<boolean>(false);
  public isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    // Only check authentication inside the browser (client-side)
    if (isPlatformBrowser(this.platformId)) {
      this.checkSession();
    } else {
      this.authLoaded.set(true);
    }
  }

  /**
   * Tries to fetch the current user profile on app startup.
   */
  private checkSession(): void {
    this.http.get<User>(`${this.apiUrl}/me`).pipe(
      catchError(() => {
        this.currentUser.set(null);
        this.authLoaded.set(true);
        return of(null);
      })
    ).subscribe((user) => {
      if (user) {
        this.currentUser.set({
          ...user,
          points: user.points ?? 0
        });
      }
      this.authLoaded.set(true);
    });
  }

  /**
   * Log in user with email and password.
   */
  public login(credentials: { email: string; password?: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, credentials).pipe(
      tap((user) => {
        this.currentUser.set({
          ...user,
          points: user.points ?? 0
        });
      })
    );
  }

  /**
   * Sign up user with name, email, and password.
   */
  public signup(profileData: { name: string; email: string; password?: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/signup`, profileData).pipe(
      tap((user) => {
        this.currentUser.set({
          ...user,
          points: user.points ?? 0
        });
      })
    );
  }

  /**
   * Log out current user (clears HTTP cookie on server).
   */
  public logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
      }),
      catchError((err) => {
        // Force state reset anyway
        this.currentUser.set(null);
        return of(err);
      })
    );
  }

  /**
   * Updates user's saved addresses.
   */
  public updateAddresses(addresses: UserAddress[]): Observable<any> {
    return this.http.put<{ savedAddresses: UserAddress[] }>(`${this.apiUrl}/addresses`, { addresses }).pipe(
      tap((res) => {
        const current = this.currentUser();
        if (current) {
          this.currentUser.set({
            ...current,
            savedAddresses: res.savedAddresses
          });
        }
      })
    );
  }

  /**
   * Updates user's profile details (Name, Email, Avatar URL).
   */
  public updateProfile(profileData: { name: string; email: string; avatarUrl: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, profileData).pipe(
      tap((user) => {
        this.currentUser.set(user);
      })
    );
  }

  /**
   * Adds or subtracts loyalty points in the database.
   */
  public adjustPoints(amount: number): Observable<{ points: number }> {
    return this.http.post<{ points: number }>(`${this.apiUrl}/points`, { amount }).pipe(
      tap((res) => {
        const current = this.currentUser();
        if (current) {
          this.currentUser.set({
            ...current,
            points: res.points
          });
        }
      })
    );
  }
}
