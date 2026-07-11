# Pirate World: Seas of Fortune

A 3D open-world pirate naval combat game built with Three.js, React, TypeScript, and Supabase. Inspired by Sea of Thieves and Pirates of the Caribbean. Sail the Caribbean, command your crew, engage in naval battles, and build your pirate empire.

## Live Demo

- **Game**: [Deployed via Vercel](https://your-vercel-url.vercel.app)
- **Backend**: [Supabase Dashboard](https://supabase.com/dashboard/project/uxyrwbdknvykgvxkigzh)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Renderer | Three.js (WebGL 2.0) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Physics | Cannon.js (buoyancy, ballistics) |
| Backend | Supabase (Postgres + Realtime + Auth) |
| Deploy | Vercel |

## Features

- **5 Ship Classes**: Sloop, Cutter, Brigantine, Galleon, Man o' War (unlockable)
- **Crew Management**: Assign crew to Cannons, Repairs, or Sails
- **Dynamic Wind System**: Sail with the wind for +40% speed boost
- **Naval Combat**: Broadside cannon combat with physics-driven cannonballs
- **AI Enemies**: British Patrol, Skeleton Galleons, Merchant vessels
- **12 Islands**: Procedural world with harbors, docks, and loot
- **Day/Night Cycle**: Dynamic lighting and ocean reflections
- **Persistent Progress**: Player data, ships, and scores saved to Supabase
- **Leaderboard**: Compete for the highest pirate score
- **Multiplayer Ready**: Session-based multiplayer lobby (in progress)

## Controls

| Key | Action |
|-----|--------|
| W/S | Adjust sails (speed up / slow down) |
| A/D | Turn ship |
| Q | Fire left cannons |
| E | Fire right cannons |
| C | Open crew panel |
| F | Go to Harbor |
| M | Toggle map |
| Esc | Pause |
| Mouse Wheel | Zoom camera |

## Local Development

```bash
# Clone
git clone https://github.com/JaronKBragg7337/Pirate-World-Sea-Of-Fortune-.git
cd Pirate-World-Sea-Of-Fortune-

# Install
npm install

# Environment (copy from .env.example)
cp .env.example .env

# Dev server
npm run dev

# Build
npm run build
```

## Supabase Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials
2. The database schema is in `supabase/migrations/001_game_schema.sql`
3. Tables: `players`, `player_ships`, `crew_members`, `scores`, `game_sessions`, `session_players`

## Project Structure

```
src/
  game/          # Core game engine (Three.js)
    Game.ts      # Main game loop & state
    renderer.ts  # Three.js setup
    ocean.ts     # Procedural ocean shader
    ship.ts      # 3D ship models
    camera.ts    # Camera controller
    input.ts     # Keyboard/mouse/touch input
    world.ts     # Islands, loot, environment
    cannonball.ts# Projectile physics
    enemy.ts     # AI enemy ships
    constants.ts # Game config
  components/    # React UI
    MainMenu.tsx
    HUD.tsx
    CrewPanel.tsx
    ShipSelect.tsx
    HarborHub.tsx
    GameCanvas.tsx
  types/         # TypeScript types
  lib/           # Supabase client
```

## License

Public Domain - Build the future in public.
