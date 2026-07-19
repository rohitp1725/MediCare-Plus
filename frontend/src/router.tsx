import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RootRedirect } from '@/pages/RootRedirect'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { PatientHomePage } from '@/pages/patient/PatientHomePage'
import { PatientMedicinesPage } from '@/pages/patient/PatientMedicinesPage'
import { PatientTrackerPage } from '@/pages/patient/PatientTrackerPage'
import { PatientProfilePage } from '@/pages/patient/PatientProfilePage'
import { PatientVitalsPage } from '@/pages/patient/PatientVitalsPage'
import { PatientSymptomsPage } from '@/pages/patient/PatientSymptomsPage'
import { PatientAppointmentsPage } from '@/pages/patient/PatientAppointmentsPage'
import { PatientReportsPage } from '@/pages/patient/PatientReportsPage'
import { CaregiverHomePage } from '@/pages/caregiver/CaregiverHomePage'
import { CaregiverPatientsPage } from '@/pages/caregiver/CaregiverPatientsPage'
import { CaregiverPatientDetailPage } from '@/pages/caregiver/CaregiverPatientDetailPage'
import { CaregiverAlertsPage } from '@/pages/caregiver/CaregiverAlertsPage'
import { DoctorHomePage } from '@/pages/doctor/DoctorHomePage'
import { DoctorPatientsPage } from '@/pages/doctor/DoctorPatientsPage'
import { DoctorPatientDetailPage } from '@/pages/doctor/DoctorPatientDetailPage'
import { DoctorAppointmentsPage } from '@/pages/doctor/DoctorAppointmentsPage'
import { DoctorAlertsPage } from '@/pages/doctor/DoctorAlertsPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  {
    element: <ProtectedRoute allowedRoles={['patient']} />,
    children: [
      {
        path: '/patient',
        element: <AppShell />,
        children: [
          { index: true, element: <PatientHomePage /> },
          { path: 'profile', element: <PatientProfilePage /> },
          { path: 'diseases', element: <ComingSoonPage emoji="🩺" title="Diseases" /> },
          { path: 'medicines', element: <PatientMedicinesPage /> },
          { path: 'tracker', element: <PatientTrackerPage /> },
          { path: 'health', element: <PatientVitalsPage /> },
          { path: 'symptoms', element: <PatientSymptomsPage /> },
          { path: 'visits', element: <PatientAppointmentsPage /> },
          { path: 'reports', element: <PatientReportsPage /> },
          { path: 'assistant', element: <ComingSoonPage emoji="💬" title="AI Assistant" /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['caregiver']} />,
    children: [
      {
        path: '/caregiver',
        element: <AppShell />,
        children: [
          { index: true, element: <CaregiverHomePage /> },
          { path: 'patients', element: <CaregiverPatientsPage /> },
          { path: 'patients/:patientId', element: <CaregiverPatientDetailPage /> },
          { path: 'alerts', element: <CaregiverAlertsPage /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['doctor']} />,
    children: [
      {
        path: '/doctor',
        element: <AppShell />,
        children: [
          { index: true, element: <DoctorHomePage /> },
          { path: 'patients', element: <DoctorPatientsPage /> },
          { path: 'patients/:patientId', element: <DoctorPatientDetailPage /> },
          { path: 'appointments', element: <DoctorAppointmentsPage /> },
          { path: 'alerts', element: <DoctorAlertsPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])
