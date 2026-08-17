import React from 'react'
import { useAuth } from '../context/AuthContext'
import PatientView from '../components/PatientView'
import HospitalPortal from '../components/HospitalPortal'
import DoctorView from '../components/DoctorView'
import AdminView from '../components/AdminView'

export default function Dashboard() {
  const { role } = useAuth()

  switch (role) {
    case 'admin':
      return <AdminView />
    case 'hospital':
      return <HospitalPortal />
    case 'doctor':
      return <DoctorView />
    case 'user':
    default:
      return <PatientView />
  }
}
