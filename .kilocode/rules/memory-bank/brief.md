# Project Brief: BJJ Academy Manager

## Overview

This is a web-based management application designed for Brazilian Jiu-Jitsu (BJJ) academies. It aims to help academy owners and administrators streamline their operations by managing students, tracking progress, and monitoring academy performance.

## Key Features

- **Dashboard:** A central hub displaying key metrics like total students, active attendance, belt promotions, and upcoming classes. It also highlights recently joined students.
- **Student Management:**
  - **Directory:** View and manage a list of all students.
  - **Profiles:** Detailed views for individual students (likely including contact info, attendance, etc.).
  - **Belt Tracking:** Visual indicators for student belt ranks (White, Blue, Purple, Brown, Black).
  - **Onboarding:** A dedicated flow to add new students.
- **Membership Management:** A section dedicated to handling student memberships.
- **Responsive UI:** Features a modern, sidebar-based layout that adapts to different screen sizes.

## Technical Stack

- **Core:** React (v18) with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Library:** shadcn/ui (built on Radix UI)
- **Routing:** React Router
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form with Zod
- **Icons:** Lucide React
- **Database:** Supabase
- **Payments:** Stripe

## Current Status

The project has evolved into a comprehensive BJJ academy management system with full Stripe payment integration. The system includes complete student lifecycle management, payment processing, attendance tracking, and membership management. All core features are now implemented with production-ready functionality including authentication, payment verification, and comprehensive student profiles.
