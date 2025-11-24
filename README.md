# Legal & Business Management Platform

A comprehensive legal case and business management platform built with React, TypeScript, and Supabase.

## Features

- **Legal Case Management** - Track legal fights, cases, and proceedings
- **Business Deal Management** - Manage business deals and transactions  
- **Real Estate Management** - Handle real estate projects and transactions
- **Task Management** - Kanban-style task boards for each case/deal
- **User Management** - Role-based access control (Admin, Manager, Staff, Viewer)
- **Activity Logging** - Complete audit trail of all actions
- **Comments System** - Collaborative commenting on cases and tasks
- **Calendar Integration** - Unified calendar view of all deadlines
- **Search & Filtering** - Advanced search and filtering capabilities

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: Lucide React icons
- **Task Management**: @dnd-kit for drag-and-drop Kanban boards
- **Calendar**: React Big Calendar with Moment.js
- **Forms**: React Hook Form with Zod validation
- **Notifications**: React Hot Toast

## Quick Start

### 1. Database Setup

Run the migration files in your Supabase SQL Editor in this exact order:

1. **Schema Migration**: `supabase/migrations/20250828000000_fix_ambiguous_columns.sql`
2. **Seed Data**: `supabase/migrations/20250828000001_seed_default_data.sql`

### 2. Environment Setup

Your environment variables are already configured in `.env`:
```
VITE_SUPABASE_URL=https://itrzbxtzzngzesbmopyo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cnpieHR6em5nemVzYm1vcHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTkzNjksImV4cCI6MjA3NDA3NTM2OX0.q3U_yJQJPqrkNrQV614dQftChTl5QIRPmjVMfDGs1YY
```

### 3. Install & Run

```bash
npm install
npm run dev
```

## Database Schema

After running the migrations, you'll have:

### Core Tables
- `users` - User accounts with role-based permissions
- `sections` - Main categories (Legal, Deals, Real Estate, Others)
- `items` - Main entries (cases, deals, projects)
- `tasks` - Task management with Kanban stages
- `tags` - Color-coded labels for organization
- `stages` - Kanban board columns
- `comments` - Collaborative commenting system
- `activity_logs` - Complete audit trail

### Sample Data Included
- **5 Users** with different roles (Admin, Manager, Staff, Viewer)
- **13 Items** across all sections with realistic scenarios
- **7 Tasks** distributed across Kanban stages
- **6 Comments** with realistic conversations
- **6 Activity Log** entries showing system usage
- **10 Tags** with color coding
- **4 Global Stages** for task management

## User Roles & Permissions

- **Admin**: Full system access, user management
- **Manager**: Can manage all items and users (except admin functions)
- **Staff**: Can create and edit assigned items
- **Viewer**: Read-only access

## Key Features

### Legal Case Management
- Track complex legal disputes and proceedings
- Manage case documents and external links
- Assign team members and set deadlines
- Monitor case progress through task boards

### Business Deal Management  
- Handle acquisitions, joint ventures, investments
- Track deal stages and milestones
- Coordinate with multiple stakeholders
- Document deal terms and conditions

### Real Estate Projects
- Manage development projects and acquisitions
- Track regulatory approvals and permits
- Coordinate with contractors and consultants
- Monitor project timelines and budgets

### Task Management
- Drag-and-drop Kanban boards
- Task assignments and due dates
- Progress tracking with subtasks
- Time estimation and tracking

### Unified Calendar
- View all deadlines across sections
- Export to ICS format
- Filter by section and priority
- Color-coded by section type

## Authentication

The app uses Supabase Auth with email/password authentication. Users can:
- Sign up for new accounts
- Sign in with existing credentials
- Update passwords
- Manage profile settings

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── admin/          # Admin panel components
│   ├── auth/           # Authentication components
│   ├── calendar/       # Calendar view components
│   ├── comments/       # Comment system
│   ├── items/          # Item management
│   ├── kanban/         # Kanban board components
│   ├── layout/         # Layout components
│   ├── sections/       # Section list views
│   └── tasks/          # Task management
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
└── types/              # TypeScript type definitions
```

### Key Technologies
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **Supabase** for backend services
- **TypeScript** for type safety
- **Vite** for fast development

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure authentication with Supabase Auth
- Input validation and sanitization
- Audit logging for all actions

## Browser Support

- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.