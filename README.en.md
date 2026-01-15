# HRIS Platform

[Bahasa Indonesia](README.md) | **English**

A comprehensive Human Resource Information System (HRIS) platform built with modern architecture to manage organizations, employees, leave, payroll, and attendance.

🔗 **Demo**: [hris.hasanaskari.com](https://hris.hasanaskari.com)
> **Demo Account**: To get demo account access, please contact me via:
> - 📧 Email: [hasanaskari.id@gmail.com](mailto:hasanaskari.id@gmail.com)
> - 🌐 Website: [hasanaskari.com](https://hasanaskari.com)

## ✨ Highlights

-   🌐 **Multi-Language** - Support Indonesian and English
-   📱 **WhatsApp Integration** - Automatic notifications via WhatsApp Bot (Baileys)
-   🐳 **Docker Ready** - Easy deployment with Docker Compose
-   🎨 **Modern UI** - Clean and responsive interface with Shadcn UI
-   🔐 **Role-Based Access** - Granular permission system (Owner, Admin, Employee)

## 🚀 Key Features

### 📊 Dashboard & Analytics
-   **Interactive Dashboard** - Real-time statistics for employees, departments, and activities
-   **Data Visualization** - Charts and graphs for business insights

### 🏢 Organization Management
-   **Company Management** - CRUD companies with independent configurations
-   **Departments & Positions** - Flexible hierarchical organizational structure
-   **Batch Generation** - Auto-generate standard departments

### 👥 HR Management
-   **Employee Management** - Complete profiles, work history, and documents
-   **User Management** - Manage Owner, Admin, and Employee accounts
-   **Role-Based Access Control** - Granular permissions per role

### ⏰ Activities & Attendance
-   **Attendance** - Employee check-in/check-out system
-   **Leave & Permits** - Leave/permit submission and approval
-   **Activity History** - Complete employee activity logs

### 💰 Payroll
-   **Salary Configuration** - Setup salary components (base, allowances, deductions)
-   **Payslips** - Auto-generate payslips (PDF)
-   **Payroll Dashboard** - Payroll overview per period
-   **PPh21 Calculator** - Automatic tax calculation

### 🔧 System Settings
-   **WhatsApp Bot** - Bot configuration and monitoring
-   **Notifications** - Setup notifications for various events
-   **Authentication** - Security and session settings

## 🛠️ Tech Stack

### Frontend (Web)
-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **UI Library**: Radix UI + Shadcn UI
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **Forms**: React Hook Form + Zod
-   **State**: React Hooks

### Backend (Web)
-   **Runtime**: Node.js
-   **Database**: SQLite (better-sqlite3)
-   **Authentication**: JWT (jose) + bcryptjs
-   **API**: Next.js API Routes

### Bot Service
-   **Framework**: Express.js
-   **WhatsApp**: Baileys (WhatsApp Web API)
-   **QR Code**: qrcode
-   **Logger**: Pino

### DevOps
-   **Containerization**: Docker + Docker Compose
-   **Monorepo**: npm Workspaces
-   **Process Manager**: Concurrently

## 📦 Installation & Setup

### Method 1: Docker Compose (Recommended)

1.  **Clone repository**
    ```bash
    git clone https://github.com/marhaendev/hris-platform.git
    cd hris-platform
    ```

2.  **Configure environment**
    ```bash
    cp .env.example .env
    # Edit .env as needed
    ```

3.  **Run with Docker Compose**
    
    **Development mode:**
    ```bash
    docker compose --profile development up -d
    ```
    
    **Production mode:**
    ```bash
    docker compose --profile production up -d
    ```

4.  **Access the application**
    - Web App: [http://localhost:3000](http://localhost:3000)
    - Bot API: [http://localhost:3001](http://localhost:3001)

### Method 2: Manual Installation

1.  **Clone repository**
    ```bash
    git clone https://github.com/marhaendev/hris-platform.git
    cd hris-platform
    ```

2.  **Install dependencies (Root)**
    ```bash
    npm install
    ```

3.  **Setup Web Application**
    ```bash
    cd web
    npm install
    npm run dev
    ```
    Web app will run at [http://localhost:3000](http://localhost:3000)

4.  **Setup Bot Service** (New terminal)
    ```bash
    cd bot
    npm install
    npm start
    ```
    Bot API will run at [http://localhost:3001](http://localhost:3001)

### Method 3: Workspace Mode (Recommended for Development)

```bash
# Install all dependencies
npm install

# Run web + bot together
npm run dev

# Or run separately:
npm run dev:web   # Web only
npm run dev:bot   # Bot only
```

## 📁 Project Structure

```
hris-platform/
├── web/                    # Next.js Web Application
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities & database
│   ├── data/             # SQLite database
│   └── public/           # Static assets
├── bot/                   # WhatsApp Bot Service
│   └── src/              # Bot source code
├── docs/                  # Documentation
├── docker-compose.yml     # Docker orchestration
└── package.json          # Root workspace config
```

## 🗄️ Database

This project uses **SQLite** with pre-filled demo data. The database will be auto-detected in both Docker and Host modes.

> **Database Note**: This project comes with a pre-configured SQLite database containing demo data. No need to setup the database from scratch.


## 🐳 Docker Commands

```bash
# Development
docker compose --profile development up -d
docker compose --profile development down

# Production
docker compose --profile production up -d
docker compose --profile production down

# View logs
docker compose logs -f web-dev
docker compose logs -f bot-dev

# Rebuild
docker compose --profile development up -d --build
```

## 📝 Environment Variables

Create `.env` file in project root:

```env
# Mode (development / production)
COMPOSE_PROFILES=development

# Project
PROJECT_NAME=hris

# Web Service
WEB_PORT=3000
WEB_DATABASE_URL="file:./data/sqlite/hris.db"

# Bot Service
BOT_PORT=3001
```

## 🤝 Contributing

This project is under active development. For contributions or questions, please contact me:

-   📧 Email: [hasanaskari.id@gmail.com](mailto:hasanaskari.id@gmail.com)
-   🌐 Website: [hasanaskari.com](https://hasanaskari.com)

---

**Built with ❤️ using Next.js and Baileys**
