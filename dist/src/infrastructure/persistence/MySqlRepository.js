import mysql from 'mysql2/promise';
export class MySqlRepository {
    country;
    constructor(country) {
        this.country = country;
    }
    getConfig() {
        if (this.country === 'PE') {
            return {
                host: process.env.RDS_HOST_PE,
                port: Number(process.env.RDS_PORT_PE || 3306),
                user: process.env.RDS_USER_PE,
                password: process.env.RDS_PASSWORD_PE,
                database: process.env.RDS_DB_PE,
                waitForConnections: true,
            };
        }
        else {
            return {
                host: process.env.RDS_HOST_CL,
                port: Number(process.env.RDS_PORT_CL || 3307),
                user: process.env.RDS_USER_CL,
                password: process.env.RDS_PASSWORD_CL,
                database: process.env.RDS_DB_CL,
                waitForConnections: true,
            };
        }
    }
    async save(appointment) {
        const pool = mysql.createPool(this.getConfig());
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(64) PRIMARY KEY,
        insured_id VARCHAR(8) NOT NULL,
        schedule_id INT NOT NULL,
        country_iso VARCHAR(2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );`);
            await pool.execute(`INSERT INTO appointments (id, insured_id, schedule_id, country_iso, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                appointment.appointmentId,
                appointment.insuredId,
                appointment.scheduleId,
                appointment.countryISO,
                appointment.status,
                appointment.createdAt.replace('T', ' ').replace('Z', ''),
                appointment.updatedAt.replace('T', ' ').replace('Z', '')
            ]);
        }
        finally {
            await pool.end();
        }
    }
}
