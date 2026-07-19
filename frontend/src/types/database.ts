export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RoleType = 'patient' | 'caregiver' | 'doctor'
export type RelationStatus = 'pending' | 'active' | 'revoked'
export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped'
export type SeverityLevel = 'mild' | 'moderate' | 'severe'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
export type PrescriptionStatus = 'active' | 'stopped' | 'completed'
export type NotificationType =
  | 'missed_dose'
  | 'low_stock'
  | 'refill_due'
  | 'appointment_reminder'
  | 'critical_vital'
  | 'poor_adherence'
  | 'general'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: RoleType
          phone: string | null
          avatar_emoji: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: RoleType
          phone?: string | null
          avatar_emoji?: string | null
        }
        Update: Partial<{
          full_name: string
          phone: string | null
          avatar_emoji: string | null
        }>
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          profile_id: string
          dob: string | null
          gender: string | null
          blood_group: string | null
          height_cm: number | null
          weight_kg: number | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          allergies: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          dob?: string | null
          gender?: string | null
          blood_group?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          allergies?: string[]
          is_active?: boolean
        }
        Update: Partial<{
          dob: string | null
          gender: string | null
          blood_group: string | null
          height_cm: number | null
          weight_kg: number | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          allergies: string[]
          is_active: boolean
        }>
        Relationships: []
      }
      caregivers: {
        Row: { id: string; profile_id: string; created_at: string }
        Insert: { profile_id: string }
        Update: Record<string, never>
        Relationships: []
      }
      doctors: {
        Row: {
          id: string
          profile_id: string
          specialization: string | null
          license_number: string | null
          hospital_name: string | null
          created_at: string
        }
        Insert: {
          profile_id: string
          specialization?: string | null
          license_number?: string | null
          hospital_name?: string | null
        }
        Update: Partial<{
          specialization: string | null
          license_number: string | null
          hospital_name: string | null
        }>
        Relationships: []
      }
      patient_caregiver: {
        Row: {
          id: string
          patient_id: string
          caregiver_id: string
          relation: string | null
          status: RelationStatus
          created_at: string
        }
        Insert: {
          patient_id: string
          caregiver_id: string
          relation?: string | null
          status?: RelationStatus
        }
        Update: Partial<{ relation: string | null; status: RelationStatus }>
        Relationships: []
      }
      patient_doctor: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          status: RelationStatus
          assigned_at: string
        }
        Insert: { patient_id: string; doctor_id: string; status?: RelationStatus }
        Update: Partial<{ status: RelationStatus }>
        Relationships: []
      }
      medicines: {
        Row: {
          id: string
          patient_id: string
          name: string
          brand: string | null
          type: string | null
          strength: string | null
          dose: string | null
          frequency: string | null
          times: string[]
          food_instruction: string | null
          start_date: string | null
          end_date: string | null
          prescribing_doctor_id: string | null
          purpose: string | null
          stock_quantity: number
          refill_threshold: number
          refill_date: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          name: string
          brand?: string | null
          type?: string | null
          strength?: string | null
          dose?: string | null
          frequency?: string | null
          times?: string[]
          food_instruction?: string | null
          start_date?: string | null
          end_date?: string | null
          prescribing_doctor_id?: string | null
          purpose?: string | null
          stock_quantity?: number
          refill_threshold?: number
          refill_date?: string | null
          is_active?: boolean
          created_by?: string | null
        }
        Update: Partial<{
          name: string
          brand: string | null
          type: string | null
          strength: string | null
          dose: string | null
          frequency: string | null
          times: string[]
          food_instruction: string | null
          start_date: string | null
          end_date: string | null
          prescribing_doctor_id: string | null
          purpose: string | null
          stock_quantity: number
          refill_threshold: number
          refill_date: string | null
          is_active: boolean
        }>
        Relationships: []
      }
      dose_logs: {
        Row: {
          id: string
          medicine_id: string
          patient_id: string
          scheduled_date: string
          scheduled_time: string
          status: DoseStatus
          taken_at: string | null
          skipped_reason: string | null
          logged_by: string | null
          created_at: string
        }
        Insert: {
          medicine_id: string
          patient_id: string
          scheduled_date: string
          scheduled_time: string
          status?: DoseStatus
          taken_at?: string | null
          skipped_reason?: string | null
          logged_by?: string | null
        }
        Update: Partial<{
          status: DoseStatus
          taken_at: string | null
          skipped_reason: string | null
        }>
        Relationships: []
      }
      vitals_logs: {
        Row: {
          id: string
          patient_id: string
          recorded_at: string
          blood_pressure_systolic: number | null
          blood_pressure_diastolic: number | null
          glucose_mg_dl: number | null
          pulse_bpm: number | null
          oxygen_saturation: number | null
          weight_kg: number | null
          temperature_f: number | null
          notes: string | null
          logged_by: string | null
          created_at: string
        }
        Insert: {
          patient_id: string
          recorded_at?: string
          blood_pressure_systolic?: number | null
          blood_pressure_diastolic?: number | null
          glucose_mg_dl?: number | null
          pulse_bpm?: number | null
          oxygen_saturation?: number | null
          weight_kg?: number | null
          temperature_f?: number | null
          notes?: string | null
          logged_by?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      symptom_logs: {
        Row: {
          id: string
          patient_id: string
          symptom: string
          severity: SeverityLevel
          onset_at: string
          duration: string | null
          related_medicine_id: string | null
          timing_note: string | null
          notes: string | null
          doctor_informed: boolean
          is_emergency: boolean
          logged_by: string | null
          created_at: string
        }
        Insert: {
          patient_id: string
          symptom: string
          severity?: SeverityLevel
          onset_at?: string
          duration?: string | null
          related_medicine_id?: string | null
          timing_note?: string | null
          notes?: string | null
          doctor_informed?: boolean
          is_emergency?: boolean
          logged_by?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string | null
          scheduled_at: string
          reason: string | null
          status: AppointmentStatus
          location: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          doctor_id?: string | null
          scheduled_at: string
          reason?: string | null
          status?: AppointmentStatus
          location?: string | null
          created_by?: string | null
        }
        Update: Partial<{
          doctor_id: string | null
          scheduled_at: string
          reason: string | null
          status: AppointmentStatus
          location: string | null
        }>
        Relationships: []
      }
      doctor_visits: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_id: string | null
          visit_date: string
          hospital: string | null
          reason: string | null
          diagnosis: string | null
          changes_made: string | null
          tests_ordered: string | null
          next_visit_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          patient_id: string
          doctor_id: string
          appointment_id?: string | null
          visit_date?: string
          hospital?: string | null
          reason?: string | null
          diagnosis?: string | null
          changes_made?: string | null
          tests_ordered?: string | null
          next_visit_date?: string | null
          notes?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          doctor_visit_id: string | null
          medicine_id: string | null
          medicine_name: string
          dosage: string | null
          frequency: string | null
          duration: string | null
          instructions: string | null
          status: PrescriptionStatus
          stopped_at: string | null
          stopped_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          doctor_id: string
          doctor_visit_id?: string | null
          medicine_id?: string | null
          medicine_name: string
          dosage?: string | null
          frequency?: string | null
          duration?: string | null
          instructions?: string | null
          status?: PrescriptionStatus
        }
        Update: Partial<{
          status: PrescriptionStatus
          stopped_at: string | null
          stopped_reason: string | null
        }>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          patient_id: string | null
          type: NotificationType
          title: string
          message: string | null
          severity: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          recipient_id: string
          patient_id?: string | null
          type?: NotificationType
          title: string
          message?: string | null
          severity?: string
          is_read?: boolean
        }
        Update: Partial<{ is_read: boolean }>
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          patient_id: string
          generated_by: string | null
          report_type: string
          period_start: string | null
          period_end: string | null
          content: Json | null
          file_path: string | null
          created_at: string
        }
        Insert: {
          patient_id: string
          generated_by?: string | null
          report_type: string
          period_start?: string | null
          period_end?: string | null
          content?: Json | null
          file_path?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      ai_insights: {
        Row: {
          id: string
          patient_id: string
          insight_type: string
          period_start: string | null
          period_end: string | null
          content: string
          metadata: Json | null
          generated_at: string
        }
        Insert: {
          patient_id: string
          insight_type: string
          period_start?: string | null
          period_end?: string | null
          content: string
          metadata?: Json | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          profile_id: string
          patient_id: string | null
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          profile_id: string
          patient_id?: string | null
          role: 'user' | 'assistant'
          content: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      link_patient_by_email: {
        Args: { p_email: string; p_relation?: string }
        Returns: { linked_patient_id: string; patient_full_name: string }[]
      }
    }
    Enums: {
      role_type: RoleType
      relation_status: RelationStatus
      dose_status: DoseStatus
      severity_level: SeverityLevel
      appointment_status: AppointmentStatus
      prescription_status: PrescriptionStatus
      notification_type: NotificationType
    }
    CompositeTypes: Record<string, never>
  }
}
