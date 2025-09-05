export type CountryISO = 'PE' | 'CL';

export interface AppointmentRequest {
  insuredId: string;     // 5 digits (leading zeros allowed)
  scheduleId: number;
  countryISO: CountryISO;
}

export interface AppointmentEntity extends AppointmentRequest {
  appointmentId: string;
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
}
