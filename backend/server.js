const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Use teamId from body (requires teamId to be appended BEFORE file in FormData)
        const teamId = req.body.teamId || 'unknown-' + Date.now();
        cb(null, teamId + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        payment_proof TEXT
    )`);

    // Add column if not exists (for existing DBs)
    db.run(`ALTER TABLE teams ADD COLUMN payment_proof TEXT`, (err) => {
        // Ignore error if column exists
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
// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(to, subject, text, html = null) {
    console.log(`Sending email to ${to}...`);
    try {
        const info = await transporter.sendMail({
            from: `"XploitX-2026" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            text: text,
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
    console.log("[REGISTER] Request received:", req.body.teamName);
    const { teamName, email, password, event, transactionId, members } = req.body;

    if (!teamName || !email || !password || !members || members.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate temporary ID for initial insertion
    const tempId = 'TEMP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

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

        // 1. Create Team with Temp ID
        const result = await runQuery(
            `INSERT INTO teams (team_id, name, email, password, event, transaction_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [tempId, teamName, email, password, event, transactionId]
        );
        const teamDbId = result.lastID;

        // 2. Generate Sequential Team ID (Xctf26te0001) based on DB ID
        const teamIdStr = `Xctf26te${String(teamDbId).padStart(4, '0')}`;

        // 3. Update Team ID in DB
        await runQuery(`UPDATE teams SET team_id = ? WHERE id = ?`, [teamIdStr, teamDbId]);

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

        // Send Emails
        console.log("[REGISTER] Sending emails...");
        const subject = "Confirmation: Your Registration for XploitX 2k26 Cyberfest!";

        // Send in background, don't await to block response
        (async () => {
            try {
                if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
                    console.log("[REGISTER] Skipping email - credentials not set.");
                    return;
                }
                for (let i = 0; i < members.length; i++) {
                    const m = members[i];
                    const isLeader = (i === 0);

                    let body = `Dear ${m.name},

Thank you for registering for **XploitX 2k26**, the Department of Cyber Security's premier cyberfest! We are thrilled to have you join us for this high-energy technical exchange.

This email confirms that your registration has been successfully received. We are hard at work preparing an incredible lineup of events, challenges, and workshops designed to push your technical boundaries.`;

                    if (isLeader) {
                        body += `

**Your Action Required - Login Credentials:**
Please save these details to access your team dashboard:
--------------------------------------------------
Team ID  : ${teamIdStr}
Password : ${password}
--------------------------------------------------`;
                    }

                    body += `

**Event Details:**

* Dates: March 13th & 14th, 2026
* Venue: Prathyusha Engineering College Campus
* Check-in Starts: 8:30 AM (on both days)

We truly appreciate your interest and presence at our event. Your participation is what makes XploitX a hub for innovation and cybersecurity excellence.

**Next Steps:**

* Keep an eye on your inbox for the detailed event schedule and specific competition guidelines.
* Make sure to bring your college ID card and a copy of this confirmation email (digital or printed) for a smooth check-in process.

We look forward to seeing you there and witnessing your skills in action!

Best regards,

**The XploitX 2k26 Organizing Committee**
Department of Cyber Security
Prathyusha Engineering College`;

                    // Send email to this specific member
                    if (m.email) {
                        await sendEmail(m.email, subject, body);
                    }
                }
            } catch (e) {
                console.error("[REGISTER] Email sending background error:", e);
            }
        })();

        console.log("[REGISTER] Success. Returning JSON.");
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

// --- OTP STORAGE (In-Memory for simplicity, use Redis/DB in prod) ---
const otpStore = {}; // { teamId: { otp: "123456", expires: 1234567890 } }

// 1. Request OTP for Password Reset
app.post('/api/auth/request-password-reset', async (req, res) => {
    const { teamId, oldPassword } = req.body;

    try {
        // Verify Team & Old Password
        const team = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM teams WHERE team_id = ?`, [teamId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (team.password !== oldPassword) return res.status(401).json({ error: 'Incorrect old password' });

        // Get Leader Email
        const leader = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM members WHERE team_db_id = ? AND role = 'LEADER'`, [team.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!leader || !leader.email) {
            return res.status(400).json({ error: 'Leader email not found. Contact Admin.' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP (valid for 10 mins)
        otpStore[teamId] = {
            otp: otp,
            expires: Date.now() + 10 * 60 * 1000
        };

        // Send Email with HTML Template
        const htmlContent = `
            <h2>🔐 Password Reset Request</h2>
            <p>Dear Participant,</p>
            <p>
                We received a request to reset the password for your
                <b>XploitX-2026</b> account.
            </p>
            <p>
                Please use the following <b>One-Time Password (OTP)</b> to proceed
                with changing your password:
            </p>
            <h1 style="letter-spacing: 4px; color: #0a1a2f;">${otp}</h1>
            <p>
                This OTP is valid for <b>10 minutes</b>. For your security,
                please do not share this OTP with anyone.
            </p>
            <hr>
            <p>
                If you did not request a password reset, please ignore this email.
                Your account will remain secure.
            </p>
            <p style="margin-top: 25px;">
                Best regards,<br>
                <b>The XploitX-2026 Organizing Committee</b><br>
                Department of Cyber Security<br>
                Prathyusha Engineering College
            </p>
        `;

        const sent = await sendEmail(
            leader.email,
            'XploitX-2026 | OTP for Password Reset',
            `Your OTP is: ${otp}`, // Fallback text
            htmlContent
        );

        if (sent) {
            // Mask email for privacy in response
            const maskedEmail = leader.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
            res.json({ success: true, message: `OTP sent to leader's email (${maskedEmail})` });
        } else {
            res.status(500).json({ error: 'Failed to send OTP email' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Verify OTP and Update Password
app.post('/api/auth/verify-reset-otp', async (req, res) => {
    const { teamId, otp, newPassword } = req.body;

    if (!otpStore[teamId]) {
        return res.status(400).json({ error: 'No OTP request found or expired.' });
    }

    const storedData = otpStore[teamId];

    if (Date.now() > storedData.expires) {
        delete otpStore[teamId];
        return res.status(400).json({ error: 'OTP expired. Please request again.' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    try {
        await new Promise((resolve, reject) => {
            db.run(`UPDATE teams SET password = ? WHERE team_id = ?`, [newPassword, teamId], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // Clear OTP
        delete otpStore[teamId];

        res.json({ success: true, message: 'Password Updated Successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { loginId, password } = req.body;
    console.log(`[LOGIN] Attempt for ID/Email: '${loginId}' with Password: '${password}'`);

    try {
        const team = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM teams WHERE team_id = ? OR name = ?`,
                [loginId, loginId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        console.log(`[LOGIN] DB Lookup Result:`, team ? "Found" : "Not Found");
        if (team) console.log(`[LOGIN] Found Team Match: ${team.team_id} | Pass Match: ${team.password === password}`);

        if (!team) {
            return res.status(401).json({ error: 'Team ID not found' });
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
            res.status(401).json({ error: 'Enter the correct password' });
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

// Upload Payment Proof
app.post('/api/payment/upload', upload.single('paymentProof'), (req, res) => {
    const { teamId } = req.body;
    const file = req.file;

    if (!file || !teamId) {
        return res.status(400).json({ error: 'Missing file or Team ID' });
    }

    const filePath = '/uploads/' + file.filename;

    db.run(`UPDATE teams SET payment_proof = ? WHERE team_id = ?`, [filePath, teamId], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database update failed' });
        }
        res.json({ success: true, message: 'Payment proof uploaded successfully' });
    });
});

// Admin Update Team Endpoint
app.post('/api/admin/update_team', async (req, res) => {
    const { teamId, name, event, password, members } = req.body;

    if (!teamId || !members) {
        return res.status(400).json({ error: 'Missing required fields' });
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

        // Update Team Info
        await new Promise((resolve, reject) => {
            db.run(`UPDATE teams SET name = ?, event = ?, password = ? WHERE id = ?`, [name, event, password, teamDbId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Replace Members
        await new Promise((resolve, reject) => {
            db.run(`DELETE FROM members WHERE team_db_id = ?`, [teamDbId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

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
            // Infer role if not provided, though admin should probably provide it or we preserve it? 
            // In the admin editor, we will send the role back.
            const role = m.role || (i === 0 ? 'LEADER' : 'MEMBER');

            await runQuery(
                `INSERT INTO members (team_db_id, name, age, email, phone, whatsapp, college, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [teamDbId, m.name, m.age, m.email, m.phone, m.whatsapp, m.college, m.address, role]
            );
        }

        res.json({ success: true, message: 'Team and members updated successfully' });

    } catch (err) {
        console.error(err);
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