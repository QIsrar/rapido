# Rapido — Construction Job-Costing & Expense Tracking PWA

**Rapido** is a mobile-first Progressive Web Application (PWA) designed for contractors, project managers, and builders to track construction job costs in real time from the field. 

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL & Storage)**.

---

## Features

- **Field-Ready PWA**: Installable directly on iOS and Android devices with standalone display mode, custom app manifest, and zero app store friction.
- **Job-Costing Dashboard**: High-level overview of active projects, overall budget health, lifetime spending metrics, and instant budget overrun indicators.
- **Project Tracking**: Multi-project management supporting various build types (*Renovation*, *Maintenance*, *New Build*) with budget status alerts and one-tap project completion.
- **Categorized Expense Logging**: Real-time logging of job expenses across trades (*Materials*, *Labor*, *Equipment Rental*, *Plumbing*, *Electricity*, *Permits*, *Transport/Fuel*, *Misc*).
- **On-Site Receipt Capture**: Direct camera integration (`capture="environment"`) for taking photo receipts on job sites, stored securely in Supabase Storage with in-app fullscreen lightbox viewing.
- **Soft-Delete Safety**: Expenses utilize soft-deletion (`deleted_at` timestamps) to preserve audit trails and avoid orphaned file deletion errors.
- **Pure SVG Financial Analytics**: Instant reports page featuring category spending breakdowns, budget vs. actual comparisons, and 6-month spending trends without heavy charting library overhead.
- **Offline & Resilient Data Layer**: Graceful fallback to cached mock data if offline or if database connectivity is interrupted.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide Icons
- **Language**: TypeScript (strict mode)
- **Database & Storage**: Supabase (PostgreSQL, Storage Buckets)
- **PWA**: Web App Manifest, Standalone display, theme-color meta controls

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.17+ or v20+)
- npm or pnpm
- A free [Supabase](https://supabase.com) project

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/QIsrar/rapido.git
cd rapido
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database & Storage Setup

1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the SQL statements provided in [`schema.sql`](./schema.sql) to create:
   - `projects` and `expenses` tables
   - Enums: `project_type`, `project_status`, `expense_category`
   - Indexes and Row Level Security policies
3. Create a public Storage bucket named `receipts` in **Supabase Dashboard** -> **Storage** (Allowed MIME types: `image/*`, max upload size: 5MB).

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your local machine or mobile browser on the same network.

### 5. Production Build

```bash
npm run build
npm run start
```

---

## Database Schema Overview

```sql
projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type project_type NOT NULL,
  total_budget NUMERIC(12, 2) NOT NULL,
  status project_status DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

expenses (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  category expense_category NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

---

## Deployment (Vercel)

This application is optimized for one-click deployment on [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Import the repository into Vercel.
3. Configure Environment Variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy!

---

## Author

**Qazi Israr Ahmad**  
- Portfolio: [qi-tyrix.netlify.app](https://qi-tyrix.netlify.app/)  
- GitHub: [@QIsrar](https://github.com/QIsrar)  
- Email: qisrar951@gmail.com
