import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import * as THREE from 'three';
import { PizzaCanvasComponent } from '../components/pizza-canvas/pizza-canvas.component';

@Injectable({
  providedIn: 'root'
})
export class PizzaStateService {
  public pizzaCanvas?: PizzaCanvasComponent;
  public pizzaCanvasReady = new Subject<void>();
  
  // Track active page/route to adjust pizza behavior
  public activeRoute = signal<string>('/');

  public registerCanvas(canvas: PizzaCanvasComponent) {
    this.pizzaCanvas = canvas;
    this.pizzaCanvasReady.next();
  }

  public unregisterCanvas() {
    this.pizzaCanvas = undefined;
  }

  public getTargetWorldPosition(selector: string): THREE.Vector3 | null {
    if (!this.pizzaCanvas || !this.pizzaCanvas.camera) {
      return null;
    }
    const element = document.querySelector(selector);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const ndcX = (centerX / window.innerWidth) * 2 - 1;
    const ndcY = -(centerY / window.innerHeight) * 2 + 1;

    const camera = this.pizzaCanvas.camera;
    const tempV = new THREE.Vector3(ndcX, ndcY, 0.5);
    tempV.unproject(camera);
    const dir = tempV.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    return camera.position.clone().add(dir.multiplyScalar(distance));
  }

  public getScaleMultiplier(): number {
    if (typeof window === 'undefined') return 1.0;
    const w = window.innerWidth;
    if (w <= 480) return 0.65;
    if (w <= 1024) return 0.8;
    return 1.0;
  }
}
