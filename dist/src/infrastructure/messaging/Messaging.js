import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
// Configuración de clientes AWS con región explícita
const sns = new SNSClient({ region: process.env.AWS_REGION });
const eb = new EventBridgeClient({ region: process.env.AWS_REGION });
// Variables de entorno
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "appointment-bus";
/**
 * Publica un mensaje en SNS con MessageAttributes.countryISO
 * para que SNS filtre correctamente hacia la SQS correspondiente
 */
export async function publishToSns(payload, countryISO) {
    if (!countryISO || !['PE', 'CL'].includes(countryISO)) {
        console.warn("⚠️ countryISO inválido o no definido, no se publicará en SNS", countryISO);
        return;
    }
    console.log("📤 Publicando en SNS", { TopicArn: SNS_TOPIC_ARN, countryISO, payload });
    try {
        const res = await sns.send(new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Message: JSON.stringify(payload),
            MessageAttributes: {
                countryISO: { DataType: "String", StringValue: countryISO },
            },
        }));
        console.log("✅ Mensaje publicado en SNS", { MessageId: res.MessageId, countryISO });
        return res;
    }
    catch (err) {
        console.error("❌ Error publicando en SNS", err);
        throw err;
    }
}
/**
 * Publica un evento en EventBridge indicando que la cita fue procesada
 * @param appointmentId - Identificador de la cita
 */
export async function publishProcessedEvent(appointmentId) {
    console.log("📤 Publicando evento procesado en EventBridge", {
        EventBus: EVENT_BUS_NAME,
        appointmentId,
    });
    try {
        const res = await eb.send(new PutEventsCommand({
            Entries: [
                {
                    EventBusName: EVENT_BUS_NAME,
                    Source: "appointment.processor",
                    DetailType: "AppointmentProcessed",
                    Detail: JSON.stringify({ appointmentId }),
                },
            ],
        }));
        console.log("✅ Evento publicado en EventBridge", res);
        return res;
    }
    catch (err) {
        console.error("❌ Error publicando en EventBridge", err);
        throw err;
    }
}
