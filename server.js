const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

// DB Adapters
const SQLiteDB = require('./db-sqlite');
const PostgresDB = require('./db-postgres');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Initialize DB based on Environment
let db;
if (process.env.POSTGRES_URL || process.env.VERCEL) {
    db = new PostgresDB();
} else {
    db = new SQLiteDB();
}

// Initialize DB tables
db.init().catch(err => console.error("DB Init Error:", err));


// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    jsonTransport: true
});

async function sendEmail(to, subject, text) {
    console.log(`\n--- [MOCK EMAIL SERVICE] ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${text}`);
    console.log(`------------------------------\n`);
    return true;
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
        const teamDbId = await db.createTeam({
            teamId: teamIdStr,
            name: teamName,
            email,
            password,
            event,
            transactionId
        });

        let leaderWhatsApp = "";

        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const role = i === 0 ? 'LEADER' : 'MEMBER';
            if (i === 0) leaderWhatsApp = m.whatsapp;
            await db.addMember(teamDbId, m, role);
        }

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

        res.json({
            message: 'Registration successful',
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
        await db.updatePassword(teamId, newPassword);
        res.json({ success: true, message: 'Password Updated Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { loginId, password } = req.body;

    try {
        const team = await db.getTeamByLogin(loginId);

        if (team && team.password === password) {
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
app.get('/api/admin/all-teams', async (req, res) => {
    try {
        const teams = await db.getAllTeams();
        const members = await db.getAllMembers();

        const result = teams.map(team => {
            return {
                ...team,
                members: members.filter(m => m.team_db_id === team.id)
            };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get Dashboard Data
app.get('/api/team/:id', async (req, res) => {
    const teamId = req.params.id;
    try {
        const team = await db.getTeamById(teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const members = await db.getMembers(team.id);
        res.json({
            team: team,
            members: members
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Team Members (For Dashboard Save)
app.post('/api/team/:id/update', async (req, res) => {
    const teamId = req.params.id;
    const { members } = req.body;

    if (!members) {
        return res.status(400).json({ error: 'No members provided' });
    }

    try {
        const teamRow = await db.getTeamById(teamId);
        if (!teamRow) return res.status(404).json({ error: 'Team not found' });

        const teamDbId = teamRow.id;

        // Transaction simulation (Postgres has real transactions, SQLite serialized)
        // Ideally DB classes should handle transaction block, but here we just sequentially execute
        await db.deleteAllMembers(teamDbId);

        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const role = m.role || (i === 0 ? 'LEADER' : 'MEMBER');
            await db.addMember(teamDbId, m, role);
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
