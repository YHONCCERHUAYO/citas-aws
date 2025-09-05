import { appointmentRequestSchema } from '../src/domain/schemas.js';

describe('appointmentRequestSchema', () => {
  it('validates a correct payload', () => {
    const data = { insuredId: '01234', scheduleId: 100, countryISO: 'PE' as const };
    expect(() => appointmentRequestSchema.parse(data)).not.toThrow();
  });
  it('fails on bad insuredId', () => {
    const data = { insuredId: '123', scheduleId: 100, countryISO: 'PE' as const };
    expect(() => appointmentRequestSchema.parse(data)).toThrow();
  });
});
