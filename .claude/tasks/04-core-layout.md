# Task 04: Core Layout & Navigation

## Overview
Build the main application layout with sidebar navigation, user interface shell, and responsive design patterns.

## Prerequisites
- Task 01 completed (project setup)
- Task 02 completed (database schema)
- Task 03 completed (authentication system)

## Technical Requirements

### Main Layout Structure
- Responsive sidebar navigation with collapsible mobile menu
- Main content area with proper spacing and overflow handling
- Header with user profile and logout functionality
- Channel-based navigation with count badges
- Clean, modern design using TailwindCSS

### Navigation Structure
```
Dashboard
├── Overview (main metrics)
Tickets
├── All Tickets (with channel counts)
├── WhatsApp
├── Email
├── Form Submissions
└── Live Chat
Clients
├── Client Directory
└── Add New Client
Agents
├── Team Directory
└── Agent Management
Services
├── Service Catalog
└── Pricing Management
Business
├── Quotes
├── Invoices
└── Commissions
Reports
└── Analytics Dashboard
```

### Layout Components

**Main Layout (`apps/web/src/components/layout/dashboard-layout.tsx`)**
```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileMenu } from './mobile-menu'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile menu */}
      <MobileMenu open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-white">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
```

**Sidebar Navigation (`apps/web/src/components/layout/sidebar.tsx`)**
```typescript
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  TicketIcon,
  UserGroupIcon,
  UsersIcon,
  CogIcon,
  DocumentTextIcon,
  ChartBarIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  {
    name: 'Tickets',
    href: '/tickets',
    icon: TicketIcon,
    children: [
      { name: 'All Tickets', href: '/tickets', count: 12 },
      { name: 'WhatsApp', href: '/tickets/whatsapp', count: 5 },
      { name: 'Email', href: '/tickets/email', count: 3 },
      { name: 'Form', href: '/tickets/form', count: 2 },
      { name: 'Chat', href: '/tickets/chat', count: 2 },
    ]
  },
  { name: 'Clients', href: '/clients', icon: UsersIcon },
  { name: 'Agents', href: '/agents', icon: UserGroupIcon },
  {
    name: 'Services',
    href: '/services',
    icon: CogIcon,
    children: [
      { name: 'Service Catalog', href: '/services' },
      { name: 'Pricing', href: '/services/pricing' },
    ]
  },
  {
    name: 'Business',
    href: '/business',
    icon: DocumentTextIcon,
    children: [
      { name: 'Quotes', href: '/business/quotes' },
      { name: 'Invoices', href: '/business/invoices' },
      { name: 'Commissions', href: '/business/commissions' },
    ]
  },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-0 flex-1 bg-slate-800">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-slate-900">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-800 font-bold text-sm">HD</span>
          </div>
          <span className="ml-2 text-white font-semibold text-lg">HelpDesk</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                {item.name}
              </Link>

              {/* Sub-navigation */}
              {item.children && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`group flex items-center justify-between px-2 py-1 text-sm rounded-md ${
                        pathname === child.href
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{child.name}</span>
                      {child.count && (
                        <span className="bg-slate-600 text-slate-200 ml-2 inline-block py-0.5 px-2 text-xs font-medium rounded-full">
                          {child.count}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
```

**Header Component (`apps/web/src/components/layout/header.tsx`)**
```typescript
'use client'

import { signOut } from 'next-auth/react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  Bars3Icon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

interface HeaderProps {
  onMenuClick: () => void
  user: any
}

export function Header({ onMenuClick, user }: HeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 md:hidden"
        onClick={onMenuClick}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          {/* Search could go here */}
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          {/* User menu */}
          <Menu as="div" className="ml-3 relative">
            <div>
              <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="h-6 w-6 text-slate-600" />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden lg:block">
                  {user?.name || user?.email}
                </span>
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => signOut()}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}
```

## Implementation Steps

1. **Install Dependencies**
   ```bash
   npm install @headlessui/react @heroicons/react
   ```

2. **Create Layout Components**
   - Main dashboard layout wrapper
   - Sidebar navigation with nested items
   - Header with user menu and logout
   - Mobile responsive menu

3. **Update Main Page**
   - Wrap authenticated pages with DashboardLayout
   - Create placeholder dashboard content
   - Test responsive behavior

4. **Style Integration**
   - Ensure TailwindCSS classes work properly
   - Test dark theme on sidebar
   - Verify hover states and transitions

## Acceptance Criteria

### ✅ Layout Structure
- [ ] Responsive sidebar with desktop/mobile variants
- [ ] Main content area with proper scroll behavior
- [ ] Header with user profile and actions
- [ ] Navigation highlights active page correctly

### ✅ Navigation Features
- [ ] Channel-based ticket navigation with counts
- [ ] Nested navigation items expand/collapse properly
- [ ] All navigation links render correctly
- [ ] Mobile menu opens/closes smoothly

### ✅ User Experience
- [ ] Logout functionality works correctly
- [ ] User information displays in header
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Navigation is accessible via keyboard

### ✅ Visual Design
- [ ] Consistent spacing and typography
- [ ] Proper color scheme (slate/amber theme)
- [ ] Smooth hover and focus states
- [ ] Clean, modern appearance

## Testing Instructions

1. **Test Layout Responsiveness**
   - Resize browser window to test mobile/desktop views
   - Verify sidebar behavior on different screen sizes
   - Test mobile menu functionality

2. **Test Navigation**
   - Click through all navigation items
   - Verify active states highlight correctly
   - Test nested navigation expansion

3. **Test User Features**
   - Verify user name/email displays in header
   - Test logout functionality
   - Confirm redirect after logout

4. **Test Accessibility**
   - Navigate using keyboard only
   - Verify focus indicators are visible
   - Test screen reader compatibility

## Architecture Patterns Established

- **Layout Composition**: Reusable layout components
- **Navigation State**: Client-side routing with active states
- **Responsive Design**: Mobile-first responsive patterns
- **Component Structure**: Modular, composable UI components
- **User Context**: Integration with authentication state

## Files Created
```
apps/web/src/components/
├── layout/
│   ├── dashboard-layout.tsx
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── mobile-menu.tsx
└── ui/
    └── (shared UI components)
```

---
**Next Task**: `05-ticket-management.md` - Implement complete ticket management system