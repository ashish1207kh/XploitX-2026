const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize SQLite Database
const db = new sqlite3.Database('./hackathon.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id TEXT UNIQUE, 
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        event TEXT,
        transaction_id TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Attempt to add status column if it doesn't exist (migration for existing DB)
    db.run(`ALTER TABLE teams ADD COLUMN status TEXT DEFAULT 'PENDING'`, (err) => {
        // Ignore error if column already exists
    });

    db.run(`CREATE TABLE IF NOT EXISTS members (
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
    )`);
}


// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(to, subject, html) {
    if (!process.env.EMAIL_USER) {
        console.log('No EMAIL_USER provided. Skipping email.');
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Matrix Hackathon" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

function sendWhatsApp(number, message) {
    console.log(`\n--- [MOCK WHATSAPP SERVICE] ---`);
    console.log(`To: ${number}`);
    console.log(`Message: ${message}`);
    console.log(`------------------------------\n`);
}

// API Routes

// Register
app.post('/api/auth/register', async (req, res) => {
    const { teamName, email, password, event, transactionId, members } = req.body;

    if (!teamName || !email || !password || !members || members.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const teamIdStr = teamName.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);

    try {
        // Helper to run query
        const runQuery = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        };

        // 1. Create Team
        const result = await runQuery(
            `INSERT INTO teams (team_id, name, email, password, event, transaction_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [teamIdStr, teamName, email, password, event, transactionId]
        );
        const teamDbId = result.lastID;

        let leaderWhatsApp = "";

        // 2. Add Members
        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const role = i === 0 ? 'LEADER' : 'MEMBER';
            if (i === 0) leaderWhatsApp = m.whatsapp;

            await runQuery(
                `INSERT INTO members (team_db_id, name, age, email, phone, whatsapp, college, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [teamDbId, m.name, m.age, m.email, m.phone, m.whatsapp, m.college, m.address, role]
            );
        }

        // 3. Mark as PENDING (Default is PENDING, but good to be explicit or let default handle it)
        // No email sent here.

        res.json({
            message: 'Registration successful. Pending verification.',
            teamId: teamIdStr,
            teamName: teamName
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

// Change Password Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
    const { teamId, newPassword } = req.body;
    try {
        await new Promise((resolve, reject) => {
            db.run(`UPDATE teams SET password = ? WHERE team_id = ?`, [newPassword, teamId], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
        res.json({ success: true, message: 'Password Updated Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { loginId, password } = req.body;

    try {
        const team = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM teams WHERE team_id = ? OR email = ?`,
                [loginId, loginId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!team) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (team.status !== 'CONFIRMED') {
            return res.status(403).json({ error: 'Account pending approval by Admin.' });
        }

        if (team.password === password) { // In production use bcrypt
            res.json({
                success: true,
                team: {
                    id: team.team_id,
                    name: team.name,
                    email: team.email,
                    event: team.event
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Route: Get ALL Data
app.get('/api/admin/data', async (req, res) => {
    try {
        // We'll return an array of { ...team, members: [...] }
        const teams = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM teams`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const fullData = [];
        for (const team of teams) {
            const members = await new Promise((resolve, reject) => {
                db.all(`SELECT * FROM members WHERE team_db_id = ?`, [team.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            fullData.push({ ...team, members });
        }

        res.json(fullData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Admin Approve Team
app.post('/api/admin/approve-team/:id', async (req, res) => {
    const teamId = req.params.id;

    try {
        // 1. Get Team Details
        const team = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM teams WHERE team_id = ?`, [teamId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!team) return res.status(404).json({ error: 'Team not found' });

        // 2. Update Status
        await new Promise((resolve, reject) => {
            db.run(`UPDATE teams SET status = 'CONFIRMED' WHERE team_id = ?`, [teamId], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // 3. Send Email
        const emailBody = `
        <div style="font-family: monospace; color: #000;">
            <h2>Registration Confirmed</h2>
            <p>Dear Team Leader,</p>
            <p>Congratulations! Your team <strong>"${team.name}"</strong> has been approved for XploitX-2026.</p>
            <hr>
            <p><strong>Team ID  :</strong> ${team.team_id}</p>
            <p><strong>Password :</strong> ${team.password}</p>
            <hr>
            <p>Please keep these credentials safe. You can log in to your dashboard to manage your team and event details.</p>
            <p><a href="http://localhost:3000/login.html">Login Portal</a></p>
            <br>
            <p>Best Regards,</p>
            <p>The Matrix Hackathon Team<br>Prathyusha Engineering College<br>(AN AUTONOMOUS INSTITUTION)</p>
        </div>
        `;

        await sendEmail(team.email, "MATRIX HACK: Registration Approved", emailBody);

        res.json({ success: true, message: 'Team approved and email sent.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// Get Dashboard Data
app.get('/api/team/:id', async (req, res) => {
    const teamId = req.params.id;
    try {
        const team = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM teams WHERE team_id = ?`, [teamId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!team) return res.status(404).json({ error: 'Team not found' });

        const members = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM members WHERE team_db_id = ?`, [team.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json({
            team: team,
            members: members
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Team Members (For Dashboard Save)
// Update Team Members (For Dashboard Save)
app.post('/api/team/:id/update', async (req, res) => {
    const teamId = req.params.id;
    const { members } = req.body;

    if (!members) {
        return res.status(400).json({ error: 'No members provided' });
    }

    try {
        const teamRow = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM teams WHERE team_id = ?`, [teamId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!teamRow) return res.status(404).json({ error: 'Team not found' });

        const teamDbId = teamRow.id;

        // Delete old members
        await new Promise((resolve, reject) => {
            db.run(`DELETE FROM members WHERE team_db_id = ?`, [teamDbId], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // Add new members
        const runQuery = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        };

        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const role = m.role || (i === 0 ? 'LEADER' : 'MEMBER');

            await runQuery(
                `INSERT INTO members (team_db_id, name, age, email, phone, whatsapp, college, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [teamDbId, m.name, m.age, m.email, m.phone, m.whatsapp, m.college, m.address, role]
            );
        }

        res.json({ success: true, message: 'Team updated successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;