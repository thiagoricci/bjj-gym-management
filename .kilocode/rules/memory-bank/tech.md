# Technical Documentation

## Technologies Used

### Core

- **Runtime:** Node.js (Development)
- **Framework:** React v18
- **Language:** TypeScript v5
- **Build Tool:** Vite v5

### UI & Styling

- **Styling Engine:** Tailwind CSS v3
- **Component Library:** shadcn/ui (based on Radix UI primitives)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** tailwindcss-animate

### State Management & Data Fetching

- **Server State:** TanStack Query (React Query) v5
- **Local State:** React Hooks (useState, useReducer, useContext)

### Routing

- **Router:** React Router DOM v6

### Forms & Validation

- **Form Handling:** React Hook Form
- **Validation:** Zod

### Utilities

- **Date Handling:** date-fns
- **Toast Notifications:** Sonner, Radix UI Toast
- **Class Merging:** clsx, tailwind-merge

## Development Setup

### Prerequisites

- Node.js & npm (or bun/yarn/pnpm)

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Project Structure

The project follows a standard Vite + React structure with a `src` directory containing all application code.

- `src/components`: Reusable UI components
- `src/pages`: Route components
- `src/hooks`: Custom hooks
- `src/lib`: Utility functions
- `src/App.tsx`: Main application entry point with routing
