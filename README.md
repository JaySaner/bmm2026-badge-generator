# BMM 2026 Seattle - Badge & Poster Generator

This is a premium, high-performance web application designed to generate personalized event posters and entry badges for the BMM 2026 Convention in Seattle.

## 🚀 Features

- **Personalized Poster**: "I AM ATTENDING" poster with user photo in a circular gold frame.
- **Entry Badge**: Compact ID card style with unique ID and QR code.
- **High-Resolution Export**: Download as PNG or PDF (for badges).
- **Admin Panel**: View all registrations, delete entries, and download data as CSV.
- **Mobile First**: Fully responsive design matching the BMM 2026 theme.
- **Fast Generation**: Instant generation using client-side Canvas processing.
- **Sharing**: One-click sharing on WhatsApp.

## 🛠 Tech Stack

- **Frontend**: React.js (Vite)
- **Styling**: Vanilla CSS (Glassmorphism + BMM Theme)
- **Image Processing**: `html2canvas` (for high-res capture)
- **PDF Export**: `jsPDF`
- **QR Codes**: `qrcode.react`
- **Animations**: `framer-motion` & `canvas-confetti`
- **Storage**: LocalStorage (can be easily connected to a real DB API)

## 📁 Project Structure

- `src/App.jsx`: Main logic and components.
- `src/index.css`: Design system and premium styles.
- `public/`: Assets (Logo, Poster Background).

## 🏃 How to Run

1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`

## 🛡 Admin Panel

Access the Admin Panel via the button in the header to view registrations and download the CSV database.
