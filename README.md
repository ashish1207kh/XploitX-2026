# MATRIX_HACK 2026

A cyberpunk-themed website for the Matrix Hackathon 2026, featuring falling green code rain, glitch effects, terminal-style UI, countdown timer, and immersive Matrix aesthetics.

## Features

- Falling Matrix code rain background animation
- Glitch text effects on the main title
- Terminal-style registration form with macOS-style window
- Live countdown timer to event start
- Responsive design with mobile adjustments
- Navigation bar and feature cards
- Separate pages for About, Register, and Prizes
- 3D hover effects on cards and elements
- Dark cyberpunk color scheme with neon green accents
- Monospace Share Tech Mono font

## Project Structure

```
hackathon/
├── index.html          # Main homepage with countdown and features
├── about.html          # About page with event details
├── register.html       # Registration page with terminal form
├── prizes.html         # Prizes and rewards page
├── styles.css          # All stylesheets with 3D effects
├── script.js           # JavaScript for animations and countdown
├── README.md           # Project documentation
└── .github/
    └── copilot-instructions.md
```

## Technologies Used

- HTML5
- CSS3 (with CSS variables, animations, and responsive design)
- JavaScript (Canvas API for matrix rain, DOM manipulation for countdown)
- Font Awesome for icons
- Google Fonts for typography

## Running the Project

1. Ensure you have Python installed.
2. Run `python -m http.server 8000` in the project directory.
3. Open `http://localhost:8000` in your browser.

## Customization

- **Styling**: Edit `css/styles.css` to adjust colors, fonts, animations, or layout.
- **Animations**: Modify the matrix rain or countdown in `js/script.js`.
- **Content**: Update text, placeholders, or structure in `index.html`.
- **Countdown**: Change the target date in `js/script.js` (currently set to 30 days from page load).

## Matrix Theme Details

- **Colors**: Neon green (#00FF41), dark green (#008F11), black backgrounds
- **Typography**: Share Tech Mono monospace font
- **Effects**: Text flicker animation, glowing elements, terminal aesthetics
- **Icons**: Font Awesome icons integrated with Matrix symbols

Enjoy the red pill! 🟥