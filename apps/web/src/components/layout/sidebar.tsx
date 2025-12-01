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
} from '@heroicons/react/24/outline'

type NavigationItem = {
  name: string
  href: string
  icon: any
  children?: {
    name: string
    href: string
    count?: number
  }[]
}

const navigation: NavigationItem[] = [
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