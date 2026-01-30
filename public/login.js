document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const btn = document.querySelector('.jack-in-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const teamId = document.getElementById('login-id').value;
        const password = document.getElementById('login-password').value;

        btn.innerText = "[ VERIFYING... ]";
        btn.disabled = true;

        // Logic:
        // 1. If file:// protocol, use localhost:3000
        // 2. If running on localhost or 127.0.0.1 (e.g. Live Server port 5500), use localhost:3000
        // 3. If running on a public tunnel (loca.lt, ngrok), use relative path ''
        const isLocal = window.location.protocol === 'file:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        const API_BASE_URL = isLocal ? 'http://localhost:3000' : '';

        setTimeout(() => {
            fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId: teamId, password: password })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        localStorage.setItem('current_team_id', data.team.id);
                        localStorage.setItem('current_team_name', data.team.name);

                        btn.innerText = "[ ACCESS GRANTED ]";
                        btn.style.color = "var(--neon-green)";
                        window.location.href = 'dashboard.html';
                    } else {
                        throw new Error(data.error || "Invalid Credentials");
                    }
                })
                .catch(err => {
                    btn.innerText = "[ ACCESS DENIED ]";
                    btn.style.color = "red";
                    showCustomAlert(err.message); // Show specific error to user
                    console.error(err);
                    setTimeout(() => {
                        btn.innerText = "[ ACCESS DASHBOARD ]";
                        btn.style.color = "";
                        btn.disabled = false;
                    }, 1500);
                });
        }, 1000);
    });
    // PASSWORD RESET LOGIC
    const resetLink = document.getElementById('forgot-pass-link');
    const resetModal = document.getElementById('reset-modal');
    const closeResetBtn = document.getElementById('close-reset-modal');

    // Elements
    const step1 = document.getElementById('reset-step-1');
    const step2 = document.getElementById('reset-step-2');
    const emailInput = document.getElementById('reset-email');
    const otpInput = document.getElementById('reset-otp');
    const newPassInput = document.getElementById('new-password');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const updatePassBtn = document.getElementById('update-pass-btn');

    let currentResetEmail = "";
    let sentOtp = "";

    // Open Modal
    resetLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetModal.style.display = 'flex';
        step1.style.display = 'block';
        step2.style.display = 'none';
        emailInput.value = "";
    });

    // Close Modal
    closeResetBtn.addEventListener('click', () => {
        resetModal.style.display = 'none';
    });

    // Send OTP
    sendOtpBtn.addEventListener('click', () => {
        const email = emailInput.value;
        if (!email) {
            showCustomAlert("Enter a valid email.");
            return;
        }

        // Verify Email Exists
        const teams = JSON.parse(localStorage.getItem('hackathon_teams') || '[]');
        const team = teams.find(t => t.email === email);
        if (!team) {
            showCustomAlert("No unit found with this email identifier.");
            return;
        }

        currentResetEmail = email;
        sentOtp = AuthMock.generateOTP();

        AuthMock.sendEmail(email, "MATRIX HACK: Security Override Code", `Your OTP is: ${sentOtp}`);

        showCustomAlert(`OTP SENT TO ${email}\n(Check Console: ${sentOtp})`);

        step1.style.display = 'none';
        step2.style.display = 'block';
    });

    // Update Password
    updatePassBtn.addEventListener('click', () => {
        const otp = otpInput.value;
        const newPass = newPassInput.value;

        if (otp !== sentOtp) {
            showCustomAlert("INVALID PROTOCOL. OTP MISMATCH.");
            return;
        }
        if (newPass.length < 4) {
            showCustomAlert("Password strength insufficient.");
            return;
        }

        // Update in "DB"
        const teams = JSON.parse(localStorage.getItem('hackathon_teams') || '[]');
        const teamIndex = teams.findIndex(t => t.email === currentResetEmail);

        if (teamIndex > -1) {
            teams[teamIndex].password = newPass;
            localStorage.setItem('hackathon_teams', JSON.stringify(teams));

            showCustomAlert("SECURITY OVERRIDE SUCCESSFUL. New credentials active.");
            resetModal.style.display = 'none';
        } else {
            showCustomAlert("Error finding record.");
        }
    });

});
