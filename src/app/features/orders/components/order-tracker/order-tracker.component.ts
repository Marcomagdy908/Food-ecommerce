import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MealsApiService } from '../../../meals/services/meals-api.service';
import { Subscription, interval, Observer } from 'rxjs';

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
  private customerCoords: [number, number] = [30.0401, 31.2332]; // Default: Cairo center

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
    const paramObserver: Observer<any> = {
      next: (params) => {
        const id = params.get('id');
        if (id) {
          this.loadOrderDetails(id);
          
          if (isPlatformBrowser(this.platformId)) {
            // Setup status polling every 15 seconds
            this.pollSub = interval(15000).subscribe({
              next: () => this.pollOrderStatus(id),
              error: (err) => console.error('Polling error:', err),
              complete: () => {}
            });
            
            // Setup remaining minutes timer ticker every 5 seconds
            this.timerSub = interval(5000).subscribe({
              next: () => {
                this.now.set(new Date());
                this.updateRiderMarkerPosition();
              },
              error: (err) => console.error('Timer error:', err),
              complete: () => {}
            });
          }
        }
      },
      error: (err) => console.error('Failed to resolve route params:', err),
      complete: () => {}
    };

    this.route.paramMap.subscribe(paramObserver);
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initMap();
        const ord = this.order();
        if (ord && ord.deliveryAddress) {
          this.geocodeAddressAndSetMarker(ord.deliveryAddress.street, ord.deliveryAddress.city);
        }
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
    this.customerMarker = L.marker(this.customerCoords, { icon: destinationIcon }).addTo(this.map);

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
      // Offset slightly north to prevent overlapping with restaurant label
      coords = [30.0596 + 0.0006, 31.2241];
      riderStatus = 'Kitchen';
    } else if (step === 4) {
      // Simulating en route coordinate at midpoint between restaurant and customer
      coords = [
        (30.0596 + this.customerCoords[0]) / 2,
        (31.2241 + this.customerCoords[1]) / 2
      ];
      riderStatus = 'Marco is en route';
    } else if (step === 5) {
      // Offset slightly north to prevent overlapping with customer label
      coords = [this.customerCoords[0] + 0.0006, this.customerCoords[1]];
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

  private geocodeAddressAndSetMarker(street: string, city: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    const fullAddress = `${street}, ${city}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          this.updateCustomerAndRiderMarkers(lat, lon);
        } else {
          this.fallbackGeocode(fullAddress);
        }
      })
      .catch(err => {
        console.warn('Geocoding failed, using fallback:', err);
        this.fallbackGeocode(fullAddress);
      });
  }

  private fallbackGeocode(address: string) {
    // Generate simple deterministic hash of the address
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate coordinate within a realistic Cairo range near the Zamalek restaurant [30.0596, 31.2241]
    const latMin = 30.03;
    const latMax = 30.07;
    const lonMin = 31.20;
    const lonMax = 31.25;

    const normalizedLat = Math.abs((hash % 1000) / 1000);
    const normalizedLon = Math.abs(((hash >> 3) % 1000) / 1000);

    const lat = latMin + normalizedLat * (latMax - latMin);
    const lon = lonMin + normalizedLon * (lonMax - lonMin);

    this.updateCustomerAndRiderMarkers(lat, lon);
  }

  private updateCustomerAndRiderMarkers(lat: number, lon: number) {
    if (!this.map) return;
    const L = (window as any).L;
    if (!L) return;

    this.customerCoords = [lat, lon];

    if (this.customerMarker) {
      this.customerMarker.setLatLng(this.customerCoords);
    }

    // Recalculate rider coordinates based on new customer location
    this.updateRiderMarkerPosition();

    // Re-adjust map viewport bounds to fit both points cleanly
    const bounds = L.latLngBounds([
      [30.0596, 31.2241], // Restaurant
      this.customerCoords   // Customer
    ]);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  private loadOrderDetails(id: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const orderLoadObserver: Observer<any> = {
      next: (data) => {
        this.order.set(data);
        this.isLoading.set(false);
        if (data && data.deliveryAddress) {
          this.geocodeAddressAndSetMarker(data.deliveryAddress.street, data.deliveryAddress.city);
        } else {
          setTimeout(() => this.updateRiderMarkerPosition(), 200);
        }
      },
      error: (err) => {
        console.error('Failed to load order:', err);
        this.errorMessage.set('We couldn\'t load tracking details for this order.');
        this.isLoading.set(false);
      },
      complete: () => {}
    };

    this.mealsApi.getOrderById(id).subscribe(orderLoadObserver);
  }

  private pollOrderStatus(id: string) {
    const orderPollObserver: Observer<any> = {
      next: (data) => {
        const prevOrder = this.order();
        this.order.set(data);
        if (data && data.deliveryAddress) {
          const prevAddress = prevOrder ? `${prevOrder.deliveryAddress.street}, ${prevOrder.deliveryAddress.city}` : '';
          const currentAddress = `${data.deliveryAddress.street}, ${data.deliveryAddress.city}`;
          if (currentAddress !== prevAddress) {
            this.geocodeAddressAndSetMarker(data.deliveryAddress.street, data.deliveryAddress.city);
          } else {
            this.updateRiderMarkerPosition();
          }
        } else {
          this.updateRiderMarkerPosition();
        }
      },
      error: (err) => console.error('Failed to poll order status:', err),
      complete: () => {}
    };

    this.mealsApi.getOrderById(id).subscribe(orderPollObserver);
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
