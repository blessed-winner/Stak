# Stak

Stak is a modern client review portal built with React, TypeScript, and Vite. It helps teams organize portal-based review workflows, share private client links, collect timestamped feedback on video rounds, and track activity from a central dashboard.

## Repository

- GitHub: `https://github.com/blessed-winner/Stak.git`

## What It Does

Stak provides a clean workspace for managing client projects and review cycles. The app includes:

- a secure authenticated dashboard for editors
- portal creation and portal detail views
- client-facing review pages with video playback
- timestamped feedback and revision notes
- portal status tracking and recent activity views
- settings and account-oriented navigation

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Supabase
- Zustand
- Motion
- Lucide React

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- a configured Supabase project

### Install

```bash
npm install
```

### Configure Environment

Create a `.env` file at the project root and add the environment variables required by your Supabase and related services. The repository already includes a `.env` file template in local development, so use the existing setup as your guide.

### Run Locally

```bash
npm run dev
```

The app starts on `http://0.0.0.0:3000`.

### Build for Production

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

### Type Check

```bash
npm run lint
```

## Available Scripts

- `npm run dev` - start the Vite development server
- `npm run build` - create a production build
- `npm run preview` - preview the production output locally
- `npm run lint` - run TypeScript type checking
- `npm run clean` - remove the `dist` directory

## Project Structure

- `src/App.tsx` - application routes and top-level layout
- `src/pages/` - dashboard, portal, auth, settings, and client views
- `src/components/` - reusable UI, layout, and portal components
- `src/hooks/` - portal and client data hooks
- `src/store/` - UI and auth state management
- `src/lib/` - shared utilities and Supabase configuration

## Notes

This project is structured around a review workflow where editors manage portals and clients leave precise feedback on specific moments in a video. The interface is intentionally clean and editorial, with emphasis on clarity, speed, and review visibility.

