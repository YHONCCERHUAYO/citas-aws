import { MySqlRepository } from '../persistence/MySqlRepository.js';
import { publishProcessedEvent } from '../messaging/Messaging.js';
export const handler = async (event) => {
    const repo = new MySqlRepository('PE');
    for (const rec of event.Records) {
        const payload = JSON.parse(rec.body);
        await repo.save(payload);
        await publishProcessedEvent(payload.appointmentId);
    }
};
