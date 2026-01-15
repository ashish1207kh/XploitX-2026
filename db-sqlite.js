const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Promisified SQLite wrapper to match the async nature of Postgres
class SQLiteDB {
    constructor() {
        this.db = new sqlite3.Database('./hackathon.db', (err) => {
            if (err) console.error('Error opening SQLite database', err.message);
            else console.log('Connected to local SQLite database.');
        });
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(`CREATE TABLE IF NOT EXISTS teams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_id TEXT UNIQUE, 
                    name TEXT,
                    email TEXT UNIQUE,
                    password TEXT,
                    event TEXT,
                    transaction_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_db_id INTEGER,
                    name TEXT,
                    age INTEGER,
                    email TEXT,
                    phone TEXT,
                    whatsapp TEXT,
                    college TEXT,
                    address TEXT,
                    role TEXT,
                    FOREIGN KEY(team_db_id) REFERENCES teams(id)
                )`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    async createTeam(team, members) {
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO teams (team_id, name, email, password, event, transaction_id) VALUES (?, ?, ?, ?, ?, ?)`,
                [team.teamId, team.name, team.email, team.password, team.event, team.transactionId],
                function (err) {
                    if (err) return reject(err);
                    const teamDbId = this.lastID;
                    resolve(teamDbId);
                }
            );
        });
    }

    async addMember(teamDbId, m, role) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`INSERT INTO members (team_db_id, name, age, email, phone, whatsapp, college, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            stmt.run(teamDbId, m.name, m.age, m.email, m.phone, m.whatsapp, m.college, m.address, role, (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    async getTeamByLogin(loginId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM teams WHERE (team_id = ? OR email = ?)`, [loginId, loginId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getTeamById(teamId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM teams WHERE team_id = ?`, [teamId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getMembers(teamDbId) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM members WHERE team_db_id = ?`, [teamDbId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getAllTeams() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM teams", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getAllMembers() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM members", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    }

    async updatePassword(teamId, newPassword) {
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE teams SET password = ? WHERE team_id = ?`, [newPassword, teamId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async deleteAllMembers(teamDbId) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM members WHERE team_db_id = ?`, [teamDbId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = SQLiteDB;
