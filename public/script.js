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
const regForm = document.getElementById('team-form');
if (regForm) {
    // Configuration
    const EVENT_CONFIG = {
        '24 Hrs Hackathon': { min: 4, max: 4, fee: 250, perHead: true },
        'paper_presentation': { min: 3, max: 3, fee: 120, perHead: false },
        'digital_forensics': { min: 2, max: 3, fee: 0, perHead: false },
        'network_defense': { min: 2, max: 3, fee: 0, perHead: false }
    };

    let currentFee = 0;
    let currentMin = 1;
    let currentMax = 5;

    // Elements
    const eventSelect = document.getElementById('event-select');
    const membersContainer = document.getElementById('members-container');
    const addMemberBtn = document.getElementById('add-member-btn');
    const removeMemberBtn = document.getElementById('remove-member-btn');
    const paymentModal = document.getElementById('payment-modal');
    const confirmBtn = document.getElementById('confirm-payment-btn');
    const cancelBtn = document.getElementById('cancel-payment-btn');
    const amountDisplay = document.getElementById('payment-amount-display');
    const submitBtn = regForm.querySelector('button[type="submit"]');

    // Initialize
    function init() {
        if (eventSelect.value) {
            handleEventChange();
        } else {
            // Default state
            updateButtons();
        }
    }

    // Event Change Handler
    eventSelect.addEventListener('change', handleEventChange);

    function handleEventChange() {
        const evt = eventSelect.value;
        const config = EVENT_CONFIG[evt];

        if (!config) return;

        currentMin = config.min;
        currentMax = config.max;

        // Initial fee calculation logic is moved to updateFee() to handle dynamic member counts
        currentFee = config.fee;
        if (config.perHead) {
            // Need to calculate based on current members, but first enforce size
            // We need a separate function to recalculate fee whenever members change
        }

        // Update UI
        enforceTeamSize(); // This might add/remove members
        updateFee(); // New function to calculate fee based on count
        updateButtons();
        updateSubmitButton();
    }

    function updateFee() {
        const evt = eventSelect.value;
        const config = EVENT_CONFIG[evt];
        if (!config) return;

        const memberCount = membersContainer.querySelectorAll('.member-card').length;

        if (config.perHead) {
            currentFee = config.fee * memberCount;
        } else {
            currentFee = config.fee;
        }
        updateFeeDisplay();
        updateSubmitButton();
    }

    function updateFeeDisplay() {
        if (amountDisplay) {
            amountDisplay.innerText = `AMOUNT: ₹ ${currentFee}.00`;
        }
    }

    function updateSubmitButton() {
        if (submitBtn) {
            if (currentFee === 0) {
                submitBtn.innerText = "[ REGISTER NOW ]";
            } else {
                submitBtn.innerText = "[ PROCEED TO PAYMENT ]";
            }
        }
    }

    // Add Member Handler
    addMemberBtn.addEventListener('click', () => {
        const currentCount = membersContainer.querySelectorAll('.member-card').length;
        if (currentCount < currentMax) {
            addMemberCard(currentCount + 1);
            updateButtons();
            updateFee();
        }
    });

    // Remove Member Handler
    removeMemberBtn.addEventListener('click', () => {
        const currentCount = membersContainer.querySelectorAll('.member-card').length;
        if (currentCount > currentMin) {
            membersContainer.lastElementChild.remove();
            updateButtons();
            updateFee();
        }
    });

    function addMemberCard(index) {
        const div = document.createElement('div');
        div.className = 'member-card';
        div.id = `member-${index}`;
        div.innerHTML = `
            <h4 style="color: #fff; margin-bottom: 15px;">> OPERATIVE_0${index}</h4>
            <div class="grid-2">
                <div class="form-group"><label>FULL NAME</label><input type="text" name="member${index}_name" required></div>
                <div class="form-group"><label>AGE</label><input type="number" name="member${index}_age" required></div>
                <div class="form-group"><label>EMAIL ID</label><input type="email" name="member${index}_email" required></div>
                <div class="form-group"><label>PHONE NUMBER</label><input type="tel" name="member${index}_phone" required></div>
                <div class="form-group"><label>WHATSAPP NUMBER</label><input type="tel" name="member${index}_whatsapp" required></div>
                <div class="form-group"><label>COLLEGE NAME</label><input type="text" name="member${index}_college" required></div>
                <div class="form-group"><label>RESIDENTIAL ADDRESS</label><input type="text" name="member${index}_address" required></div>
            </div>
        `;
        membersContainer.appendChild(div);
    }

    function enforceTeamSize() {
        const cards = membersContainer.querySelectorAll('.member-card');
        const currentCount = cards.length;

        // Add if below min
        if (currentCount < currentMin) {
            for (let i = currentCount + 1; i <= currentMin; i++) {
                addMemberCard(i);
            }
        }
        // Remove if above min (User Request: "Why showing if not compulsory?")
        else if (currentCount > currentMin) {
            for (let i = currentCount; i > currentMin; i--) {
                membersContainer.lastElementChild.remove(); // Safely remove the last added card
            }
        }
    }

    function updateButtons() {
        const currentCount = membersContainer.querySelectorAll('.member-card').length;
        addMemberBtn.disabled = currentCount >= currentMax;
        addMemberBtn.style.opacity = currentCount >= currentMax ? '0.5' : '1';

        removeMemberBtn.disabled = currentCount <= currentMin;
        removeMemberBtn.style.opacity = currentCount <= currentMin ? '0.5' : '1';
    }

    // Helper: Local Password Generator
    function generatePassword() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@!";
        let pass = "";
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    }

    // Registration Handler
    regForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (currentFee === 0) {
            registerUser(0, "FREE_ENTRY_" + Math.floor(Math.random() * 10000));
        } else {
            paymentModal.style.display = 'flex';
        }
    });

    // Payment Confirmation
    confirmBtn.addEventListener('click', function () {
        confirmBtn.innerHTML = "[ PROCESSING... ]";
        confirmBtn.disabled = true;

        fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: currentFee })
        })
            .then(response => response.json())
            .then(result => {
                // Generate Mock TXN if needed
                const mockTxnId = "TXN_" + Math.floor(Math.random() * 1000000);
                registerUser(currentFee, mockTxnId);
            })
            .catch(err => {
                console.warn("Payment API failed, using mock:", err);
                const mockTxnId = "TXN_MOCK_" + Math.floor(Math.random() * 1000000);
                registerUser(currentFee, mockTxnId);
            });
    });

    // Register User Function
    function registerUser(amountVal, txnId) {
        const members = [];
        const memberCards = document.querySelectorAll('.member-card');

        memberCards.forEach((card) => {
            const nameInput = card.querySelector(`input[name$="_name"]`);
            const ageInput = card.querySelector(`input[name$="_age"]`);
            const emailInput = card.querySelector(`input[name$="_email"]`);
            const phoneInput = card.querySelector(`input[name$="_phone"]`);
            const whatsappInput = card.querySelector(`input[name$="_whatsapp"]`);
            const collegeInput = card.querySelector(`input[name$="_college"]`);
            const addressInput = card.querySelector(`input[name$="_address"]`);

            if (nameInput && nameInput.value) {
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

        const teamInput = document.getElementById('team-name');
        const teamVal = teamInput ? teamInput.value : 'Unknown Team';
        const password = generatePassword(); // Use local function
        const leaderEmail = members.length > 0 ? members[0].email : 'unknown@matrix.com';

        const payload = {
            teamName: teamVal,
            email: leaderEmail,
            password: password,
            event: eventSelect.value,
            transactionId: txnId,
            members: members
        };

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
    cancelBtn.addEventListener('click', function () {
        paymentModal.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = "[ INITIATE TRANSFER ]";
    });

    // Run Init
    init();
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
// Refresh news every 10 minutes
setInterval(fetchCyberNews, 600000);

/* --- NEW FEATURES IMPLEMENTATION --- */

/* 1. INTERACTIVE HACKER TERMINAL */
document.addEventListener('DOMContentLoaded', () => {
    const terminalOverlay = document.getElementById('hacker-terminal');
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    // Toggle Terminal with `~` key
    document.addEventListener('keydown', (e) => {
        if (e.key === '`' || e.key === '~') {
            e.preventDefault();
            if (terminalOverlay.style.display === 'block') {
                terminalOverlay.style.display = 'none';
            } else {
                terminalOverlay.style.display = 'block';
                terminalInput.focus();
            }
        }
    });

    // Command Parser
    if (terminalInput) {
        terminalInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                const command = this.value.trim().toLowerCase();
                this.value = ''; // Clear input
                processCommand(command);
            }
        });
    }

    function processCommand(cmd) {
        printOutput(`guest@xploitx:~$ ${cmd}`);

        switch (cmd) {
            case 'help':
                printOutput("AVAILABLE COMMANDS:\n  help     - Show this list\n  clear    - Clear terminal\n  hack     - Initiate breach protocol\n  team     - List organizing nodes\n  exit     - Close terminal\n  flag     - Submit a flag (Usage: flag {YOUR_FLAG})");
                break;
            case 'clear':
                terminalOutput.innerHTML = '';
                break;
            case 'exit':
                terminalOverlay.style.display = 'none';
                break;
            case 'team':
                printOutput("ORGANIZING NODES:\n  - N Ashish (Admin)\n  - N Madhumitha (Admin)\n  - Dr. M D Boomija (HOD)");
                break;
            case 'hack':
                simulateHacking();
                break;
            default:
                if (cmd.startsWith('flag ')) {
                    const submittedFlag = cmd.substring(5).trim();
                    if (submittedFlag === '{XPL0ITX_M4ST3R_HACK3R}') {
                        printOutput("ACCESS GRANTED. YOU ARE TRULY ONE OF US.", "#00E5FF");
                    } else {
                        printOutput("ACCESS DENIED. INCORRECT FLAG.", "red");
                    }
                } else {
                    printOutput(`Command not found: ${cmd}. Type 'help' for assistance.`, "red");
                }
        }
    }

    function printOutput(text, color = "var(--neon-green)") {
        const div = document.createElement('div');
        div.style.color = color;
        div.textContent = text;
        terminalOutput.appendChild(div);
        // Scroll to bottom
        terminalOverlay.scrollTop = terminalOverlay.scrollHeight;
    }

    function simulateHacking() {
        const hacks = [
            "Initiating SSH connection...",
            "Bypassing firewall...",
            "Accessing mainframe...",
            "Decrypting hashes...",
            "Downloading sensitive data...",
            "BREACH SUCCESSFUL."
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < hacks.length) {
                printOutput(hacks[i]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 600);
    }
});

/* 2. TYPEWRITER EFFECT */
function typeWriter(element, text, speed = 50) {
    if (!element) return;
    element.innerHTML = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Apply to Hero Title
window.addEventListener('load', () => {
    const heroTitle = document.querySelector('.glitch-title'); // "SYSTEM BREACH DETECTED"
    if (heroTitle) {
        const originalText = heroTitle.innerText.replace(/\n/g, ' '); // Simple cleanup
        // We might want to keep the <br> structure, but for simple typewriter text is easier.
        // Let's just type the specific text "SYSTEM BREACH DETECTED"
        // Or if it's the index page:
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            // Let's re-type the main header specifically or just leave it glitching. 
            // The user asked for typewriter effect. Let's apply it to a specific sub-header or the main one.
            // Let's try the sub-header "Join the Ultimate Cybersecurity Challenge"
            const subHeader = document.querySelector('p[style*="font-size: 1.2rem"]'); // Targeting the tagline we added
            if (subHeader) {
                const content = subHeader.innerText; // "Join the Ultimate..."
                // preserve HTML if possible? Hard with typewriter. 
                // Let's just create a new dynamic element for effect.
                const dynamicArea = document.createElement('div');
                dynamicArea.id = 'typewriter-msg';
                dynamicArea.style.color = 'var(--neon-green)';
                dynamicArea.style.fontFamily = 'monospace';
                dynamicArea.style.fontSize = '1.1rem';
                dynamicArea.style.marginTop = '10px';
                dynamicArea.style.minHeight = '20px'; // Prevent layout shift

                // Insert after hero title
                heroTitle.parentNode.insertBefore(dynamicArea, heroTitle.nextSibling);

                setTimeout(() => {
                    typeWriter(dynamicArea, ">> INITIALIZING_SEQUENCE... SYSTEM_ONLINE", 50);
                }, 1000);
            }
        }
    }
});

/* 3. CTF CHALLENGES (CONSOLE) */
console.log("%cSTOP! WAIT!", "color: red; font-size: 40px; font-weight: bold; text-shadow: 2px 2px black;");
console.log("%cLooking for flags? Here is a hint: The Matrix has hidden layers. Check the HTML comments.", "color: #00FF41; font-size: 14px; background: #000; padding: 10px;");
const HIDDEN_FLAG_VAR = "flag{C0NS0L3_L0G_EXPL0R3R}";

/* 4. 3D TILT EFFECT */
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.card, .node-card, .info-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Only trigger if mouse is close/over to save performance? 
        // Or global subtle effect. Let's do hover-based in CSS usually, but JS allows "following".
        // Let's check if mouse is over or near.
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            card.style.transition = 'transform 0.1s ease';
        } else {
            // Reset
            // card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            // card.style.transition = 'transform 0.5s ease';
            // Note: CSS might override this if we don't unset inline styles or manage state.
            // Actually, best to just let CSS :hover handle scale/reset, and we just add rotation.
            if (card.style.transform.includes('rotate')) {
                card.style.transform = 'none';
                card.style.transition = 'transform 0.5s ease';
            }
        }
    });
});

/* 5. MOBILE MENU TOGGLE */
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuOpen = document.getElementById('mobile-menu-open');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileNav = document.getElementById('mobile-nav');

    if (mobileMenuOpen && mobileMenuClose && mobileNav) {
        mobileMenuOpen.addEventListener('click', () => {
            mobileNav.classList.add('active');
            mobileMenuOpen.classList.add('hidden'); // Hide button when menu is open
            document.body.style.overflow = 'hidden';
        });

        mobileMenuClose.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileMenuOpen.classList.remove('hidden'); // Show button when menu is closed
            document.body.style.overflow = '';
        });

        const navLinks = mobileNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                mobileMenuOpen.classList.remove('hidden');
                document.body.style.overflow = '';
            });
        });
    }
});
