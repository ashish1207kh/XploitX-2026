document.addEventListener('DOMContentLoaded', () => {
    const teamId = localStorage.getItem('current_team_id');
    const role = localStorage.getItem('current_user_role') || 'LEADER'; // Default
    const teams = JSON.parse(localStorage.getItem('hackathon_teams') || '[]');
    const container = document.getElementById('dashboard-members');
    const teamNameHeader = document.getElementById('dashboard-team-name');
    const form = document.getElementById('dashboard-form');
    const leaderControls = document.getElementById('leader-controls');

    // Find Team
    // Load Team Data via API
    fetch(`/api/team/${teamId}`)
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
        teamNameHeader.innerText = `> TEAM: ${team.name}`; // Updated to use Name from DB

        container.innerHTML = '';
        const isLeader = currentRole === 'LEADER';

        document.getElementById('role-indicator').innerText = `[ VIEW: ${currentRole} ]`;

        if (isLeader) {
            leaderControls.style.display = 'block';
            document.getElementById('role-leader-btn').style.background = 'rgba(0,255,65,0.2)';
            document.getElementById('role-member-btn').style.background = 'transparent';
        } else {
            leaderControls.style.display = 'none';
            document.getElementById('role-leader-btn').style.background = 'transparent';
            document.getElementById('role-member-btn').style.background = 'rgba(0,255,65,0.2)';
        }

        team.members.forEach((member, index) => {
            const card = document.createElement('div');
            card.className = 'member-card';
            // Determine if input is disabled
            const disabled = !isLeader ? 'disabled' : '';
            const readOnlyStyle = !isLeader ? 'background: transparent; border: none; color: #ccc;' : '';

            card.innerHTML = `
                <h4 style="color: #fff; margin-bottom: 15px;">
                    > OPERATIVE_0${index + 1} ${index === 0 ? '(LEADER)' : ''}
                    ${isLeader && team.members.length > 4 ?
                    `<button type="button" onclick="removeMember(${index})" style="float: right; color: #ff5555; background: none; border: 1px solid #ff5555; cursor: pointer; font-size: 0.7rem; padding: 2px 5px;">REMOVE</button>`
                    : ''}
                </h4>
                <div class="grid-2">
                    <div class="form-group">
                        <label>FULL NAME</label>
                        <input type="text" name="member_${index}_name" value="${member.name}" ${disabled} style="${readOnlyStyle}">
                    </div>
                    <div class="form-group">
                        <label>AGE</label>
                        <input type="number" name="member_${index}_age" value="${member.age}" ${disabled} style="${readOnlyStyle}">
                    </div>
                    <div class="form-group">
                        <label>EMAIL ID</label>
                        <input type="email" name="member_${index}_email" value="${member.email}" ${disabled} style="${readOnlyStyle}">
                    </div>
                    <div class="form-group">
                        <label>PHONE NUMBER</label>
                        <input type="tel" name="member_${index}_phone" value="${member.phone}" ${disabled} style="${readOnlyStyle}">
                    </div>
                    <div class="form-group">
                        <label>COLLEGE NAME</label>
                        <input type="text" name="member_${index}_college" value="${member.college}" ${disabled} style="${readOnlyStyle}">
                    </div>
                    <div class="form-group">
                        <label>RESIDENTIAL ADDRESS</label>
                        <input type="text" name="member_${index}_address" value="${member.address}" ${disabled} style="${readOnlyStyle}">
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Add Member Button (Only for Leader and if < 5)
        if (isLeader && team.members.length < 5) {
            const addDiv = document.createElement('div');
            addDiv.innerHTML = `
                <button type="button" onclick="addNewMember()" class="secondary-btn" style="width: 100%; border-style: dashed;">[ + ADD OPERATIVE SLOT ]</button>
            `;
            container.appendChild(addDiv);
        }
    }

    // --- Actions ---

    window.switchRole = function (newRole) {
        currentRole = newRole;
        renderMembers();
    };

    window.logout = function () {
        localStorage.removeItem('current_team_id');
        window.location.href = 'index.html';
    };

    window.removeMember = function (index) {
        if (!confirm('Disavow this operative?')) return;

        // Remove from array
        team.members.splice(index, 1);
        saveToStorage(); // Save via API
        renderMembers(); // Re-render local state
    };

    window.addNewMember = function () {
        team.members.push({
            name: '', age: '', email: '', phone: '', college: '', address: '', role: 'MEMBER'
        });
        saveToStorage(); // Save via API (or just render and let user save explicitly? Preference: Explicit save usually better, but requirements implies 'dynamic'. I'll call saveToStorage which now API calls.)
        renderMembers();
    };

    function saveToStorage() {
        // Current Logic: Full overwrite of members for this team
        // API: POST /api/team/:id/update
        fetch(`/api/team/${teamId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: team.members }) // Send only members array as per server requirement
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("TEAM DATA SYNCHRONIZED.");
                } else {
                    alert("UPDATE FAILED: " + (data.error || 'Unknown Error'));
                }
            })
            .catch(err => alert("NETWORK ERROR: " + err.message));
    }

    // Change Password Function
    window.changePassword = function () {
        const newPass = prompt("ENTER NEW PASSWORD:");
        if (!newPass) return; // Cancelled

        if (newPass.length < 6) {
            alert("ERROR: Password must be at least 6 characters.");
            return;
        }

        fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: teamId, newPassword: newPass })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("PASSWORD UPDATED SUCCESSFULLY.");
                } else {
                    alert("ERROR: " + data.error);
                }
            })
            .catch(err => alert("NETWORK ERROR: " + err.message));
    };
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Harvest inputs for updates
        team.members.forEach((member, index) => {
            const nameIn = document.querySelector(`input[name="member_${index}_name"]`);
            if (nameIn) member.name = nameIn.value;
            const ageIn = document.querySelector(`input[name="member_${index}_age"]`);
            if (ageIn) member.age = ageIn.value;
            const emailIn = document.querySelector(`input[name="member_${index}_email"]`);
            if (emailIn) member.email = emailIn.value;
            const phoneIn = document.querySelector(`input[name="member_${index}_phone"]`);
            if (phoneIn) member.phone = phoneIn.value;
            const collIn = document.querySelector(`input[name="member_${index}_college"]`);
            if (collIn) member.college = collIn.value;
            const addrIn = document.querySelector(`input[name="member_${index}_address"]`);
            if (addrIn) member.address = addrIn.value;
        });

        saveToStorage();



        const btn = document.querySelector('.jack-in-btn');
        const originalText = btn.innerText;
        btn.innerText = "[ SAVED ]";
        btn.style.color = "var(--neon-green)";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.color = "";
        }, 1500);
    });

    // Initial Render
    renderMembers();
});
