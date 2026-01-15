# HRIS Platform

**Bahasa Indonesia** | [English](README.en.md)

Platform Sistem Informasi Sumber Daya Manusia (HRIS) yang komprehensif, dibangun dengan arsitektur modern untuk mengelola organisasi, karyawan, cuti, penggajian, dan absensi.

🔗 **Demo**: [hris.hasanaskari.com](https://hris.hasanaskari.com)
> **Akun Demo**: Untuk mendapatkan akses akun demo, silakan hubungi saya melalui:
> - 📧 Email: [hasanaskari.id@gmail.com](mailto:hasanaskari.id@gmail.com)
> - 🌐 Website: [hasanaskari.com](https://hasanaskari.com)

## ✨ Highlights

-   🌐 **Multi-Language** - Mendukung Bahasa Indonesia dan English
-   📱 **WhatsApp Integration** - Notifikasi otomatis via WhatsApp Bot (Baileys)
-   🐳 **Docker Ready** - Deployment mudah dengan Docker Compose
-   🎨 **Modern UI** - Interface yang clean dan responsive dengan Shadcn UI
-   🔐 **Role-Based Access** - Sistem permission bertingkat (Owner, Admin, Employee)

## 🚀 Fitur Utama

### 📊 Dashboard & Analytics
-   **Dashboard Interaktif** - Statistik real-time karyawan, departemen, dan aktivitas
-   **Visualisasi Data** - Grafik dan chart untuk insights bisnis

### 🏢 Manajemen Organisasi
-   **Manajemen Perusahaan** - CRUD perusahaan dengan konfigurasi independen
-   **Departemen & Posisi** - Struktur organisasi hierarkis yang fleksibel
-   **Batch Generation** - Generate departemen standar secara otomatis

### 👥 Manajemen SDM
-   **Manajemen Karyawan** - Profil lengkap, riwayat kerja, dan dokumen
-   **User Management** - Kelola akun Owner, Admin, dan Employee
-   **Role-Based Access Control** - Permission granular per role

### ⏰ Aktivitas & Kehadiran
-   **Absensi** - Sistem check-in/check-out karyawan
-   **Cuti & Izin** - Pengajuan dan approval cuti/izin
-   **Riwayat Aktivitas** - Log lengkap aktivitas karyawan

### 💰 Penggajian
-   **Konfigurasi Gaji** - Setup komponen gaji (pokok, tunjangan, potongan)
-   **Slip Gaji** - Generate slip gaji otomatis (PDF)
-   **Dashboard Payroll** - Overview penggajian per periode
-   **PPh21 Calculator** - Perhitungan pajak otomatis

### 🔧 Pengaturan Sistem
-   **WhatsApp Bot** - Konfigurasi dan monitoring bot WhatsApp
-   **Notifikasi** - Setup notifikasi untuk berbagai event
-   **Autentikasi** - Pengaturan keamanan dan session

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

## 📦 Instalasi & Setup

### Metode 1: Docker Compose (Recommended)

1.  **Clone repository**
    ```bash
    git clone https://github.com/marhaendev/hris-platform.git
    cd hris-platform
    ```

2.  **Konfigurasi environment**
    ```bash
    cp .env.example .env
    # Edit .env sesuai kebutuhan
    ```

3.  **Jalankan dengan Docker Compose**
    
    **Development mode:**
    ```bash
    docker compose --profile development up -d
    ```
    
    **Production mode:**
    ```bash
    docker compose --profile production up -d
    ```

4.  **Akses aplikasi**
    - Web App: [http://localhost:3000](http://localhost:3000)
    - Bot API: [http://localhost:3001](http://localhost:3001)

### Metode 2: Manual Installation

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
    Web app akan berjalan di [http://localhost:3000](http://localhost:3000)

4.  **Setup Bot Service** (Terminal baru)
    ```bash
    cd bot
    npm install
    npm start
    ```
    Bot API akan berjalan di [http://localhost:3001](http://localhost:3001)

### Metode 3: Workspace Mode (Recommended untuk Development)

```bash
# Install semua dependencies
npm install

# Jalankan web + bot bersamaan
npm run dev

# Atau jalankan terpisah:
npm run dev:web   # Web saja
npm run dev:bot   # Bot saja
```

## 📁 Struktur Project

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

Project ini menggunakan **SQLite** dengan data demo yang sudah terisi. Database akan otomatis terdeteksi baik di mode Docker maupun Host.

> **Catatan Database**: Project ini sudah dilengkapi dengan database SQLite yang berisi data demo. Tidak perlu setup database dari awal.


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

Buat file `.env` di root project:

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

## 🤝 Kontribusi

Project ini sedang dalam pengembangan aktif. Untuk kontribusi atau pertanyaan, silakan hubungi saya:

-   📧 Email: [hasanaskari.id@gmail.com](mailto:hasanaskari.id@gmail.com)
-   🌐 Website: [hasanaskari.com](https://hasanaskari.com)

---

**Dibuat dengan ❤️ menggunakan Next.js dan Baileys**
