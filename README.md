# Pace Reader

A mobile-first speed reading app using RSVP (Rapid Serial Visual Presentation) with ORP (Optimal Recognition Point) highlighting.

## Features

- **RSVP Speed Reading** - Words displayed one at a time at your chosen pace
- **ORP Highlighting** - Red letter anchors your eye for faster recognition
- **Adjustable Speed** - 100 to 1200+ WPM with smooth slider control
- **Sample Texts** - Classic literature excerpts to practice with
- **Text Upload** - Load your own .txt files
- **Paste Text** - Directly paste any text you want to read
- **Keyboard Controls** - Space (play/pause), arrows (speed/navigation)
- **PWA Ready** - Install on your phone like a native app
- **Dark Mode** - Easy on the eyes, perfect for night reading

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **PWA** - Progressive Web App support

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← | Decrease speed |
| → | Increase speed |
| ↑ | Skip forward 10 words |
| ↓ | Skip backward 10 words |

## How RSVP Works

Traditional reading requires your eyes to move across lines of text. RSVP eliminates this by presenting words one at a time in a fixed position. The red highlighted letter (ORP) is positioned where your eye naturally focuses, reducing cognitive load and enabling faster reading speeds.

## License

MIT
