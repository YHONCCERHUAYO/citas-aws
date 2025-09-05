import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(client);
const TableName = process.env.DDB_TABLE;
export class DynamoRepository {
    async put(appointment) {
        await doc.send(new PutCommand({ TableName, Item: appointment }));
    }
    async listByInsured(insuredId) {
        const res = await doc.send(new QueryCommand({
            TableName,
            KeyConditionExpression: "insuredId = :i",
            ExpressionAttributeValues: { ":i": insuredId }
        }));
        return res.Items ?? [];
    }
    async markCompleted(appointmentId) {
        const res = await doc.send(new QueryCommand({
            TableName,
            IndexName: "appointmentIdIndex",
            KeyConditionExpression: "appointmentId = :a",
            ExpressionAttributeValues: { ":a": appointmentId }
        }));
        const item = res.Items?.[0];
        if (!item)
            return;
        await doc.send(new UpdateCommand({
            TableName,
            Key: { insuredId: item.insuredId, appointmentId },
            UpdateExpression: "SET #s = :s, updatedAt = :u",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":s": "completed", ":u": new Date().toISOString() }
        }));
    }
}
