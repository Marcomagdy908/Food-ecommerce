# 🍕 Bella Napoli - Premium Artisanal Pizza Storefront

Bella Napoli is a premium, full-stack food e-commerce application featuring a modern, interactive storefront for artisanal pizza ordering, a live delivery tracker with real-time map simulation, and an administrator dashboard.

---

## 🛠️ Technology Stack

- **Frontend**: Angular 21, Signals, SSR (Server-Side Rendering), Leaflet.js Maps, Vanilla CSS (rich custom themes)
- **Backend**: Node.js, Express.js (Modular Controllers and API Routes)
- **Database**: MongoDB via Mongoose (Schemas for Users, Meals, Orders, and Error Logs)
- **Security**: JWT-based session authentication set via secure HTTP-Only cookies

---

## ✨ Features

- **Dynamic Storefront**: Browse authentic Italian pizzas, pastas, desserts, and fresh drinks.
- **Custom Pizza Configurator**: Customize pizza size, dough types, and extra toppings with real-time price updates.
- **Secured Checkout**: Checkout is secured to authenticated users only. Unauthenticated users are redirected to login with automatic return redirects.
- **Live Order Tracking**: An interactive map powered by Leaflet.js tracks real-time status updates from the kitchen, to oven, en route, and final delivery.
- **Admin Dashboard**: Secure management interface to view system logs and monitor overall order status.
- **Napoli Rewards**: Loyalty system awarding points for successfully completed orders.

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally or access to a MongoDB Atlas cluster)

### 🔧 Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Database Connection** (Optional):
   By default, the server connects to a local MongoDB instance at `mongodb://127.0.0.1:27017/slicecraft`. You can override this using the `MONGODB_URI` environment variable.

3. **Seed Database**:
   Populate your database with authentic Italian meals, dummy users, and sample orders:
   ```bash
   npm run db:seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to **`http://localhost:4200/`**. The dev server proxies API calls to the Express server running behind the scenes.

---

## 📜 Available Scripts

- **`npm run dev` / `npm start`**: Runs the Angular development server.
- **`npm run build`**: Compiles the client browser and server SSR bundles into the `dist/` directory.
- **`npm run db:seed`**: Clears and seeds the MongoDB database with initial sample data.
- **`npm run test`**: Runs unit tests using the configured test runner.
