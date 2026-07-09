import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MealsApiService } from '../../services/meals-api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-order-tracker',
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink],
  templateUrl: './order-tracker.component.html',
  styleUrls: ['./order-tracker.component.css']
})
export class OrderTrackerComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly mealsApi = inject(MealsApiService);

  // States
  public order = signal<any | null>(null);
  public isLoading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);
  public infoMessageModal = signal<string | null>(null);
  public now = signal<Date>(new Date());

  // Leaflet Map Handles
  private map: any = null;
  private restaurantMarker: any = null;
  private customerMarker: any = null;
  private riderMarker: any = null;

  // Polling & timer subscriptions
  private pollSub?: Subscription;
  private timerSub?: Subscription;

  // Computeds
  public etaTime = computed(() => {
    const ord = this.order();
    if (!ord) return null;
    const created = new Date(ord.createdAt);
    return new Date(created.getTime() + 30 * 60 * 1000); // 30 minutes delivery ETA
  });

  public minutesRemaining = computed(() => {
    const eta = this.etaTime();
    if (!eta) return 0;
    
    // If order is already delivered, remaining time is 0
    if (this.order()?.status === 'Delivered') {
      return 0;
    }

    const diffMs = eta.getTime() - this.now().getTime();
    return Math.max(0, Math.round(diffMs / 60000));
  });

  public currentStepIndex = computed(() => {
    const ord = this.order();
    if (!ord) return 0;
    if (ord.status === 'Cancelled') return -1;

    switch (ord.status) {
      case 'Pending':
        return 1;
      case 'Preparing':
        const elapsedMinutes = Math.round((this.now().getTime() - new Date(ord.createdAt).getTime()) / 60000);
        if (elapsedMinutes >= 6) {
          return 3; // In Oven
        }
        return 2; // Preparing
      case 'OutForDelivery':
        return 4;
      case 'Delivered':
        return 5;
      default:
        return 1;
    }
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadOrderDetails(id);
        
        if (isPlatformBrowser(this.platformId)) {
          // Setup status polling every 15 seconds
          this.pollSub = interval(15000).subscribe(() => this.pollOrderStatus(id));
          
          // Setup remaining minutes timer ticker every 5 seconds
          this.timerSub = interval(5000).subscribe(() => {
            this.now.set(new Date());
            this.updateRiderMarkerPosition();
          });
        }
      }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initMap();
      }, 300);
    }
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    this.timerSub?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    if (!isPlatformBrowser(this.platformId)) return;
    const L = (window as any).L;
    if (!L) {
      console.warn('Leaflet library is not loaded from CDN yet.');
      return;
    }

    // Initialize Leaflet map centered at midpoint between restaurant and customer
    this.map = L.map('map-canvas', {
      zoomControl: false,
      attributionControl: false
    }).setView([30.0498, 31.2286], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    // Custom divIcon template elements for Restaurant and Customer
    const originIcon = L.divIcon({
      className: 'custom-leaflet-pin-wrapper',
      html: `
        <div class="map-label-card">
          <i class="fa-solid fa-pizza-slice" style="margin-right: 0.25rem;"></i>
          <span>Bella Napoli</span>
        </div>
        <div class="pin-bullet origin"></div>
      `,
      iconSize: [110, 42],
      iconAnchor: [55, 42]
    });

    const destinationIcon = L.divIcon({
      className: 'custom-leaflet-pin-wrapper',
      html: `
        <div class="map-label-card destination">
          <i class="fa-solid fa-house-chimney" style="margin-right: 0.25rem;"></i>
          <span>You</span>
        </div>
        <div class="pin-bullet destination"></div>
      `,
      iconSize: [70, 42],
      iconAnchor: [35, 42]
    });

    this.restaurantMarker = L.marker([30.0596, 31.2241], { icon: originIcon }).addTo(this.map);
    this.customerMarker = L.marker([30.0401, 31.2332], { icon: destinationIcon }).addTo(this.map);

    this.updateRiderMarkerPosition();
  }

  private updateRiderMarkerPosition() {
    if (!isPlatformBrowser(this.platformId) || !this.map) return;
    const L = (window as any).L;
    if (!L) return;

    const step = this.currentStepIndex();
    let coords: [number, number] = [30.0596, 31.2241]; // Default at restaurant
    let riderStatus = 'Kitchen';

    if (step <= 3) {
      coords = [30.0596, 31.2241];
      riderStatus = 'Kitchen';
    } else if (step === 4) {
      // Simulating en route coordinate at midpoint
      coords = [30.0498, 31.2286];
      riderStatus = 'Marco is en route';
    } else if (step === 5) {
      coords = [30.0401, 31.2332];
      riderStatus = 'Arrived';
    }

    const riderIcon = L.divIcon({
      className: 'custom-leaflet-pin-wrapper',
      html: `
        <div class="map-label-card rider">
          <i class="fa-solid fa-motorcycle" style="margin-right: 0.25rem;"></i>
          <span>${riderStatus}</span>
        </div>
        <div class="pin-bullet rider">
          <span class="ping-pulse"></span>
        </div>
      `,
      iconSize: [130, 42],
      iconAnchor: [65, 42]
    });

    if (!this.riderMarker) {
      this.riderMarker = L.marker(coords, { icon: riderIcon }).addTo(this.map);
    } else {
      this.riderMarker.setLatLng(coords);
      this.riderMarker.setIcon(riderIcon);
    }
  }

  private loadOrderDetails(id: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mealsApi.getOrderById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.isLoading.set(false);
        // If map was initialized prior to data load, sync rider positions
        setTimeout(() => this.updateRiderMarkerPosition(), 200);
      },
      error: (err) => {
        console.error('Failed to load order:', err);
        this.errorMessage.set('We couldn\'t load tracking details for this order.');
        this.isLoading.set(false);
      }
    });
  }

  private pollOrderStatus(id: string) {
    this.mealsApi.getOrderById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.updateRiderMarkerPosition();
      },
      error: (err) => console.error('Failed to poll order status:', err)
    });
  }

  public zoomIn() {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  public zoomOut() {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  public triggerAlert(message: string) {
    this.infoMessageModal.set(message);
  }
}
