<div align="center">

# 🏥 MediCare+

### *The Complete Elderly Health Management Platform*

**Connecting patients, caregivers, and doctors in one seamless, secure application.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Vercel-black?style=for-the-badge)](https://medicare-plus.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

</div>

---

## 📋 Overview

**MediCare+** is an industry-ready multi-role healthcare management platform built for elderly patients and their support networks. It brings together patients, caregivers, and doctors into a single, secure system where medication adherence, vitals monitoring, and clinical coordination happen seamlessly.

> 🎯 **Built for real-world use** — row-level security, role-based access, automated scheduling, and mobile-first design.

---

## ✨ Features by Role

<table>
<tr>
<td width="33%" valign="top">

### 👴 Patient
- ✅ Daily dose tracker (taken / missed / skipped)
- 💊 Medicine list with stock tracking
- 📈 Vitals logging (BP, glucose, pulse, O₂, weight, temp)
- 🤒 Symptom log with severity levels
- 🩺 Chronic disease / condition tracker
- 🗓️ Appointment history & upcoming visits
- 📊 Adherence reports with visual charts
- 💬 AI health assistant with wellness tips

</td>
<td width="33%" valign="top">

### 👩‍⚕️ Caregiver
- 🏠 Dashboard with patient health snapshots
- 💊 Add, edit & manage medicines for patients
- 📈 Log vitals & symptoms on behalf of patients
- 🗓️ Schedule and manage appointments
- 🔔 Low-stock and missed-dose alerts
- 👥 Manage multiple assigned patients
- 🩺 View tabbed patient detail (meds, vitals, symptoms, appts)

</td>
<td width="33%" valign="top">

### 🩺 Doctor
- 👥 Patient roster with full clinical history
- 💊 Write and manage prescriptions
- 🗓️ Schedule and manage appointments
- 📋 Log visit notes, diagnosis & tests ordered
- 📈 View patient's latest vitals at a glance
- 🔗 Link patients by email address
- 🔔 Clinical alerts and notifications

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<table>
<tr>
<th>Layer</th>
<th>Technology</th>
<th>Purpose</th>
</tr>
<tr>
<td>🖥️ Frontend</td>
<td><strong>React 19 + TypeScript + Vite</strong></td>
<td>Fast, type-safe SPA</td>
</tr>
<tr>
<td>🎨 Styling</td>
<td><strong>Tailwind CSS v4</strong></td>
<td>Custom design system with semantic tokens</td>
</tr>
<tr>
<td>🗄️ Backend</td>
<td><strong>Supabase (PostgreSQL + Auth + RLS)</strong></td>
<td>Database, authentication, real-time</td>
</tr>
<tr>
<td>🔄 State</td>
<td><strong>TanStack React Query v5</strong></td>
<td>Server state, caching, background sync</td>
</tr>
<tr>
<td>📝 Forms</td>
<td><strong>React Hook Form + Zod</strong></td>
<td>Validation and form management</td>
</tr>
<tr>
<td>✨ Animation</td>
<td><strong>Framer Motion</strong></td>
<td>Smooth transitions and micro-animations</td>
</tr>
<tr>
<td>🔍 Icons</td>
<td><strong>Lucide React</strong></td>
<td>Consistent icon system</td>
</tr>
<tr>
<td>🚀 Deploy</td>
<td><strong>Vercel + GitHub Actions CI</strong></td>
<td>Automated builds and deployments</td>
</tr>
</table>

---

## 🔐 Security & Architecture

- **Row Level Security (RLS)** — Every table is protected at the database level. Users only access their own data.
- **Role-Based Access** — Three distinct roles: `patient`, `caregiver`, `doctor` with separate dashboards and permissions.
- **Automated Scheduling** — `pg_cron` generates daily dose logs at midnight and checks adherence every morning.
- **Email-Based Linking** — Doctors link patients by email; caregivers link doctors on behalf of patients.

| Action | Patient | Caregiver | Doctor |
|---|:---:|:---:|:---:|
| View own medicines | ✅ | ✅ | ✅ |
| Add / edit medicines | ❌ | ✅ | ❌ |
| Log doses | ✅ | ✅ | ❌ |
| Log vitals & symptoms | ✅ | ✅ | ❌ |
| Write prescriptions | ❌ | ❌ | ✅ |
| Schedule appointments | ❌ | ✅ | ✅ |
| View all patient data | ❌ | Assigned only | Assigned only |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/rohitp1725/MediCare-Plus.git
cd MediCare-Plus
```

### 2. Set up the database
Open the **Supabase SQL Editor** and run these migration files **in order**:

```
supabase/001_schema.sql
supabase/002_rls_policies.sql
supabase/003_notification_triggers.sql
supabase/004_stock_and_views.sql
supabase/005_link_patient_by_email.sql
supabase/006_dose_log_generation.sql
supabase/007_link_doctor_by_email.sql
supabase/008_patient_conditions.sql
```

Then enable **`pg_cron`** in **Database → Extensions** and run:
```sql
select cron.schedule('adherence-check', '0 8 * * *', 'select public.check_adherence_alerts()');
select cron.schedule('generate-dose-logs', '0 0 * * *', 'select public.generate_dose_logs_for_date(current_date + 1)');
```

### 3. Configure environment variables
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Configure Supabase Auth
In **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: `http://localhost:5173/**` and your Vercel URL

### 5. Install and run
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## ☁️ Deploy to Vercel

1. Push to GitHub (already done ✅)
2. Go to [vercel.com/new](https://vercel.com/new) → Import `MediCare-Plus`
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy** 🚀

> **After deploy**, update your Supabase **Site URL** and **Redirect URLs** with your `.vercel.app` domain.

---

## 📁 Project Structure

```
MediCare-Plus/
├── .github/
│   └── workflows/ci.yml        # GitHub Actions: type-check + build on every PR
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # AppShell, Sidebar, Topbar (mobile-responsive)
│   │   │   ├── medicine/       # MedicineCard, MedicineFormModal
│   │   │   ├── toast/          # Global toast notification system
│   │   │   └── ui/             # Badge, Button, Card, ConfirmModal, Input, Modal, Tabs…
│   │   ├── config/
│   │   │   ├── navigation.ts   # Role-based sidebar navigation
│   │   │   └── pageTitles.ts   # Page title metadata
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Global auth state + profile
│   │   ├── hooks/              # All React Query data hooks
│   │   │   ├── useVitals.ts
│   │   │   ├── useSymptoms.ts
│   │   │   ├── useAppointments.ts
│   │   │   ├── usePrescriptions.ts
│   │   │   ├── useDoctorVisits.ts
│   │   │   └── …more
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Signup, ForgotPassword, ResetPassword
│   │   │   ├── patient/        # 10 patient pages
│   │   │   ├── caregiver/      # 5 caregiver pages
│   │   │   └── doctor/         # 6 doctor pages
│   │   ├── lib/
│   │   │   ├── supabase.ts     # Supabase client
│   │   │   └── validation/     # Zod schemas
│   │   └── types/              # TypeScript types + generated Supabase types
│   ├── .env.example
│   ├── vercel.json             # SPA routing config
│   └── vite.config.ts
└── supabase/
    ├── 001_schema.sql          # Core tables: profiles, patients, medicines, dose_logs…
    ├── 002_rls_policies.sql    # Row Level Security for all tables
    ├── 003_notification_triggers.sql
    ├── 004_stock_and_views.sql
    ├── 005_link_patient_by_email.sql
    ├── 006_dose_log_generation.sql
    ├── 007_link_doctor_by_email.sql
    └── 008_patient_conditions.sql  # Chronic conditions tracker
```

---

## 🤝 How Roles Work

### Signing Up
1. Go to `/signup`
2. Enter your name, email, password and **select your role** (Patient / Caregiver / Doctor)
3. A profile is automatically created in the correct table

### Linking Patients & Doctors
- **Caregiver → Patient**: Use "Link Patient" button → enter patient's email
- **Doctor → Patient**: Use "Add Patient" button → enter patient's email  
- **Caregiver → Doctor**: From patient detail page → "Link Doctor" → enter doctor's email

---

## 🗓️ Automated Features

| Job | Schedule | Description |
|---|---|---|
| `generate-dose-logs` | Midnight daily | Pre-generates tomorrow's dose log entries for all active medicines |
| `adherence-check` | 8 AM daily | Flags missed doses and creates low-adherence notifications |
| `trigger_generate_dose_logs` | On medicine add/update | Immediately creates today's dose logs when a medicine is activated |

---

## 📄 License

MIT License — Free to use, modify and distribute.

---

<div align="center">

**Built with ❤️ for better elderly healthcare management**

[Report Bug](https://github.com/rohitp1725/MediCare-Plus/issues) · [Request Feature](https://github.com/rohitp1725/MediCare-Plus/issues)

</div>
