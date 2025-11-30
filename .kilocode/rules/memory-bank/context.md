# Context

## Current Work Focus

The project is in the initial setup and development phase. The core infrastructure (Vite, React, Tailwind, shadcn/ui) is in place. The focus is on building out the UI components and pages to match the requirements of a BJJ academy management system.

## Recent Changes

- Initial project scaffolding with Vite and React.
- Integration of shadcn/ui components.
- Implementation of the main layout with a sidebar.
- Creation of the Dashboard page with real data fetching from Supabase.
- Implementation of Dashboard metrics: Total Students, Active Students, New Students, Active Trials.
- Added `StudentList` component with pagination for displaying student lists on the Dashboard.
- Setup of routing for Students, Student Details, Add Student, and Memberships pages.
- **Implemented Attendance feature:**
  - Created `attendance` table in Supabase with RLS policies.
  - Added `Attendance` page with student check-in functionality.
  - Updated `AppSidebar` to include Attendance link.
- **Implemented Academy Settings & Timezone Fix:**
  - Created `Settings` page for managing academy details (Name, Logo, Address, Timezone).
  - Added `timezone` column to `organizations` table.
  - Implemented `src/lib/date.ts` for centralized, timezone-aware date formatting.
  - Refactored all date displays to use the academy's configured timezone, fixing the "one day behind" issue.
  - Updated Sidebar to display the dynamic Academy Name.
- **Student Profile Updates:**
  - Updated "Recent Attendance" card to "This Week's Attendance", showing only records from the current week (starting Monday).
  - Limited the "This Week's Attendance" card to a maximum of 5 entries.
- **Database Schema Fix:**
  - Added a `stripes` column to the `students` table to resolve an error when updating student progression.
- **Schedule Management:**
  - Implemented functionality to edit existing classes in the schedule.

## Next Steps

- Develop the "Add Student" form functionality.
- Build out the Student Directory and Profile views.
- Implement Membership management features.
- Refine the UI/UX based on user feedback.
