# 🏥 MediCare+

**Elderly Health Tracker** — A multi-role healthcare management platform for patients, caregivers, and doctors.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/medicare-plus)

---

## ✨ Features

### 👴 Patient
- Daily dose tracker (mark taken / missed / skipped)
- Medicine list with stock tracking
- Vitals logging (blood pressure, glucose, pulse, O₂, weight, temperature)
- Symptom log with severity levels
- Appointment history and upcoming visits
- Adherence reports & AI health insights

### 👩⚕️ Caregiver
- Dashboard with patient health snapshots
- Add, edit, and manage medicines for patients
- Log vitals and symptoms on behalf of patients
- Schedule and manage appointments
- Low-stock and missed-dose alerts

### 🩺 Doctor
- Patient roster with full clinical history
- Write and manage prescriptions
- Schedule and manage appointments
- Log visit notes, diagnosis, tests ordered
- Link patients by email

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| State | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Deploy | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/medicare-plus.git
cd medicare-plus
```

### 2. Set up the database
Open the **Supabase SQL Editor** and run these migration files in order:

```
supabase/001_schema.sql
supabase/002_rls_policies.sql
supabase/003_notification_triggers.sql
supabase/004_stock_and_views.sql
supabase/005_link_patient_by_email.sql
supabase/006_dose_log_generation.sql
supabase/007_link_doctor_by_email.sql
```

Then enable `pg_cron` in **Database → Extensions** and schedule:
```sql
select cron.schedule('adherence-check', '0 8 * * *', 'select public.check_adherence_alerts()');
select cron.schedule('generate-dose-logs', '0 0 * * *', 'select public.generate_dose_logs_for_date(current_date + 1)');
```

### 3. Configure the frontend
```bash
cd frontend
cp .env.example .env
# Fill in your Supabase URL and anon key
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

### 4. Configure Supabase Auth
In **Authentication → URL Configuration**:
- Set **Site URL**: `http://localhost:5173`
- Add **Redirect URLs**: `http://localhost:5173/**` and your production Vercel URL

### 5. Run locally
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔐 Roles & Access

| Action | Patient | Caregiver | Doctor |
|---|---|---|---|
| View own medicines | ✅ | ✅ | ✅ |
| Add/edit medicines | ❌ | ✅ | ❌ |
| Log doses | ✅ | ✅ | ❌ |
| Log vitals/symptoms | ✅ | ✅ | ❌ |
| Write prescriptions | ❌ | ❌ | ✅ |
| Manage appointments | ❌ | ✅ | ✅ |
| View all patient data | ❌ | Assigned only | Assigned only |

---

## ☁️ Deploy to Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy 🚀

---

## 📁 Project Structure

```
medicare-plus/
├── frontend/               # React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── config/         # Navigation, page titles
│   │   ├── context/        # Auth context
│   │   ├── hooks/          # React Query data hooks
│   │   ├── lib/            # Supabase client, validation schemas
│   │   ├── pages/          # Route-level page components
│   │   │   ├── auth/       # Login, signup, forgot/reset password
│   │   │   ├── patient/    # Patient dashboard & features
│   │   │   ├── caregiver/  # Caregiver dashboard & features
│   │   │   └── doctor/     # Doctor dashboard & features
│   │   └── types/          # TypeScript types + Supabase types
│   └── vercel.json
└── supabase/               # SQL migrations (run in order)
    ├── 001_schema.sql
    ├── 002_rls_policies.sql
    ├── 003_notification_triggers.sql
    ├── 004_stock_and_views.sql
    ├── 005_link_patient_by_email.sql
    ├── 006_dose_log_generation.sql
    └── 007_link_doctor_by_email.sql
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE)
