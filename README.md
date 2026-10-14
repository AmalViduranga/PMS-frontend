# PharmaFlow Enterprise Frontend

Modern, multi-project **Angular 18** frontend for the **PharmaFlow Pharmacy Management System**, containing two standalone web applications:
1. **Staff Portal & POS Terminal (`web`)**: Hospital/Retail pharmacy management, point-of-sale checkout, inventory, and back-office operations.
2. **Customer Storefront (`storefront`)**: Public pharmaceutical catalogue, prescription upload modal, and click-and-collect ordering.

---

## 1. Application Architecture

```
pharmaflow-frontend/
├── angular.json                     # Multi-project workspace definition
├── package.json
├── tsconfig.json
└── apps/
    ├── web/                         # Staff Admin & Point of Sale (Port 4200)
    │   ├── proxy.conf.json          # Proxies /api -> http://localhost:5000 (Gateway)
    │   ├── tsconfig.app.json
    │   └── src/
    │       ├── index.html
    │       ├── main.ts
    │       ├── styles.css           # Slate & Emerald dark glassmorphism design system
    │       └── app/
    │           ├── app.component.ts # Staff responsive sidebar layout
    │           ├── app.routes.ts    # Lazy loaded standalone feature routes
    │           ├── core/            # api.service.ts, auth.service.ts, auth.guard.ts
    │           └── features/        # (11 core pharmacy modules)
    │
    └── storefront/                  # Customer E-Commerce & Click-and-Collect (Port 4201)
        ├── proxy.conf.json          # Proxies /api -> http://localhost:5000 (Gateway)
        ├── tsconfig.app.json
        └── src/
            ├── index.html
            ├── main.ts
            ├── styles.css           # Clean health & wellness modern design system
            └── app/
                ├── app.component.ts # Customer storefront navigation & cart trigger
                ├── app.routes.ts    # Storefront catalogue & order routes
                ├── core/            # api.service.ts, customer-auth.service.ts, cart.service.ts
                └── features/        # Catalogue, Cart drawer, Orders, Auth modal
```

---

## 2. Port & Proxy Configuration

| Application | Port | Target Backend Proxy | Description |
| :--- | :---: | :---: | :--- |
| **Staff Web & POS** | `4200` | `http://localhost:5000` | Pharmacists, Cashiers, Inventory Managers, Admins |
| **Customer Storefront**| `4201` | `http://localhost:5000` | Public customers, prescription uploads, click-and-collect |

> **BFF Reverse Proxy Integration**: Both applications are preconfigured with `proxy.conf.json` forwarding all `/api` calls to the **PharmaFlow.Gateway** at `http://localhost:5000`. This enables HttpOnly session cookies without cross-origin domain cookie restrictions during local development.

---

## 3. Prerequisites

- **Node.js**: v20.x or v22.x LTS (Recommended: `v22.18.0` or higher)
- **npm**: v10.x or v11.x (Recommended: `11.7.0` or higher)

Check your environment:
```bash
node -v
npm -v
```

---

## 4. How to Navigate Between Repositories in Terminal

PharmaFlow is organized into two independent repositories side-by-side:
```
PMS New/
├── pharmaflow-backend/   <-- Backend repository
└── pharmaflow-frontend/  <-- You are here
```

### Switching to Backend from Frontend:
```powershell
# From pharmaflow-frontend directory:
cd ..\pharmaflow-backend
```

### Switching back to Frontend from Backend:
```powershell
# From pharmaflow-backend directory:
cd ..\pharmaflow-frontend
```

### Terminal Tips:
- **Relative Path Quick Switch**: Type `cd ..\pharmaflow-backend` in PowerShell or Git Bash.
- **VS Code / IDE Split Terminals**: Press `Ctrl + Shift + 5` to split your terminal panel so you can view Frontend and Backend logs side-by-side.

---

## 5. How to Run the Frontend Applications

### Step 1: Install Dependencies
From the `pharmaflow-frontend` directory:
```bash
npm install
```

### Step 2: Run the Staff Web & POS Application (Port 4200)
```bash
npm run start:web
```
- Open in browser: **`http://localhost:4200`**
- Staff & POS features:
  - First-time Admin bootstrap: `http://localhost:4200/bootstrap`
  - Staff Login: `http://localhost:4200/login`
  - Dashboard: `http://localhost:4200/dashboard`
  - POS Terminal: `http://localhost:4200/pos`
  - Batch Inventory & FEFO: `http://localhost:4200/inventory`
  - Catalogue & Drugs: `http://localhost:4200/catalogue`
  - Prescription Review: `http://localhost:4200/prescriptions`
  - Purchase Orders & Receiving: `http://localhost:4200/purchasing`
  - Sales Returns & Quarantine: `http://localhost:4200/returns`
  - Workforce & Shifts: `http://localhost:4200/workforce`
  - Financial Reporting & COGS: `http://localhost:4200/reporting`
  - Multi-Branch Hierarchy: `http://localhost:4200/branches`

### Step 3: Run the Customer Storefront Application (Port 4201)
In a separate terminal:
```bash
npm run start:storefront
```
- Open in browser: **`http://localhost:4201`**
- Customer features:
  - Medicine & Healthcare catalogue search and category filtering
  - Prescription Required (`Rx`) pills with upload triggers
  - Slide-out Cart Drawer with branch pickup selection
  - Order tracking and pickup confirmation

---

## 6. Build & Verification Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **Typecheck** | `npm run typecheck` | Validates TypeScript across all apps with `tsc --noEmit`. |
| **Build Web** | `npm run build:web` | Compiles production bundle for Staff Admin (`dist/web`). |
| **Build Storefront** | `npm run build:storefront` | Compiles production bundle for Storefront (`dist/storefront`). |
| **Build All** | `npm run build` | Compiles both applications sequentially. |

---

## 7. First-Time Setup & Manual Steps

1. **Ensure Backend Services are Running**:
   Before logging into the frontend, make sure the Gateway (`http://localhost:5000`), Identity (`http://localhost:5001`), and Operations (`http://localhost:5002`) services are running.
2. **Perform First-Admin Bootstrap**:
   - Navigate to `http://localhost:4200/bootstrap`.
   - Use the master bootstrap token: `PharmaFlowBootstrapKey2026!`.
   - Create your administrator account (e.g. username `admin`).
   - Sign in at `http://localhost:4200/login`.
3. **Set Up Initial Branch**:
   - Navigate to **Branches** (`/branches`) and ensure your active branch is set so inventory and POS can operate against that location.
