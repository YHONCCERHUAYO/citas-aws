import { v4 as uuidv4 } from 'uuid';
import { appointmentRequestSchema } from '../../domain/schemas.js';
import { DynamoRepository } from '../persistence/DynamoRepository.js';
import { publishToSns } from '../messaging/Messaging.js';
const ddb = new DynamoRepository();
export async function handler(event) {
    // Rutas HTTP
    if (event.requestContext?.http) {
        const { method, path } = event.requestContext.http;
        if (method === 'POST' && path === '/appointments')
            return await createAppointment(event);
        if (method === 'GET' && path?.startsWith('/appointments/'))
            return await listByInsured(event);
        if (method === 'GET' && path === '/openapi.json')
            return await openapi(event);
    }
    // Evento SQS (cola de completados)
    if (event.Records && Array.isArray(event.Records)) {
        for (const rec of event.Records) {
            const body = JSON.parse(rec.body);
            const detail = body?.detail || body;
            const appointmentId = detail?.appointmentId || body?.appointmentId;
            if (appointmentId) {
                console.log(`🔄 Marcando cita completada: ${appointmentId}`);
                await ddb.markCompleted(appointmentId);
            }
        }
        return;
    }
    return { statusCode: 400, body: 'Bad Request' };
}
async function createAppointment(event) {
    try {
        const data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const parsed = appointmentRequestSchema.parse(data);
        if (!parsed.countryISO || !['PE', 'CL'].includes(parsed.countryISO)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'countryISO inválido o no proporcionado' }) };
        }
        const now = new Date().toISOString();
        const appointmentId = uuidv4();
        const entity = {
            ...parsed,
            appointmentId,
            status: 'pending',
            createdAt: now,
            updatedAt: now
        };
        console.log("Creando cita:", entity);
        // Guardar en DynamoDB
        await ddb.put(entity);
        // Publicar en SNS con MessageAttributes
        console.log("📤 Publicando en SNS con countryISO:", parsed.countryISO);
        await publishToSns(entity, parsed.countryISO);
        return {
            statusCode: 202,
            body: JSON.stringify({ message: 'Agendamiento en proceso', appointmentId })
        };
    }
    catch (err) {
        console.error("Error creando cita:", err);
        const msg = err?.issues ? err.issues.map((i) => i.message).join(', ') : err?.message || 'Error';
        return { statusCode: 400, body: JSON.stringify({ error: msg }) };
    }
}
async function listByInsured(event) {
    const insuredId = event.pathParameters?.insuredId;
    if (!insuredId)
        return { statusCode: 400, body: JSON.stringify({ error: 'insuredId requerido' }) };
    const items = await ddb.listByInsured(insuredId);
    return { statusCode: 200, body: JSON.stringify(items) };
}
async function openapi(_event) {
    const spec = (await import('../../../openapi/openapi.json', { assert: { type: 'json' } })).default;
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(spec) };
}
