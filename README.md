# TrackSwift &nbsp;🚀
*A full-stack financial management application built with the MERN stack.*

## Table of Contents
1. [Key Features](#key-features)  
2. [Tech Stack](#tech-stack)  
3. [Project Structure](#project-structure)  
4. [Prerequisites](#prerequisites)  
5. [Quick Start (5 min)](#quick-start-5-min)  
6. [Detailed Installation](#detailed-installation)  
   1. [Backend](#backend)  
   2. [Frontend](#frontend)  
   3. [Docker Compose (optional)](#docker-compose-optional)  
7. [Environment Variables](#environment-variables)  
8. [NPM Scripts Reference](#npm-scripts-reference)  
9. [Default Credentials](#default-credentials)  
10. [Troubleshooting](#troubleshooting)  
11. [Roadmap](#roadmap)  
12. [License](#license)  

## Key Features
* **Authentication** – Single admin stored in `config/admin.json` + UI-managed users.  
* **Dashboard** – Sales, expenses, profit, recent activity, low-stock alerts.  
* **Vendors** – Full CRUD, invoice aggregation, CSV export.  
* **Invoices** – Multi-invoice per vendor, balance tracking, branded PDF download.  
* **Inventory** – Real-time stock, low-stock warnings, valuation by bought price.  
* **Sales** – Itemised sales, credit handling, stock auto-deduction.  
* **Expenses** – Categorised expenses that affect profit analytics.  
* **Reports** – PDF & CSV exports for sales, expenses, inventory.  
* **Currency** – All monetary values formatted in OMR.  

## Tech Stack
| Layer      | Technology |
|------------|------------|
| Frontend   | React 18, React Router DOM 6, Axios, React Query, Tailwind CSS, Recharts |
| Backend    | Node.js 18, Express 4, MongoDB 6 (Mongoose 7) |
| Auth       | JSON Web Tokens, bcryptjs |
| PDF/CSV    | Puppeteer, fast-csv |
| Dev & Ops  | React Scripts, Nodemon, PM2, Docker Compose |

## Project Structure
```
trackswift/
├── backend/
│   ├── config/           # DB config + admin.json
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth & misc
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── utils/            # pdfGenerator, csvExporter
│   ├── uploads/          # Company logo, file uploads
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/   # Reusable UI
    │   ├── pages/        # Route pages
    │   ├── services/     # Axios instance
    │   ├── context/      # Auth provider
    │   ├── utils/        # helpers
    │   ├── App.js
    │   └── index.js
    ├── tailwind.config.js
    └── package.json
```

## Prerequisites
* **Node.js 16+** – https://nodejs.org  
* **MongoDB Community 4.4+** (local or Atlas)  
* **Git**  
* (Optional) **Docker Engine 20+**

## Quick Start (5 min)

```bash
# 1. Clone
git clone https://github.com/your-org/trackswift.git
cd trackswift

# 2. Backend
cd backend
cp .env.example .env         # edit if needed
npm install
npm run dev                  # http://localhost:5000

# 3. Frontend (new terminal)
cd ../frontend
npm install
npm start                    # http://localhost:3000

# 4. Login
Username: admin
Password: admin123
```

## Detailed Installation

### Backend
```bash
cd trackswift/backend

# Environment
cp .env.example .env
# sample values
# MONGODB_URI=mongodb://localhost:27017/trackswift
# JWT_SECRET=super-secret
# FRONTEND_URL=http://localhost:3000
# PORT=5000

# Install & run
npm install
npm run dev            # hot-reload with nodemon
```
*Change the admin password immediately after first login – Users → Admin → Edit.*

### Frontend
```bash
cd trackswift/frontend

# (Optional) point to remote API
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

npm install
npm start
```
The React dev-server opens at `http://localhost:3000`.

### Docker Compose (optional)
```
docker compose up -d          # builds frontend + backend + MongoDB
```
Edit `docker-compose.yml` to tweak ports, volumes, replicas.

## Environment Variables
| Variable           | Location   | Default               | Purpose                            |
|--------------------|------------|-----------------------|------------------------------------|
| MONGODB_URI        | backend    | mongodb://localhost…  | Mongo connection string            |
| JWT_SECRET         | backend    | *change-me*           | JWT signing key                    |
| PORT               | backend    | 5000                  | Express port                       |
| FRONTEND_URL       | backend    | http://localhost:3000 | CORS origin                        |
| REACT_APP_API_URL  | frontend   | http://localhost:5000/api | Axios base URL                 |

## NPM Scripts Reference

| Folder   | Script          | What it does                                 |
|----------|-----------------|----------------------------------------------|
| backend  | `npm run dev`   | Nodemon + auto-reload                        |
| backend  | `npm start`     | Production server                            |
| backend  | `npm test`      | *(placeholder)* unit tests                   |
| frontend | `npm start`     | React dev-server with HMR                    |
| frontend | `npm run build` | Production build to `/build`                 |
| frontend | `npm test`      | React tests                                  |

## Default Credentials
| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | `admin`  | `admin123`|

**Change these immediately** → Settings → Users.

## Troubleshooting

| Symptom                                                    | Fix |
|------------------------------------------------------------|-----|
| `Cannot find module 'ajv/dist/compile/codegen'` when `npm start` (frontend) | Delete `node_modules` & `package-lock.json`, run:`npm cache clean --force``npm install` |
| Frontend shows **CORS** error                              | Ensure `FRONTEND_URL` in backend `.env` matches browser origin |
| MongoDB connection refused                                 | Check `MONGODB_URI`, ensure Mongo service is running |
| Port `3000` or `5000` already in use                       | `set PORT=3001` (Win) / `PORT=3001 npm start` (Unix) |
| PDF downloads are blank                                    | Put your logo at `backend/uploads/logo.png` or adjust `pdfGenerator.js` |

## Roadmap
* Mobile PWA & offline mode  
* Purchase-order & barcode scanning  
* Multi-currency support  
* Role-based permissions  
* Unit & integration test coverage  

## License
MIT — © 2025 TrackSwift Contributors"# trackswift-frontend" 
