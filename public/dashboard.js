document.addEventListener('DOMContentLoaded', () => {
    const teamId = localStorage.getItem('current_team_id');
    let currentRole = localStorage.getItem('current_user_role') || 'LEADER'; // Default
    let team = null;
    const container = document.getElementById('dashboard-table-container');
    const teamNameHeader = document.getElementById('dashboard-team-name');
    const form = document.getElementById('dashboard-form');
    const leaderControls = document.getElementById('leader-controls');

    // Find Team
    // Logic:
    // 1. If file:// protocol, use localhost:3000
    // 2. If running on localhost or 127.0.0.1 (e.g. Live Server port 5500), use localhost:3000
    // 3. If running on a public tunnel (loca.lt, ngrok), use relative path ''
    const isLocal = window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    const API_BASE_URL = isLocal ? 'http://localhost:3000' : '';

    // Load Team Data via API
    fetch(`${API_BASE_URL}/api/team/${teamId}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                if (data.error === 'Team not found') {
                    alert('Team not found. Logging out.');
                    window.logout();
                } else {
                    alert('Error loading data: ' + data.error);
                }
                return;
            }
            team = data.team;
            team.members = data.members;

            // Set default roles from DB if present, else infer
            // Ensure members array is populated
            if (!team.members) team.members = [];

            // Update Payment Status
            const paymentBadgeContainer = document.getElementById('payment-status-badge');
            if (paymentBadgeContainer) {
                // Check Verified Status First
                const isVerified = parseInt(team.payment_verified, 10) === 1;
                // 'hasUploaded' should be true ONLY if there is a valid transaction_id AND it is NOT 'PENDING' or 'NOT_PROVIDED'
                // OR if there is a payment_proof path.
                // Note: The register flow sets transactionId to "PENDING". 
                const txId = team.transaction_id || "";
                const isTxPending = txId.toUpperCase() === 'PENDING' || txId.toUpperCase() === 'NOT_PROVIDED';

                // If we have a proof file path, we assume uploaded.
                // If we have a transaction ID that is NOT pending/not_provided, we assume uploaded/validating.
                const hasUploaded = team.payment_proof || (txId && !isTxPending);

                if (isVerified) {
                    paymentBadgeContainer.innerHTML = "[ PAYMENT COMPLETED ]";
                    paymentBadgeContainer.style.boxShadow = "0 0 10px var(--neon-green)";
                    paymentBadgeContainer.style.border = "1px solid var(--neon-green)";
                    paymentBadgeContainer.style.color = "var(--neon-green)";
                    paymentBadgeContainer.style.cursor = "default";
                    paymentBadgeContainer.onclick = null;
                }
                else if (hasUploaded) {
                    paymentBadgeContainer.innerHTML = "[ VALIDATING PAYMENT... ]";
                    paymentBadgeContainer.style.boxShadow = "0 0 10px #FFA500";
                    paymentBadgeContainer.style.border = "1px solid #FFA500";
                    paymentBadgeContainer.style.color = "#FFA500";
                    paymentBadgeContainer.style.cursor = "default";
                    paymentBadgeContainer.onclick = null;
                }
                else {
                    // Payment Not Done
                    paymentBadgeContainer.innerHTML = `<i class="fas fa-exclamation-triangle"></i> [ PAYMENT PENDING ]`;
                    paymentBadgeContainer.style.boxShadow = "0 0 10px #ff3333";
                    paymentBadgeContainer.style.border = "1px solid #ff3333";
                    paymentBadgeContainer.style.color = "#ff3333";
                    paymentBadgeContainer.style.cursor = "default";
                    paymentBadgeContainer.style.animation = "pulseRed 2s infinite";
                    paymentBadgeContainer.onclick = null;

                    // Add Payment Link
                    const linkId = 'payment-action-link';
                    let link = document.getElementById(linkId);
                    if (!link) {
                        link = document.createElement('span'); // Using span acting as link to avoid default anchor behavior issues if any
                        link.id = linkId;
                        link.style.marginLeft = '15px';
                        link.style.color = '#ff3333';
                        link.style.fontWeight = 'bold';
                        link.style.textDecoration = 'underline';
                        link.style.cursor = 'pointer';
                        link.innerText = 'Click here to complete the payment';
                        // Append to the parent (div)
                        paymentBadgeContainer.parentNode.appendChild(link);
                    }

                    link.onclick = () => {
                        const encodedEvent = encodeURIComponent(team.event);
                        window.location.href = `payment.html?teamId=${team.team_id}&event=${encodedEvent}&members=${team.members.length}`;
                    };
                }
            }

            renderMembers();
        })
        .catch(err => {
            console.error('API Error:', err);
            // Fallback for offline dev (optional, but requested to move to backend so...)
            // alert("Failed to connect to backend server.");
        });

    if (!team) {
        // While fetching, show nothing or loader?
        // Logic handled in .then() above.
        // remove strict check here as it's async now.
    }

    // teamNameHeader will be updated after fetch?
    // Move it inside .then if possible, or bind it to a variable.
    // Let's defer rendering.

    function renderMembers() {
        if (!team) return;
        teamNameHeader.innerText = `> TEAM: ${team.name} [ ID: ${team.team_id} ]`; // Updated to use Name from DB

        const isLeader = currentRole === 'LEADER';
        document.getElementById('role-indicator').innerText = `[ VIEW: ${currentRole} ]`;

        if (isLeader) {
            leaderControls.style.display = 'block';
            document.getElementById('role-leader-btn').style.background = 'rgba(0,255,65,0.2)';
            document.getElementById('role-member-btn').style.background = 'transparent';
        } else {
            leaderControls.style.display = 'block'; // Keep block to show Change Password if needed, or hide specific buttons
            document.getElementById('role-leader-btn').style.background = 'transparent';
            document.getElementById('role-member-btn').style.background = 'rgba(0,255,65,0.2)';
        }

        let tableHtml = `
            <table style="width: 100%; border-collapse: collapse; color: #fff; margin-top: 10px;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--neon-green); text-align: left;">
                        <th style="padding: 10px;">ROLE</th>
                        <th style="padding: 10px;">FULL NAME</th>
                        <th style="padding: 10px;">AGE</th>
                        <th style="padding: 10px;">EMAIL ID</th>
                        <th style="padding: 10px;">PHONE</th>
                        <th style="padding: 10px;">WHATSAPP</th>
                        <th style="padding: 10px;">COLLEGE</th>
                        <th style="padding: 10px;">DISTRICT</th>
                    </tr>
                </thead>
                <tbody>
        `;

        team.members.forEach((member, index) => {
            const roleLabel = index === 0 ? '<span style="color:var(--neon-yellow)">(LEADER)</span>' : `OP_0${index}`;

            tableHtml += `
                <tr style="border-bottom: 1px solid var(--dark-green);">
                    <td style="padding: 10px; color: var(--neon-green);">${roleLabel}</td>
                    <td style="padding: 10px;">${member.name || '-'}</td>
                    <td style="padding: 10px;">${member.age || '-'}</td>
                    <td style="padding: 10px;">${member.email || '-'}</td>
                    <td style="padding: 10px;">${member.phone || '-'}</td>
                    <td style="padding: 10px;">${member.whatsapp || '-'}</td>
                    <td style="padding: 10px;">${member.college || '-'}</td>
                    <td style="padding: 10px;">${member.district || '-'}</td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table>`;

        container.innerHTML = tableHtml;
    }

    // --- Actions ---

    window.switchRole = function (newRole) {
        currentRole = newRole;
        renderMembers();
    };



<<<<<<< HEAD
    // Change Password Logic (OTP Based)
    window.changePassword = async function () {
        if (!teamId) return;

        // Step 1: Ask for Old Password
        const oldPass = prompt("ENTER YOUR OLD PASSWORD TO VERIFY IDENTITY:");
        if (!oldPass) return;

        // Step 2: Request OTP
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, oldPassword: oldPass })
            });
            const data = await res.json();

            if (!res.ok) {
                alert("ERROR: " + (data.error || "Failed to verify identity"));
                return;
=======
    // Change Password Logic (Custom UI)
    window.changePassword = function () {
        // Remove existing modal if any
        const existingModal = document.getElementById('password-reset-modal');
        if (existingModal) existingModal.remove();

        // Create Modal Structure
        const modal = document.createElement('div');
        modal.id = 'password-reset-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
        `;

        modal.innerHTML = `
            <div style="background: #000; border: 2px solid var(--neon-green); padding: 30px; width: 400px; text-align: center; box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);">
                <h2 style="color: var(--neon-green); border-bottom: 1px solid var(--dark-green); padding-bottom: 10px; margin-bottom: 20px;">> CHANGE_PASSWORD</h2>
                
                <!-- Stage 1: Old Password -->
                <div id="pwd-stage-1">
                    <p style="color: #ccc; margin-bottom: 15px;">Verify Identity</p>
                    <input type="password" id="old-pass-input" placeholder="Enter Old Password" style="width: 100%; padding: 10px; background: #111; border: 1px solid #333; color: #fff; margin-bottom: 15px; text-align: center;">
                    <button id="verify-old-btn" class="jack-in-btn" style="width: 100%;">[ VERIFY ]</button>
                </div>

                <!-- Stage 2: OTP -->
                <div id="pwd-stage-2" style="display: none;">
                    <p style="color: #00BFFF; margin-bottom: 15px;" id="otp-msg">OTP Sent to Leader's Email</p>
                    <input type="text" id="otp-input" placeholder="Enter OTP" style="width: 100%; padding: 10px; background: #111; border: 1px solid #333; color: #fff; margin-bottom: 15px; text-align: center; letter-spacing: 3px;">
                    <button id="verify-otp-btn" class="jack-in-btn" style="width: 100%;">[ VERIFY OTP ]</button>
                </div>

                <!-- Stage 3: New Password -->
                <div id="pwd-stage-3" style="display: none;">
                    <p style="color: var(--neon-yellow); margin-bottom: 15px;">Set New Password</p>
                    <input type="text" id="new-pass-input" placeholder="Enter New Password" style="width: 100%; padding: 10px; background: #111; border: 1px solid #333; color: #fff; margin-bottom: 15px; text-align: center;">
                    <button id="set-new-pass-btn" class="jack-in-btn" style="width: 100%;">[ UPDATE PASSWORD ]</button>
                </div>

                <button onclick="document.getElementById('password-reset-modal').remove()" style="margin-top: 20px; background: none; border: none; color: #666; cursor: pointer;">[ CANCEL ]</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Bind Events
        document.getElementById('verify-old-btn').onclick = async () => {
            const oldPass = document.getElementById('old-pass-input').value;
            if (!oldPass) return alert("Please enter your old password");

            const btn = document.getElementById('verify-old-btn');
            btn.innerText = "[ CHECKING... ]";
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId, oldPassword: oldPass })
                });
                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Verification Failed");
                    btn.innerText = "[ VERIFY ]";
                    btn.disabled = false;
                    return;
                }

                document.getElementById('pwd-stage-1').style.display = 'none';
                document.getElementById('pwd-stage-2').style.display = 'block';
                document.getElementById('otp-msg').innerText = data.message;
            } catch (e) {
                alert("Network Error");
                btn.innerText = "[ VERIFY ]";
                btn.disabled = false;
            }
        };

        document.getElementById('verify-otp-btn').onclick = () => {
            const otp = document.getElementById('otp-input').value;
            if (otp) {
                document.getElementById('pwd-stage-2').style.display = 'none';
                document.getElementById('pwd-stage-3').style.display = 'block';
            } else {
                alert("Please enter OTP");
            }
        };

        document.getElementById('set-new-pass-btn').onclick = async () => {
            const otp = document.getElementById('otp-input').value;
            const newPass = document.getElementById('new-pass-input').value;
            if (!newPass) return alert("Please enter new password");

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/verify-reset-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId, otp, newPassword: newPass })
                });
                const data = await res.json();

                if (data.success) {
                    showCustomAlert("PASSWORD UPDATED SUCCESSFULLY! PLEASE LOGIN AGAIN.", () => {
                        window.logout();
                    });
                } else {
                    alert("ERROR: " + data.error);
                }
            } catch (e) {
                alert("Network Error");
>>>>>>> 18888004dd36ce2cb8e8796a07a7de5be02b5eab
            }
        };
    };

    // Initial Render
    renderMembers();
});




// Global Logout Function
window.logout = function () {
    localStorage.removeItem('current_team_id');
    localStorage.removeItem('current_team_name');
    window.location.href = 'login.html';
};
