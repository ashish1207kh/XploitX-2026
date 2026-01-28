document.addEventListener('DOMContentLoaded', () => {
    const teamId = localStorage.getItem('current_team_id');
    let currentRole = localStorage.getItem('current_user_role') || 'LEADER'; // Default
    let team = null;
    const container = document.getElementById('dashboard-table-container');
    const teamNameHeader = document.getElementById('dashboard-team-name');
    const form = document.getElementById('dashboard-form');
    const leaderControls = document.getElementById('leader-controls');

    // Find Team
    const API_BASE_URL = 'http://localhost:3000';

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
            const paymentBadge = document.getElementById('payment-status-badge');
            if (paymentBadge) {
                if (team.transaction_id || team.payment_proof) {
                    paymentBadge.innerText = "[ PAYMENT COMPLETED ]";
                    paymentBadge.style.boxShadow = "0 0 10px var(--neon-green)";
                    paymentBadge.style.borderColor = "var(--neon-green)";
                    paymentBadge.style.color = "var(--neon-green)";
                } else {
                    paymentBadge.innerText = "[ PAYMENT PENDING ]";
                    paymentBadge.style.boxShadow = "0 0 10px red";
                    paymentBadge.style.borderColor = "red";
                    paymentBadge.style.color = "red";
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
                        <th style="padding: 10px;">ADDRESS</th>
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
                    <td style="padding: 10px;">${member.address || '-'}</td>
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
            }

            alert(data.message); // "OTP sent to leader's email..."

            // Step 3: Verify OTP & Reset
            const otp = prompt("ENTER THE OTP SENT TO YOUR LEADER'S EMAIL:");
            if (!otp) return;

            const newPass = prompt("ENTER YOUR NEW PASSWORD:");
            if (!newPass) return;

            const res2 = await fetch(`${API_BASE_URL}/api/auth/verify-reset-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, otp, newPassword: newPass })
            });
            const data2 = await res2.json();

            if (data2.success) {
                alert("PASSWORD UPDATED SUCCESSFULLY! PLEASE LOGIN AGAIN.");
                window.logout();
            } else {
                alert("ERROR: " + data2.error);
            }

        } catch (err) {
            console.error(err);
            alert("NETWORK/SYSTEM ERROR");
        }
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
