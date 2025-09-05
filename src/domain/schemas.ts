import { z } from 'zod';

export const appointmentRequestSchema = z.object({
  insuredId: z.string().regex(/^\d{5}$/,"insuredId debe ser 5 dígitos"),
  scheduleId: z.number().int().positive(),
  countryISO: z.enum(['PE','CL']),
});
export type AppointmentRequestDTO = z.infer<typeof appointmentRequestSchema>;
