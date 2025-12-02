# System Architecture

## High-Level Overview

The application is a Single Page Application (SPA) built with React. It uses a client-side routing strategy to manage navigation between different views (Dashboard, Students, Memberships, etc.). The UI is constructed using a component-based architecture, leveraging Tailwind CSS for styling and shadcn/ui for accessible, pre-built components.

## Project Structure

- **`src/`**: Source code root.
  - **`components/`**: Reusable UI components.
    - **`ui/`**: Low-level UI primitives (buttons, inputs, cards) from shadcn/ui.
    - **`Layout.tsx`**: The main application shell including the sidebar and header.
  - **`pages/`**: Top-level components representing distinct application routes.
    - `Dashboard.tsx`, `Students.tsx`, `StudentDetail.tsx`, `AdminDashboard.tsx`, `AdminLogin.tsx`, `Settings.tsx`, etc.
  - **`hooks/`**: Custom React hooks for shared logic (e.g., `use-toast.ts`).
  - **`lib/`**: Utility functions and helpers (e.g., `utils.ts` for class merging).
  - **`App.tsx`**: Main application component, defines the routing configuration.
  - **`main.tsx`**: Application entry point, mounts the React app to the DOM.

## Key Technical Decisions

- **Vite:** Chosen for its fast development server and optimized build process.
- **React Router:** Standard solution for declarative routing in React applications.
- **TanStack Query:** Used for efficient data fetching, caching, and state management of server data.
- **shadcn/ui & Tailwind CSS:** Provides a highly customizable and modern design system without the overhead of a heavy component library.
- **TypeScript:** Ensures type safety and improves developer experience with better tooling support.
- **Supabase RLS:** Strict Row Level Security policies enforce multi-tenancy, ensuring users can only access data belonging to their organization.

## Data Flow

1.  **User Interaction:** User interacts with the UI (clicks, form submissions).
2.  **State Updates:** Local state is updated via React hooks; Server state is managed via TanStack Query mutations/queries.
3.  **Routing:** Navigation triggers route changes, rendering appropriate Page components.
4.  **Rendering:** Components re-render based on state or prop changes, updating the DOM.

## Database Schema

### `students` table

The `students` table is central to the application and stores all information related to a student.

- `id`: (uuid, primary key) - Unique identifier for the student.
- `organization_id`: (uuid, foreign key) - References the `organizations` table.
- `name`: (text) - Full name of the student.
- `email`: (text) - Email address.
- `phone`: (text) - Phone number.
- `address`: (text) - Street address.
- `city`: (text) - City.
- `state`: (text) - State/Province.
- `zip_code`: (text) - Postal code.
- `join_date`: (date) - The date the student joined the academy.
- `belt`: (enum: BeltRank) - Current belt rank (e.g., 'white', 'blue').
- `stripes`: (integer, default: 0) - Number of stripes on the current belt (0-4).
- `status`: (text) - The student's current status (e.g., 'student', 'trial').
- `membership_status`: (text) - The status of their membership (e.g., 'active', 'inactive', 'frozen').
- `membership_plan_id`: (integer, foreign key) - References the `membership_plans` table.
- `stripe_customer_id`: (text) - The Stripe Customer ID for payment processing.

### `organizations` table

Stores information about the BJJ academies (tenants).

- `id`: (uuid, primary key) - Unique identifier for the organization.
- `name`: (text) - Name of the academy.
- `stripe_account_id`: (text) - The connected Stripe Express account ID for payouts.
- `created_at`: (timestamptz) - Creation timestamp.

### `platform_subscriptions` table

Manages the subscription status of academies to the platform itself.

- `id`: (uuid, primary key) - Unique identifier.
- `organization_id`: (uuid, foreign key) - References the `organizations` table.
- `stripe_subscription_id`: (text) - Stripe Subscription ID.
- `stripe_customer_id`: (text) - Stripe Customer ID (for the gym owner).
- `status`: (text) - Subscription status (e.g., 'active', 'inactive').
- `plan_id`: (text) - Identifier for the subscription plan.
