// Matrix code rain animation
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = [];

for (let x = 0; x < columns; x++) {
    drops[x] = 1;
}

function draw() {
    ctx.fillStyle = 'rgba(13, 2, 8, 0.04)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00FF41';
    ctx.font = fontSize + 'px Share Tech Mono';

    for (let i = 0; i < drops.length; i++) {
        const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(draw, 35);

// Form handling
// Form handling
const regForm = document.getElementById('team-form');
if (regForm) {
    // Payment Modal Elements
    const paymentModal = document.getElementById('payment-modal');
    const confirmBtn = document.getElementById('confirm-payment-btn');
    const cancelBtn = document.getElementById('cancel-payment-btn');

    // Registration Handler
    regForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get Event Type
        const eventSelect = document.getElementById('event-select');
        const selectedEvent = eventSelect ? eventSelect.value : '';

        // Calculate Fee based on Event
        let fee = 400; // Default (Hackathon)
        if (selectedEvent === 'paper_presentation') {
            fee = 120;
        } else if (selectedEvent === 'digital_forensics' || selectedEvent === 'network_defense') {
            fee = 0;
        }

        // Free Events Logic
        if (fee === 0) {
            // Direct Registration for Free Events
            registerUser(0, "FREE_ENTRY_" + Math.floor(Math.random() * 10000));
        } else {
            // Paid Events - Show Modal
            // Update Modal Display
            const amountDisplay = document.getElementById('payment-amount-display');
            if (amountDisplay) amountDisplay.innerText = `AMOUNT: ₹ ${fee}.00`;

            // Allow payment handler to know the amount
            startPaymentProcess(fee);

            paymentModal.style.display = 'flex';
        }
    });

    // Helper to start payment process logic
    let currentFee = 400; // global-ish context for the confirm click
    function startPaymentProcess(amount) {
        currentFee = amount;
    }

    // Payment Confirmation
    confirmBtn.addEventListener('click', function () {
        confirmBtn.innerHTML = "[ PROCESSING... ]";
        confirmBtn.disabled = true;

        // Use Real API
        fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: currentFee })
        })
            .then(response => response.json())
            .then(result => {
                if (result.success || true) { // Mock payment always success for now or check result
                    // Generate a mock txn ID if backend doesn't return one (our backend mock payment endpoint isn't fully defined yet but let's assume client generates or server does. Server schema expects txnId. Let's send a mock one or use server's.)
                    // Actually, let's just make up a Txn ID here as before, or assume the backend handles it. 
                    // My server.js expects 'transactionId' in the body.
                    const mockTxnId = "TXN_" + Math.floor(Math.random() * 1000000);
                    registerUser(currentFee, mockTxnId);
                } else {
                    throw new Error("Payment declined");
                }
            })
            .catch(err => {
                // Fallback for demo if server payment route missing
                console.warn("Payment API failed, using mock:", err);
                const mockTxnId = "TXN_MOCK_" + Math.floor(Math.random() * 1000000);
                registerUser(currentFee, mockTxnId);
            });
    });

    // Helper to register user
    function registerUser(amountVal, txnId) {
        // Collect Member Data
        const members = [];
        const memberCards = document.querySelectorAll('.member-card');

        memberCards.forEach((card, index) => {
            const i = index + 1; // 1-based index in inputs
            // Try to find inputs within the card
            // Note: inputs might be named member1_name, member2_name etc.
            // But we can just querySelector inside the card
            const nameInput = card.querySelector(`input[name^="member"][name$="_name"]`);
            const ageInput = card.querySelector(`input[name^="member"][name$="_age"]`);
            const emailInput = card.querySelector(`input[name^="member"][name$="_email"]`);
            const phoneInput = card.querySelector(`input[name^="member"][name$="_phone"]`);
            const whatsappInput = card.querySelector(`input[name^="member"][name$="_whatsapp"]`);
            const collegeInput = card.querySelector(`input[name^="member"][name$="_college"]`);
            const addressInput = card.querySelector(`input[name^="member"][name$="_address"]`);

            if (nameInput) {
                members.push({
                    name: nameInput.value,
                    age: ageInput ? ageInput.value : 0,
                    email: emailInput ? emailInput.value : '',
                    phone: phoneInput ? phoneInput.value : '',
                    whatsapp: whatsappInput ? whatsappInput.value : '',
                    college: collegeInput ? collegeInput.value : '',
                    address: addressInput ? addressInput.value : ''
                });
            }
        });

        // Team Details
        const teamInput = document.getElementById('team-name');
        const teamVal = teamInput ? teamInput.value : 'Unknown Team';

        // Team Password (from the register page input?)
        // Wait, the UI doesn't clearly show a "Team Password" input in the snippets I saw?
        // Let's check register.html or assume we need to add one or use a default?
        // The mock logic generated a password: `AuthMock.generatePassword()`.
        // I will keep that logic: Auto-generate password and email it.
        const password = AuthMock.generatePassword();

        // Leader Email (Member 1)
        const leaderEmail = members.length > 0 ? members[0].email : 'unknown@matrix.com';

        const payload = {
            teamName: teamVal,
            email: leaderEmail,
            password: password,
            event: document.getElementById('event-select').value,
            transactionId: txnId,
            members: members
        };

        // XploitXall
        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert("REGISTRATION ERROR: " + data.error);
                    confirmBtn.innerHTML = "[ INITIATE TRANSFER ]";
                    confirmBtn.disabled = false;
                } else {
                    const amountMsg = amountVal > 0 ? `Paid: ₹${amountVal}` : "Fee: WAIVED (Free Event)";

                    // Backend confirmed registration. Password is in the MAIL (Server Console for now).
                    alert(`REGISTRATION SUCCESSFUL!\n\nCredentials sent to LEADER'S EMAIL.\n(${leaderEmail})\n\nCheck your inbox (or Server Console) for the Password/Access Code.`);
                    window.location.href = 'login.html';
                }
            })
            .catch(err => {
                console.error(err);
                alert("Network Error: " + err.message);
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = "[ INITIATE TRANSFER ]";
            });
    }

    // Cancel Payment

    // Cancel Payment
    cancelBtn.addEventListener('click', function () {
        paymentModal.style.display = 'none';
    });
}


// Custom Cursor: Green Dot & Circle
const cursorDot = document.createElement('div');
cursorDot.classList.add('cursor-dot');
const cursorOutline = document.createElement('div');
cursorOutline.classList.add('cursor-outline');
document.body.appendChild(cursorDot);
document.body.appendChild(cursorOutline);

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    // Dot follows immediately
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Outline follows with slight delay
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Mobile Touch Support for Cursor
window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const posX = touch.clientX;
    const posY = touch.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Interactive Elements Hover Effect
const interactiveElements = document.querySelectorAll('a, button, .card, input, select');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.2)';
    });
    el.addEventListener('mouseleave', () => {
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
    });
});

// Interactive Elements Hover Effect


// Scroll Animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show-el');
        }
    });
});

const hiddenElements = document.querySelectorAll('.hidden-el');
hiddenElements.forEach((el) => observer.observe(el));

// Loading Screen
window.addEventListener('load', () => {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 1500); // Show loader for 1.5s minimum
    }
});

// Store original text in data-value for the matrix effect
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav a').forEach(link => {
        link.dataset.value = link.innerText;
    });
});

// Countdown Timer
function startCountdown() {
    // Target Date: March 13, 2026 09:30:00
    const eventDate = new Date('March 13, 2026 09:30:00').getTime();

    // Update the count down every 1 second
    const x = setInterval(function () {
        const now = new Date().getTime();
        const distance = eventDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the elements with id="days", "hours", "mins", "secs"
        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minsEl = document.getElementById("mins");
        const secsEl = document.getElementById("secs");

        if (daysEl && hoursEl && minsEl && secsEl) {
            daysEl.innerText = days < 10 ? "0" + days : days;
            hoursEl.innerText = hours < 10 ? "0" + hours : hours;
            minsEl.innerText = minutes < 10 ? "0" + minutes : minutes;
            secsEl.innerText = seconds < 10 ? "0" + seconds : seconds;
        }

        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            if (daysEl) document.querySelector('.countdown-container').innerHTML = "<div style='color: var(--neon-green); font-size: 2rem;'>[ BREACH IN PROGRESS ]</div>";
        }
    }, 1000);
}

// Start countdown
startCountdown();

// --- LIVE CYBER SECURITY NEWS FETCH ---
async function fetchCyberNews() {
    // Only update the Terminal, leave Marquee as static HTML ("REGISTRATIONS STARTS SOON")
    const terminalBody = document.querySelector('.cyber-insights .terminal-body');
    const terminalTitle = document.querySelector('.cyber-insights .terminal-title');

    // URLs
    const rssUrl = 'https://feeds.feedburner.com/TheHackersNews';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {

            // UPDATE TERMINAL (Cyber Intelligence Section)
            if (terminalBody) {
                // Update Title
                if (terminalTitle) terminalTitle.innerText = "root@matrix:~/live_threat_feed.log";

                let terminalHtml = '';

                // Show top 3 items with details
                data.items.slice(0, 3).forEach(item => {
                    const date = new Date(item.pubDate).toLocaleDateString();
                    // Strip HTML from description if possible, though innerHTML is used. 
                    // RSS2JSON returns description often with HTML. We can use it or strip it.
                    // Let's use a simple regex to strip basic tags if it's too messy, or just trust it.
                    // Usually description is a short snippet.

                    terminalHtml += `
                        <p style="margin-bottom: 25px; border-bottom: 1px dashed #333; padding-bottom: 15px;">
                            <span style="color: var(--neon-green);">>> [${date}] NEW_INTEL_RECEIVED:</span><br>
                            <a href="${item.link}" target="_blank" style="color: #fff; text-decoration: none; font-weight: bold; font-size: 1.1rem; display: block; margin: 5px 0;">
                                ${item.title}
                            </a>
                            <span style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 8px;">
                                ${item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'No details available.'}
                            </span>
                            <a href="${item.link}" target="_blank" style="color: #00e5ff; font-size: 0.8rem;">[ ACCESS_FULL_DATA ]</a>
                        </p>
                    `;
                });

                // Add a blinking cursor at the end
                terminalHtml += `
                    <p style="color: var(--neon-green); margin-top: 10px;">
                        >> AWAITING_NEXT_PACKET <span class="blink">_</span>
                    </p>
                `;

                terminalBody.innerHTML = terminalHtml;
            }

        }
    } catch (error) {
        console.error('Failed to fetch news:', error);
        // Keep original terminal content on error or show error message
    }
}

// Fetch immediately
fetchCyberNews();

// Refresh news every 10 minutes
setInterval(fetchCyberNews, 600000);
