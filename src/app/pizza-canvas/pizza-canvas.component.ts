import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

@Component({
  selector: 'app-pizza-canvas',
  standalone: true,
  template: `<div #container class="canvas-container"></div>`,
  styles: [`
    .canvas-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class PizzaCanvasComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  private animationFrameId!: number;

  public pizzaGroup!: THREE.Group;
  public pizzaModelGroup!: THREE.Group;
  public isIdle = true;
  private lastScrollTime = 0;

  public toppingsList: THREE.Object3D[] = [];

  // Scroll-driven progress for topping drop animation (0 = hidden, 1 = fully placed)
  public toppingProgress = 0;

  // When true, disables idle floating (pizza is in the checkout box)
  public inBox = false;

  // Callback invoked once model + toppings are fully ready
  public onReadyCallback?: () => void;

  private platformId = inject(PLATFORM_ID);

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initThree();
      this.loadModelAndSetup();
      this.animate();
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer) this.renderer.dispose();
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (!isPlatformBrowser(this.platformId) || !this.camera || !this.renderer) return;
    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private initThree() {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Lighting rig for realism
    const ambient = new THREE.AmbientLight(0xffeedd, 0.7);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff5eb, 2.5);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.001;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xff8844, 0.6);
    fill.position.set(-5, -1, 2);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 1.2);
    rim.position.set(0, -6, -4);
    this.scene.add(rim);

    const top = new THREE.DirectionalLight(0xfff3e0, 1.0);
    top.position.set(0, 10, 0);
    this.scene.add(top);
  }

  private loadModelAndSetup() {
    this.pizzaGroup = new THREE.Group();
    this.scene.add(this.pizzaGroup);

    this.pizzaModelGroup = new THREE.Group();
    this.pizzaGroup.add(this.pizzaModelGroup);

    // ── Load textures ──────────────────────────────────────────────
    const tl = new THREE.TextureLoader();
    const colorMap = tl.load('assets/textures/PIZZA.jpg');
    const normalMap = tl.load('assets/textures/pizza_NORM.jpg');
    const aoMap = tl.load('assets/textures/pizza_AO.jpg');
    const specMap = tl.load('assets/textures/pizza_SPEC.jpg');

    // Flip textures for correct orientation
    colorMap.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.LinearSRGBColorSpace;

    const pizzaMat = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1.5, 1.5),
      aoMap: aoMap,
      aoMapIntensity: 1.0,
      roughnessMap: specMap,
      roughness: 0.75,
      metalness: 0.03,
      side: THREE.FrontSide,  // back faces are GPU-culled (no reversed texture)
    });

    // Ceramic plate material (white/off-white with subtle gloss, double-sided for clean backside)
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xE8E4DF,   // warm off-white ceramic
      roughness: 0.35,       // slightly glossy like glazed ceramic
      metalness: 0.0,
      side: THREE.DoubleSide, // Render clean white ceramic on both sides of the plate
    });

    // ── Load OBJ ──────────────────────────────────────────────────
    const objLoader = new OBJLoader();
    objLoader.load('assets/models/uploads_files_3029614_Pizza.obj', (obj) => {

      // The OBJ contains a flat background plane ("Plane") and a built-in plate ("Ceramic").
      // We keep the built-in plate and apply the clean ceramic plateMat to it,
      // and apply the pizzaMat to the pizza crust and cheese meshes.
      const toRemove: THREE.Object3D[] = [];
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const name = child.name.toLowerCase();

          // Remove only the flat background quad ("plane")
          if (name.includes('plane')) {
            toRemove.push(child);
            return;
          }

          // If the mesh is a multi-material mesh (child.material is an Array)
          if (Array.isArray(child.material)) {
            child.material = child.material.map((mat) => {
              const matName = mat.name ? mat.name.toLowerCase() : '';
              if (matName.includes('ceramic') || matName.includes('plate')) {
                return plateMat;
              } else {
                return pizzaMat;
              }
            });
          } else {
            // Fallback for single-material mesh
            const matName = child.material && child.material.name
              ? child.material.name.toLowerCase()
              : '';
            if (matName.includes('ceramic') || matName.includes('plate')) {
              child.material = plateMat;
            } else {
              child.material = pizzaMat;
            }
          }

          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      toRemove.forEach(m => m.removeFromParent());

      // ── Auto-scale: compute bounding box and normalize ─────────
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      // Target: the pizza should be ~2.8 Three.js units in diameter
      const targetSize = 2.8;
      const scaleFactor = targetSize / maxDim;
      obj.scale.setScalar(scaleFactor);

      // Re-center horizontally, but place bottom of plate exactly at Y = 0
      box.setFromObject(obj);
      const center = new THREE.Vector3();
      box.getCenter(center);

      obj.position.x = -center.x;
      obj.position.z = -center.z;
      obj.position.y = -box.min.y; // Bottom of plate rests exactly at Y = 0

      this.pizzaModelGroup.add(obj);

      // ── Add procedural toppings on top ───────────────
      this.addProceduralToppingsOnModel(scaleFactor);

      // Signal app.ts that we're ready to wire GSAP
      if (this.onReadyCallback) this.onReadyCallback();

    }, undefined, (err) => {
      console.error('OBJ load error:', err);
      // Fallback: just show procedural toppings
      this.addProceduralToppingsOnModel(1);
      if (this.onReadyCallback) this.onReadyCallback();
    });
  }

  private addProceduralToppingsOnModel(parentScale: number) {
    const pepMat = new THREE.MeshStandardMaterial({ color: 0xa82020, roughness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x6e0e0e, roughness: 0.4 });
    const mushMat = new THREE.MeshStandardMaterial({ color: 0xDBCBB4, roughness: 0.6 }); // light cream mushroom
    const mushStemMat = new THREE.MeshStandardMaterial({ color: 0xE8DFD0, roughness: 0.7 });
    const basilMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.8, side: THREE.DoubleSide });

    const makePep = (): THREE.Group => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.04, 24), pepMat);
      body.castShadow = true;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 24), darkMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.02;
      g.add(body, rim);
      return g;
    };

    const makeMushroom = (): THREE.Group => {
      const g = new THREE.Group();
      // Cap: half sphere
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mushMat);
      cap.rotation.x = Math.PI / 2;
      cap.position.y = 0.04;
      cap.castShadow = true;
      // Stem: cylinder
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 12), mushStemMat);
      stem.position.y = -0.02;
      stem.rotation.x = Math.PI / 2;
      stem.castShadow = true;
      g.add(cap, stem);
      g.rotation.z = Math.random() * Math.PI;
      return g;
    };

    const makeBasil = (): THREE.Group => {
      const g = new THREE.Group();
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.1, 0.15, 0, 0.25);
      shape.quadraticCurveTo(-0.1, 0.15, 0, 0);
      const leafGeo = new THREE.ShapeGeometry(shape);
      const leaf = new THREE.Mesh(leafGeo, basilMat);
      leaf.rotation.x = -Math.PI / 2;
      leaf.position.set(0, 0.01, -0.12);
      leaf.castShadow = true;
      g.add(leaf);
      g.rotation.y = Math.random() * Math.PI * 2;
      return g;
    };

    // Pepperonis (inner ring) — group 0
    const anglesPep = [0.3, 1.3, 2.4, 3.5, 4.6, 5.6];
    anglesPep.forEach((angle, i) => {
      const pep = makePep();
      const r = 0.85;
      pep.position.set(Math.cos(angle) * r, 1.5, Math.sin(angle) * r);
      pep.scale.setScalar(0);
      pep.userData['restY'] = 0.12;
      pep.userData['group'] = 0;
      pep.userData['groupIdx'] = i;
      pep.userData['groupSize'] = anglesPep.length;
      this.pizzaModelGroup.add(pep);
      this.toppingsList.push(pep);
    });

    // Mushrooms (middle ring) — group 1
    const anglesMush = [0.8, 1.8, 2.9, 4.0, 5.1, 6.1];
    anglesMush.forEach((angle, i) => {
      const mush = makeMushroom();
      const r = 0.6;
      mush.position.set(Math.cos(angle) * r, 1.5, Math.sin(angle) * r);
      mush.scale.setScalar(0);
      mush.userData['restY'] = 0.12;
      mush.userData['group'] = 1;
      mush.userData['groupIdx'] = i;
      mush.userData['groupSize'] = anglesMush.length;
      this.pizzaModelGroup.add(mush);
      this.toppingsList.push(mush);
    });

    // Basil Leaves (scattered) — group 2
    const anglesBasil = [0.0, 1.0, 2.0, 3.0, 4.1, 5.2];
    anglesBasil.forEach((angle, i) => {
      const basil = makeBasil();
      const r = 1.1;
      basil.position.set(Math.cos(angle) * r, 1.5, Math.sin(angle) * r);
      basil.scale.setScalar(0);
      basil.userData['restY'] = 0.12;
      basil.userData['group'] = 2;
      basil.userData['groupIdx'] = i;
      basil.userData['groupSize'] = anglesBasil.length;
      this.pizzaModelGroup.add(basil);
      this.toppingsList.push(basil);
    });
  }

  public resetIdleTimer() {
    this.isIdle = false;
    this.lastScrollTime = performance.now();
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    const time = performance.now() * 0.001;

    if (!this.isIdle && performance.now() - this.lastScrollTime > 1500) {
      this.isIdle = true;
    }

    // Spin model group constantly around local Y axis
    if (this.pizzaModelGroup) {
      this.pizzaModelGroup.rotation.y += 0.006;
    }

    // Animate toppings based on toppingProgress (driven by GSAP from parent)
    // Toppings drop one group at a time: pepperoni (0-0.33), mushrooms (0.33-0.66), basil (0.66-1.0)
    if (this.toppingsList.length > 0) {
      const numGroups = 3;
      const groupDuration = 1 / numGroups; // each group gets 1/3 of progress

      for (let i = 0; i < this.toppingsList.length; i++) {
        const top = this.toppingsList[i];
        const restY = top.userData['restY'] ?? 0.12;
        const group: number = top.userData['group'] ?? 0;
        const groupIdx: number = top.userData['groupIdx'] ?? 0;
        const groupSize: number = top.userData['groupSize'] ?? 6;

        // This group animates during [groupStart, groupEnd] of the overall progress
        const groupStart = group * groupDuration;
        const groupEnd = groupStart + groupDuration;

        // Within the group, stagger each individual topping
        const withinGroupRange = groupEnd - groupStart;
        const itemWindow = 0.6; // each item uses 60% of the group's range
        const itemStart = groupStart + (groupIdx / groupSize) * withinGroupRange * (1 - itemWindow);
        const itemEnd = itemStart + withinGroupRange * itemWindow;

        // Map toppingProgress to per-topping t (0 → 1)
        let t = (this.toppingProgress - itemStart) / (itemEnd - itemStart);
        t = Math.max(0, Math.min(1, t));

        // Ease-out cubic for smooth landing
        const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
        top.scale.setScalar(eased);
        top.position.y = 1.5 + (restY - 1.5) * eased;
      }
    }

    if (this.isIdle && this.pizzaGroup && !this.inBox) {
      this.pizzaGroup.position.y = Math.sin(time * 1.2) * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
