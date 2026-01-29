document.addEventListener('DOMContentLoaded', () => {
    // Define API_BASE_URL (Global)
    const isLocal = window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal ? 'http://localhost:3000' : '';

    const verifyBtn = document.getElementById('verify-email-btn');
    const otpSection = document.getElementById('otp-section');
    const emailInput = document.getElementById('leader-email-input');
    const otpInput = document.getElementById('email-otp-input');
    const confirmOtpBtn = document.getElementById('confirm-otp-btn');
    const verifiedBadge = document.getElementById('email-verified-badge');
    const submitBtn = document.querySelector('button[type="submit"]'); // The proceed btn

    let isEmailVerified = false;

    // Initially disable proceed if we strictly require verification
    // But maybe let them fill form first?
    // Let's hook into the submit functionality in script.js via a global flag or event.
    // Since script.js handles submission, we need to communicate.
    // Easiest is to set a global variable or dataset on the form.
    const form = document.getElementById('team-form');

    verifyBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) {
            alert("Please enter a valid email first.");
            return;
        }

        // Basic Regex Check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Invalid email format.");
            return;
        }

        verifyBtn.innerText = "SENDING...";
        verifyBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/send-verification-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            // Handle Non-JSON
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { throw new Error(text); }

            if (data.success) {
                alert("OTP Sent! Please check your inbox (and spam folder).");
                otpSection.style.display = 'block';
                verifyBtn.innerText = "RESEND";
                verifyBtn.disabled = false;
                emailInput.readOnly = true; // Lock email
            } else {
                alert("Error: " + data.error);
                verifyBtn.innerText = "[ VERIFY ]";
                verifyBtn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            alert("Server connection failed. " + e.message);
            verifyBtn.innerText = "[ VERIFY ]";
            verifyBtn.disabled = false;
        }
    });

    confirmOtpBtn.addEventListener('click', async () => {
        const otp = otpInput.value.trim();
        const email = emailInput.value.trim();
        if (!otp) return alert("Enter OTP");

        confirmOtpBtn.innerText = "CHECKING...";
        confirmOtpBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();

            if (data.success) {
                // Success
                isEmailVerified = true;
                otpSection.style.display = 'none';
                verifyBtn.style.display = 'none'; // Remove verify button
                verifiedBadge.style.display = 'block';

                // Mark form as verified
                form.dataset.emailVerified = "true";
                alert("Email Verified Successfully!");
            } else {
                alert("Incorrect OTP. Please try again.");
                confirmOtpBtn.innerText = "[ CONFIRM OTP ]";
                confirmOtpBtn.disabled = false;
            }
        } catch (e) {
            alert("Error verifying OTP");
            confirmOtpBtn.innerText = "[ CONFIRM OTP ]";
            confirmOtpBtn.disabled = false;
        }
    });
});
