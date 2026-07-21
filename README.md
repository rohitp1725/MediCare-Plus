<div align="center">

<img src="https://raw.githubusercontent.com/rohitp1725/MediCare-Plus/main/public/vite.svg" width="64" height="64" alt="MediCare+" />

# MediCare+

**A multi-role healthcare management platform for patients, caregivers, and doctors.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

</div>

---

## About

MediCare+ is a full-stack health tracking application designed for elderly care. It provides three distinct, role-based dashboards — **Patient**, **Caregiver**, and **Doctor** — each with tailored features and secure, policy-enforced data access.

The platform handles the complete healthcare workflow: medicines are prescribed by caregivers, daily dose logs are auto-generated at midnight via `pg_cron`, patients track their own health vitals and symptoms, and doctors review clinical history and write formal prescriptions — all within a single, secure system.

---

## Features

### Patient
- Daily dose tracker with taken / missed / skipped status
- Medicine cabinet with stock level tracking
- Vitals log — blood pressure, glucose, pulse, O₂ saturation, weight, temperature
- Symptom journal with severity ratings
- Chronic condition / disease history tracker
- Doctor visit history and upcoming appointments
- Medication adherence reports with visual progress bars
- AI-powered health assistant with wellness guidance

### Caregiver
- Multi-patient dashboard with health snapshots
- Full medicine management (add, edit, toggle active, delete)
- Log vitals and symptoms on behalf of patients
- Appointment scheduling and management
- Low-stock and missed-dose alert feed
- Tabbed patient detail view (medicines, vitals, symptoms, appointments)

### Doctor
- Patient roster with clinical overview
- Prescriptions — write, view, and stop active prescriptions
- Appointment scheduling with visit notes and diagnosis
- Patient vitals history at a glance
- Link patients by email address
- Clinical alerts and notification feed

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 with custom semantic token system |
| Backend | Supabase (PostgreSQL, Auth, Row Level Security) |
| State / Data | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Icons | Lucide React |
| CI/CD | GitHub Actions |

---

## Project Structure

```
MediCare-Plus/
├── src/
│   ├── components/
│   │   ├── layout/           # AppShell, Sidebar, Topbar
│   │   ├── medicine/         # MedicineCard, MedicineFormModal
│   │   ├── toast/            # Toast notification system
│   │   └── ui/               # Button, Card, Input, Modal, Badge, Tabs, ...
│   ├── config/
│   │   ├── navigation.ts     # Role-based sidebar nav items
│   │   └── pageTitles.ts     # Page title map
│   ├── context/
│   │   └── AuthContext.tsx   # Auth state, profile loading, signup flow
│   ├── hooks/                # TanStack Query data hooks per domain
│   │   ├── useVitals.ts
│   │   ├── useSymptoms.ts
│   │   ├── useMedicines.ts
│   │   ├── useAppointments.ts
│   │   ├── usePrescriptions.ts
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   └── validation/       # Zod schemas
│   ├── pages/
│   │   ├── auth/             # Login, Signup, ForgotPassword, ResetPassword
│   │   ├── patient/          # 10 patient pages
│   │   ├── caregiver/        # 5 caregiver pages
│   │   └── doctor/           # 6 doctor pages
│   ├── types/                # TypeScript types + Supabase generated types
│   └── router.tsx            # React Router configuration
├── database/
│   ├── 001_schema.sql            # Core tables
│   ├── 002_rls_policies.sql      # Row Level Security
│   ├── 003_notification_triggers.sql
│   ├── 004_stock_and_views.sql
│   ├── 005_link_patient_by_email.sql
│   ├── 006_dose_log_generation.sql
│   ├── 007_link_doctor_by_email.sql
│   └── 008_patient_conditions.sql
├── public/
├── .github/
│   └── workflows/ci.yml      # Type check + build on every push
├── index.html
├── package.json
├── vite.config.ts
└── vercel.json
```

---

## Role & Access Matrix

| Capability | Patient | Caregiver | Doctor |
|---|:---:|:---:|:---:|
| View own medicines | ✅ | ✅ | ✅ |
| Add / edit medicines | ❌ | ✅ | ❌ |
| Log doses | ✅ | ✅ | ❌ |
| Log vitals & symptoms | ✅ | ✅ | ❌ |
| Write prescriptions | ❌ | ❌ | ✅ |
| Manage appointments | ❌ | ✅ | ✅ |
| View patient data | Own only | Assigned only | Assigned only |

---

## Security

All data access is enforced at the database level using **Row Level Security (RLS)** policies. No client-side filtering is relied upon for security.

- Patients can only read and write their own records
- Caregivers can only access records of patients explicitly linked to them
- Doctors can only access records of patients who have accepted their link request
- All links (caregiver ↔ patient, doctor ↔ patient) are established via a verified email-based RPC function

---

## Automated Jobs

| Job | Trigger | Description |
|---|---|---|
| `generate_dose_logs_for_date` | Daily at midnight (`pg_cron`) | Pre-generates tomorrow's dose log entries for all active medicines |
| `check_adherence_alerts` | Daily at 8 AM (`pg_cron`) | Flags missed doses and creates low-adherence notifications |
| `trg_medicine_generate_dose_logs` | DB trigger on `medicines` insert/update | Immediately creates today's logs when a medicine is activated |
| `trg_patient_conditions_updated_at` | DB trigger on `patient_conditions` update | Keeps `updated_at` timestamps accurate |

---


