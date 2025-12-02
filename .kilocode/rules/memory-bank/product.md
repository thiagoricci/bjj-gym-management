# Product Documentation

## Problem Statement

Managing a Brazilian Jiu-Jitsu (BJJ) academy involves tracking numerous students, their attendance, belt promotions, and memberships. Manual tracking or using disjointed tools can be inefficient and prone to errors. Academy owners need a centralized, easy-to-use solution to oversee their business and student progress.

## Goals

- **Centralize Operations:** Provide a single platform for all academy management tasks.
- **Track Progress:** Simplify the tracking of student attendance and belt promotions.
- **Improve Efficiency:** Reduce administrative overhead with streamlined workflows for onboarding and management.
- **Enhance Visibility:** Offer clear insights into academy performance through a dashboard.
- **Monetize Platform:** Enable a SaaS model where the platform owner can manage and charge gym owners.

## User Experience

- **Modern & Clean:** A minimalist, professional interface using shadcn/ui components.
- **Responsive:** Accessible on desktop and mobile devices for on-the-go management.
- **Intuitive Navigation:** Sidebar-based navigation for quick access to key sections.
- **Visual Feedback:** Clear visual indicators for belt ranks and status updates.

## Core Features

1.  **Dashboard:**
    - Overview of active students, attendance trends, and recent activities.
    - Quick view of upcoming classes and recent joiners.
2.  **Student Management:**
    - **Directory:** Searchable list of all students.
    - **Profiles:** Individual student details, including belt rank, join date, and payment history.
    - **Add Student:** Streamlined form for onboarding new members, now including address details.
3.  **Membership Management:**
    - Tools to manage student subscriptions and membership status.
    - **Stripe Integration:** Secure payment processing for memberships.
4.  **Class Schedule & Attendance:**
    - **Schedule Management:** Admin interface to set up and edit weekly class schedules (days, times, class names).
    - **Smart Check-in:** Attendance system that automatically detects the current class based on time and schedule.
    - **Validation:** Prevents check-ins outside of scheduled class times.
    - **Real-time List:** Shows students checked in for the current class, clearing automatically when the class ends.
5.  **Belt System:**
    - Visual representation of BJJ belt ranks (White to Black) to easily identify student levels.
6.  **Academy Settings:**
    - **Profile Management:** Update academy name, logo, and address.
    - **Timezone Configuration:** Set the academy's timezone to ensure accurate date and time displays.
    - **Stripe Connect:** Connect a Stripe account to receive payouts from student memberships.
    - **Account Security:** Manage email and password.
    - **Danger Zone:** Options to delete the account and organization.
7.  **Platform Administration:**
    - **Admin Dashboard:** A dedicated view for the platform owner to see all registered gyms and their Stripe connection status.
