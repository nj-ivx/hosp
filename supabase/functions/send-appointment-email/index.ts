const FROM_EMAIL = 'onboarding@resend.dev'

interface AppointmentRecord {
  patient_name: string
  patient_email: string
  appointment_date: string
  appointment_time?: string
  hospital_name: string
  doctor_name: string
  status: 'pending' | 'confirmed' | 'cancelled'
}

const TEMPLATES = {
  confirmed: (name: string, date: string, time?: string, hospital?: string, doctor?: string) => ({
    subject: 'Appointment Confirmed ✓ — Feras Medical',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;">
        <div style="background:#0B5D66;padding:18px 24px;border-radius:10px 10px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;">Feras Company Medical Portal</h1>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your medical appointment has been <strong style="color:#1C9A80;">confirmed</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;">
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Date</td>
              <td style="font-weight:600;">${date}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Time</td>
              <td style="font-weight:600;">${time || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Medical Center</td>
              <td style="font-weight:600;">${hospital || 'Hospital'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Physician</td>
              <td style="font-weight:600;">${doctor || 'Specialist'}</td>
            </tr>
          </table>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;">
            Please arrive 10 minutes prior to your consultation. Remember to present your 8-digit Patient Access Key card or barcode at reception.
          </p>
        </div>
      </div>
    `,
  }),
  cancelled: (name: string, date: string, hospital?: string) => ({
    subject: 'Appointment Cancelled — Feras Medical',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;">
        <div style="background:#0B5D66;padding:18px 24px;border-radius:10px 10px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;">Feras Company Medical Portal</h1>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your appointment scheduled for <strong>${date}</strong> at <strong>${hospital || 'the hospital'}</strong> has been <strong style="color:#C1443C;">cancelled</strong>.</p>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;">
            To reschedule or book another consultation, please visit the portal dashboard.
          </p>
        </div>
      </div>
    `,
  }),
  pending: (name: string, date: string, hospital?: string, doctor?: string) => ({
    subject: 'Appointment Request Received — Feras Medical',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;">
        <div style="background:#0B5D66;padding:18px 24px;border-radius:10px 10px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;">Feras Company Medical Portal</h1>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>We have received your appointment request for <strong>${date}</strong> with <strong>${doctor || 'the specialist'}</strong> at <strong>${hospital || 'our medical center'}</strong>.</p>
          <p style="color:#6b7280;font-size:13px;">Our team will verify the schedule and confirm your booking shortly.</p>
        </div>
      </div>
    `,
  }),
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const record: AppointmentRecord = payload.record
    const oldRecord: AppointmentRecord | undefined = payload.old_record

    if (!record || record.status === oldRecord?.status) {
      return new Response('No status change', { status: 200 })
    }

    const {
      patient_name,
      patient_email,
      appointment_date,
      appointment_time,
      hospital_name,
      doctor_name,
      status
    } = record

    if (!patient_email) {
      return new Response('No email provided on record', { status: 200 })
    }

    const templateFn = TEMPLATES[status]
    if (!templateFn) {
      return new Response('No email template for status', { status: 200 })
    }

    let emailContent
    if (status === 'confirmed') {
      emailContent = templateFn(patient_name, appointment_date, appointment_time, hospital_name, doctor_name)
    } else if (status === 'cancelled') {
      emailContent = templateFn(patient_name, appointment_date, hospital_name)
    } else {
      emailContent = templateFn(patient_name, appointment_date, hospital_name, doctor_name)
    }

    // @ts-ignore
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response('Missing RESEND_API_KEY environment variable', { status: 500 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [patient_email],
        subject: emailContent.subject,
        html: emailContent.html
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      return new Response(`Resend email error: ${errorText}`, { status: 500 })
    }

    return new Response('Email dispatched successfully', { status: 200 })
  } catch (err: any) {
    return new Response(`Internal Edge Function Error: ${err?.message || err}`, { status: 500 })
  }
})
