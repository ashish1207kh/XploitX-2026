const { sql } = require('@vercel/postgres');

class PostgresDB {
    async init() {
        // Initializing tables if they don't exist
        await sql`CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            team_id TEXT UNIQUE, 
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            event TEXT,
            transaction_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        await sql`CREATE TABLE IF NOT EXISTS members (
            id SERIAL PRIMARY KEY,
            team_db_id INTEGER REFERENCES teams(id),
            name TEXT,
            age INTEGER,
            email TEXT,
            phone TEXT,
            whatsapp TEXT,
            college TEXT,
            address TEXT,
            role TEXT
        )`;
        console.log('Connected to Vercel Postgres');
    }

    async createTeam(team, members) {
        const result = await sql`
            INSERT INTO teams (team_id, name, email, password, event, transaction_id) 
            VALUES (${team.teamId}, ${team.name}, ${team.email}, ${team.password}, ${team.event}, ${team.transactionId})
            RETURNING id;
        `;
        return result.rows[0].id;
    }

    async addMember(teamDbId, m, role) {
        await sql`
            INSERT INTO members (team_db_id, name, age, email, phone, whatsapp, college, address, role) 
            VALUES (${teamDbId}, ${m.name}, ${m.age}, ${m.email}, ${m.phone}, ${m.whatsapp}, ${m.college}, ${m.address}, ${role})
        `;
    }

    async getTeamByLogin(loginId) {
        const result = await sql`SELECT * FROM teams WHERE team_id = ${loginId} OR email = ${loginId}`;
        return result.rows[0];
    }

    async getTeamById(teamId) {
        const result = await sql`SELECT * FROM teams WHERE team_id = ${teamId}`;
        return result.rows[0];
    }

    async getMembers(teamDbId) {
        const result = await sql`SELECT * FROM members WHERE team_db_id = ${teamDbId}`;
        return result.rows;
    }

    async getAllTeams() {
        const result = await sql`SELECT * FROM teams`;
        return result.rows;
    }

    async getAllMembers() {
        const result = await sql`SELECT * FROM members`;
        return result.rows;
    }

    async updatePassword(teamId, newPassword) {
        await sql`UPDATE teams SET password = ${newPassword} WHERE team_id = ${teamId}`;
    }

    async deleteAllMembers(teamDbId) {
        await sql`DELETE FROM members WHERE team_db_id = ${teamDbId}`;
    }
}

module.exports = PostgresDB;
