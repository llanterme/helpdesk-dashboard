# HelpDesk Dashboard System

A modern, multi-channel customer support platform built with Next.js 14, TypeScript, and Prisma.

## 🚀 Features

### ✅ **Current Implementation (Tasks 01-08)**
- **Authentication System** - NextAuth.js with JWT sessions and role-based access
- **Responsive Dashboard** - Modern UI with sidebar navigation and user management
- **Database Schema** - Complete Prisma schema with 12 entities for helpdesk operations
- **Monorepo Architecture** - Turborepo setup with apps and packages structure
- **Multi-channel Ticket Management** - WhatsApp, Email, Form, Chat support with filtering
- **Client & Agent Management** - Complete CRM functionality with profiles and performance tracking
- **Real-time Messaging** - Live communication interface with channel-specific styling
- **File Attachments** - Upload and share documents, images, and files in conversations
- **Rich Text Messaging** - Emoji support, auto-save drafts, and typing indicators

### 🚧 **Planned Features (Tasks 09-15)**
- **Service Catalog** - Pricing and service management
- **Quote Builder** - Interactive quote creation system
- **Invoice System** - Billing and payment tracking
- **Commission System** - Agent payment calculations
- **Analytics Dashboard** - Business intelligence and reporting
- **Email Integration** - Outlook Graph API integration
- **WhatsApp Integration** - WhatsApp Business API support

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, Headless UI, Heroicons
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **State Management**: Zustand + React Query
- **Build System**: Turborepo monorepo

### Project Structure
```
├── apps/
│   └── web/                 # Next.js application
├── packages/
│   ├── database/           # Prisma schema and migrations
│   ├── shared/            # Shared utilities and types
│   └── ui/                # Shared UI components
├── .claude/
│   └── tasks/             # Complete task specifications (01-15)
└── CLAUDE.md              # Project context and decisions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/llanterme/helpdesk-dashboard.git
   cd helpdesk-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup database**
   ```bash
   # Create MySQL database 'helpdesk_dev'
   # Update DATABASE_URL in apps/web/.env.local

   cd packages/database
   npx prisma db push
   npx prisma db seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - URL: http://localhost:3000
   - Login: admin@helpdesk.com / admin123
   - Navigate to `/tickets` to see the messaging system in action

### Environment Setup

Create `apps/web/.env.local`:
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/helpdesk_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

## 📋 Development Roadmap

### Phase 1: Foundation ✅ **(Complete)**
- [x] Task 01: Project Setup & Infrastructure
- [x] Task 02: Database Schema & Core Models
- [x] Task 03: Authentication System
- [x] Task 04: Core Layout & Navigation

### Phase 2: Core Features ✅ **(Complete)**
- [x] Task 05: Ticket Management System
- [x] Task 06: Client Management
- [x] Task 07: Agent Management
- [x] Task 08: Messaging System

### Phase 3: Business Logic 🚧 **(Next)**
- [ ] Task 09: Service Catalog
- [ ] Task 10: Quote Builder
- [ ] Task 11: Invoice System
- [ ] Task 12: Commission System

### Phase 4: Advanced Features
- [ ] Task 13: Dashboard Analytics
- [ ] Task 14: Email Integration (Stubbed)
- [ ] Task 15: WhatsApp Integration (Stubbed)

## 🗄️ Database Schema

### Core Entities
- **Users & Agents** - Authentication and team management
- **Clients** - Customer contact management
- **Services** - Service catalog with pricing
- **Tickets & Messages** - Multi-channel support system
- **Quotes & Invoices** - Business transaction management
- **Bills & Commissions** - Agent payment system

### Sample Data
The seeded database includes:
- **Admin user**: admin@helpdesk.com / admin123
- **Sample agents**: Sipho Ndlovu (Senior Agent), Maria Santos (Agent)
- **Sample clients**: James Mokoena (Mokoena Legal), Sarah Nkosi
- **Service catalog**: Apostille services (DIRCO & High Court), Notarial certification
- **Multi-channel tickets**: WhatsApp, Email, Form, and Chat conversations
- **Realistic conversations**: 15+ sample messages across different channels and scenarios
- **Performance data**: Agent statistics, commission rates, and activity metrics

## 🛠️ Development

### Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run db:studio  # Open Prisma Studio
```

### Task-Based Development
Each feature is documented in `.claude/tasks/` with:
- Technical requirements and API specifications
- UI component specifications
- Acceptance criteria for testing
- Implementation guidelines

## 🤝 Contributing

1. Choose a task from `.claude/tasks/` directory
2. Follow the task specifications and acceptance criteria
3. Implement with TypeScript and proper error handling
4. Test thoroughly before submitting
5. Update task status and create descriptive commits

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- [Repository](https://github.com/llanterme/helpdesk-dashboard)
- [Issues](https://github.com/llanterme/helpdesk-dashboard/issues)
- [Project Board](https://github.com/llanterme/helpdesk-dashboard/projects)

---

**Built from POC to Production** - Transforming a single-file React component into a scalable, production-ready helpdesk system.