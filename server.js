const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from current dir

// --- EMAIL CONFIGURATION ---
// For this demo, we will log emails to the console.
// To use Real Gmail: 
// 1. service: 'gmail', auth: { user: 'you@gmail.com', pass: 'your-app-password' }
const transporter = nodemailer.createTransport({
    jsonTransport: true // Logs message to JSON object (simulated sending)
});

async function sendEmail(to, subject, text) {
    console.log(`\n--- [MOCK EMAIL SERVICE] ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${text}`);
    console.log(`------------------------------\n`);

    // In a real scenario, you'd await transporter.sendMail(...)
    return true;
}


// Database Setup
const db = new sqlite3.Database('./hackathon.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Teams Table
        db.run(`CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id TEXT UNIQUE, 
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            event TEXT,
            transaction_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Members Table
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
    });
}

function sendWhatsApp(number, message) {
    console.log(`\n--- [MOCK WHATSAPP SERVICE] ---`);
    console.log(`To: ${number}`);
    console.log(`Message: ${message}`);
    // In real world, would call Twilio/Meta API here
    // e.g. client.messages.create({ ... })
    console.log(`------------------------------\n`);
}

// API Routes

// Register
app.post('/api/auth/register', (req, res) => {
    const { teamName, email, password, event, transactionId, members } = req.body;

    // Validation
    if (!teamName || !email || !password || !members || members.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const teamIdStr = teamName.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);

    // Insert Team
    db.run(`INSERT INTO teams (team_id, name, email, password, event, transaction_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [teamIdStr, teamName, email, password, event, transactionId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const teamDbId = this.lastID;

            // Insert Members
            const stmt = db.prepare(`INSERT INTO members (team_db_id, name, age, email, phone, whatsapp, college, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            let leaderWhatsApp = "";

            members.forEach((m, index) => {
                const role = index === 0 ? 'LEADER' : 'MEMBER';
                // Capture leader's whatsapp
                if (index === 0) leaderWhatsApp = m.whatsapp;

                stmt.run(teamDbId, m.name, m.age, m.email, m.phone, m.whatsapp, m.college, m.address, role);
            });
            stmt.finalize();

            // SEND EMAIL
            const emailBody = `
            Dear Team Leader,
            
            Congratulations! Your team "${teamName}" has been successfully registered for XploitX-2026.
            
            Here are your secure access credentials:
            --------------------------------------------------
            Team ID  : ${teamIdStr}
            Password : ${password}
            --------------------------------------------------
            
            Please keep these credentials safe. You can log in to your dashboard to manage your team and event details.
            
            Login Portal: http://localhost:3000/login.html
            
            Best Regards,
            The Matrix Hackathon Team
            Prathyusha Engineering College
            `;

            sendEmail(email, "MATRIX HACK: Access Credentials", emailBody);

            if (leaderWhatsApp) {
                const waMsg = `Welcome to MATRIX HACK! Team: ${teamName}. ID: ${teamIdStr}, Pass: ${password}. Login: http://localhost:3000`;
                sendWhatsApp(leaderWhatsApp, waMsg);
            }

            sendEmail(email, "MATRIX HACK: Access Credentials", emailBody);

            res.json({
                message: 'Registration successful',
                teamId: teamIdStr,
                teamName: teamName
                // Password intentionally NOT sent back to client to enforce email check
            });
        }
    );
});

// Change Password Endpoint
app.post('/api/auth/reset-password', (req, res) => {
    const { teamId, newPassword } = req.body;
    db.run(
        `UPDATE teams SET password = ? WHERE team_id = ?`,
        [newPassword, teamId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Password Updated Successfully' });
        }
    );
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { loginId, password } = req.body; // loginId can be Email or Team ID (though schema uses team_id/email)

    // Try finding by team_id OR email
    const sql = `SELECT * FROM teams WHERE (team_id = ? OR email = ?) AND password = ?`;

    db.get(sql, [loginId, loginId, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json({
                success: true,
                team: {
                    id: row.team_id,
                    name: row.name,
                    email: row.email,
                    event: row.event
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Admin Route: Get ALL Data
app.get('/api/admin/all-teams', (req, res) => {
    // Ideally protect this with a password/token check header
    // For now, open for the admin.html to use

    db.all("SELECT * FROM teams", [], (err, teams) => {
        if (err) return res.status(500).json({ error: err.message });

        // Get members for each team is N+1 but fine for small hackathon
        // Or just JOIN. Let's do a simple JOIN or just fetch members separately
        db.all("SELECT * FROM members", [], (err, members) => {
            if (err) return res.status(500).json({ error: err.message });

            // Map members to teams
            const result = teams.map(team => {
                return {
                    ...team,
                    members: members.filter(m => m.team_db_id === team.id)
                };
            });
            res.json(result);
        });
    });
});


// Get Dashboard Data
app.get('/api/team/:id', (req, res) => {
    const teamId = req.params.id;

    const sqlTeam = `SELECT * FROM teams WHERE team_id = ?`;

    db.get(sqlTeam, [teamId], (err, teamRow) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!teamRow) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const sqlMembers = `SELECT * FROM members WHERE team_db_id = ?`;
        db.all(sqlMembers, [teamRow.id], (err, memberRows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                team: teamRow,
                members: memberRows
            });
        });
    });
});

// Update Team Members (For Dashboard Save)
app.post('/api/team/:id/update', (req, res) => {
    const teamId = req.params.id; // This is the team_id (string)
    const { members } = req.body;

    if (!members) {
        return res.status(400).json({ error: 'No members provided' });
    }

    // Get DB ID first
    db.get(`SELECT id FROM teams WHERE team_id = ?`, [teamId], (err, teamRow) => {
        if (err || !teamRow) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const teamDbId = teamRow.id;

        // Transaction to replace members
        db.serialize(() => {
            db.run(`BEGIN TRANSACTION`);

            // Delete existing members (simple strategy for this hackathon app)
            // Ideally we'd update by ID, but replacing is robust for "adding/removing" efficiently in this simple schema
            db.run(`DELETE FROM members WHERE team_db_id = ?`, [teamDbId], (err) => {
                if (err) {
                    db.run(`ROLLBACK`);
                    return res.status(500).json({ error: err.message });
                }

                const stmt = db.prepare(`INSERT INTO members (team_db_id, name, age, email, phone, college, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

                members.forEach((m, index) => {
                    const role = m.role || (index === 0 ? 'LEADER' : 'MEMBER');
                    stmt.run(teamDbId, m.name, m.age, m.email, m.phone, m.college, m.address, role);
                });

                stmt.finalize((err) => {
                    if (err) {
                        db.run(`ROLLBACK`);
                        return res.status(500).json({ error: err.message });
                    }
                    db.run(`COMMIT`);
                    res.json({ success: true, message: 'Team updated successfully' });
                });
            });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
