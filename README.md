# Appointment Service (Serverless + TypeScript)

Backend de agendamiento de citas médicas para PE/CL en AWS:
- API Gateway + Lambda (`appointment`) para POST/GET y escucha de completados
- DynamoDB para persistir `pending/completed`
- SNS (con filtro por atributo `countryISO`) -> SQS (SQS_PE / SQS_CL)
- Lambdas `appointment_pe` y `appointment_cl` consumen SQS, guardan en RDS MySQL y publican a EventBridge
- EventBridge emite a SQS de completion, que reingresa al Lambda `appointment` para cerrar el ciclo

## Requisitos
- Node.js 20+
- AWS CLI configurado
- RDS MySQL existente (crea dos bases o dos esquemas): `appointments_pe`, `appointments_cl`

## Variables de entorno
Copia `.env.example` a tu entorno (o exporta variables) antes de `serverless deploy`:
- `AWS_REGION` (ej. us-east-1)
- `STAGE` (ej. dev)
- `DDB_TABLE_NAME` (por defecto `Appointments`)
- `EVENT_BUS_NAME` (por defecto `appointment-bus`)
- `RDS_HOST`, `RDS_USER`, `RDS_PASSWORD`
- `RDS_DB_PE` (por defecto `appointments_pe`), `RDS_DB_CL` (por defecto `appointments_cl`)

## Scripts
- `npm run build`
- `npm run deploy`
- `npm run start:offline` (solo rutas HTTP)

## Endpoints
- `POST /appointments` body `{ insuredId, scheduleId, countryISO }`
- `GET /appointments/{insuredId}`
- `GET /openapi.json` (Swagger/OpenAPI)

## Pruebas
- `npm test`

## Arquitectura
- CLEAN + SOLID: capas `domain`, `application` (casos de uso se pueden extender), `infrastructure` (adapters)
- Patrón: Repository (Dynamo/MySQL) y Publisher (SNS/EventBridge)

## Notas
- Por simplicidad, `appointment` usa un GSI `appointmentIdIndex` para marcar `completed`.
- `appointment_pe`/`appointment_cl` crean tabla `appointments` si no existe.
- Ajusta IAM si prefieres privilegios mínimos por función.
