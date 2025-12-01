# Task 05: Ticket Management System

## Overview
Implement core ticket management functionality with CRUD operations, multi-channel support, status workflow, and real-time messaging interface.

## Prerequisites
- Task 01-04 completed (project setup, database, auth, layout)
- Zustand store setup
- React Query configuration

## Technical Requirements

### Core Features
- **Ticket List**: Filterable by channel, status, assigned agent
- **Ticket Detail**: Full conversation view with client information
- **Message Thread**: Real-time messaging interface
- **Status Management**: Workflow transitions (open → pending → resolved → closed)
- **Assignment**: Assign tickets to agents
- **Multi-channel Support**: WhatsApp, Email, Forms, Chat with distinct styling

### API Endpoints (`apps/web/src/app/api/tickets/`)

**List Tickets (`route.ts`)**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')

    const where: any = {}

    if (channel && channel !== 'all') {
      where.channel = channel.toUpperCase()
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (agentId) {
      where.agentId = agentId
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        client: true,
        agent: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { subject, clientId, channel, priority = 'MEDIUM' } = data

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        clientId,
        channel: channel.toUpperCase(),
        priority: priority.toUpperCase(),
        status: 'OPEN'
      },
      include: {
        client: true,
        agent: true
      }
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Ticket Detail (`[id]/route.ts`)**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        agent: true,
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { status, agentId, priority } = data

    const updateData: any = {}
    if (status) updateData.status = status.toUpperCase()
    if (agentId) updateData.agentId = agentId
    if (priority) updateData.priority = priority.toUpperCase()

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        agent: true
      }
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Zustand Store (`apps/web/src/stores/ticketStore.ts`)

```typescript
import { create } from 'zustand'
import { Ticket, Agent, TicketStatus, TicketChannel } from '@helpdesk/database'

interface TicketFilters {
  channel: TicketChannel | 'all'
  status: TicketStatus | 'all'
  search: string
}

interface TicketStore {
  // State
  tickets: Ticket[]
  selectedTicket: Ticket | null
  filters: TicketFilters
  loading: boolean
  error: string | null

  // Actions
  setTickets: (tickets: Ticket[]) => void
  setSelectedTicket: (ticket: Ticket | null) => void
  updateTicket: (id: string, updates: Partial<Ticket>) => void
  setFilters: (filters: Partial<TicketFilters>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Computed
  getFilteredTickets: () => Ticket[]
  getTicketCounts: () => Record<string, number>
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  // Initial state
  tickets: [],
  selectedTicket: null,
  filters: {
    channel: 'all',
    status: 'all',
    search: ''
  },
  loading: false,
  error: null,

  // Actions
  setTickets: (tickets) => set({ tickets }),

  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),

  updateTicket: (id, updates) => set((state) => ({
    tickets: state.tickets.map(ticket =>
      ticket.id === id ? { ...ticket, ...updates } : ticket
    ),
    selectedTicket: state.selectedTicket?.id === id
      ? { ...state.selectedTicket, ...updates }
      : state.selectedTicket
  })),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Computed values
  getFilteredTickets: () => {
    const { tickets, filters } = get()
    return tickets.filter(ticket => {
      if (filters.channel !== 'all' && ticket.channel !== filters.channel) {
        return false
      }
      if (filters.status !== 'all' && ticket.status !== filters.status) {
        return false
      }
      if (filters.search && !ticket.subject.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      return true
    })
  },

  getTicketCounts: () => {
    const { tickets } = get()
    return {
      all: tickets.filter(t => t.status === 'OPEN').length,
      whatsapp: tickets.filter(t => t.channel === 'WHATSAPP' && t.status === 'OPEN').length,
      email: tickets.filter(t => t.channel === 'EMAIL' && t.status === 'OPEN').length,
      form: tickets.filter(t => t.channel === 'FORM' && t.status === 'OPEN').length,
      chat: tickets.filter(t => t.channel === 'CHAT' && t.status === 'OPEN').length,
    }
  }
}))
```

### React Components

**Ticket List (`apps/web/src/components/tickets/TicketList.tsx`)**
```typescript
'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTicketStore } from '@/stores/ticketStore'
import { TicketItem } from './TicketItem'
import { TicketFilters } from './TicketFilters'

export function TicketList() {
  const {
    tickets,
    selectedTicket,
    filters,
    setTickets,
    setSelectedTicket,
    getFilteredTickets
  } = useTicketStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.channel !== 'all') params.set('channel', filters.channel)
      if (filters.status !== 'all') params.set('status', filters.status)

      const response = await fetch(`/api/tickets?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }
      return response.json()
    },
    staleTime: 30000, // 30 seconds
  })

  useEffect(() => {
    if (data) {
      setTickets(data)
    }
  }, [data, setTickets])

  const filteredTickets = getFilteredTickets()

  if (isLoading) {
    return (
      <div className="w-96 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-96 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading tickets</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
      <TicketFilters />

      <div className="flex-1 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No tickets found</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketItem
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedTicket?.id === ticket.id}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

**Ticket Item (`apps/web/src/components/tickets/TicketItem.tsx`)**
```typescript
'use client'

import { Ticket } from '@helpdesk/database'
import { formatDistanceToNow } from 'date-fns'
import { getChannelIcon, getChannelColor, getStatusColor, getPriorityColor } from '@/lib/utils'

interface TicketItemProps {
  ticket: Ticket & {
    client: { name: string }
    agent?: { name: string; avatar: string; color: string }
  }
  isSelected: boolean
  onClick: () => void
}

export function TicketItem({ ticket, isSelected, onClick }: TicketItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-slate-50 border-l-4 border-l-slate-800'
          : 'hover:bg-gray-50'
      } ${ticket.unread ? 'bg-amber-50' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: getChannelColor(ticket.channel) }}>
          {getChannelIcon(ticket.channel)}
        </span>
        <span className="text-xs text-gray-400">{ticket.id.slice(0, 8)}</span>
        <span className="ml-auto text-xs text-gray-400">
          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
        </span>
      </div>

      <h4 className={`text-sm mb-1 truncate ${ticket.unread ? 'font-semibold' : ''}`}>
        {ticket.subject}
      </h4>

      <p className="text-sm text-gray-500 mb-2">{ticket.client.name}</p>

      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
          style={{ backgroundColor: getStatusColor(ticket.status) }}
        >
          {ticket.status.toLowerCase()}
        </span>

        <span
          className="text-xs font-medium"
          style={{ color: getPriorityColor(ticket.priority) }}
        >
          {ticket.priority.toLowerCase()}
        </span>

        {ticket.agent && (
          <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
            <span
              className={`w-5 h-5 text-white rounded-full flex items-center justify-center text-[10px] font-medium`}
              style={{ backgroundColor: ticket.agent.color }}
            >
              {ticket.agent.avatar}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
```

## Implementation Steps

1. **Create API Routes**
   - Setup RESTful endpoints for tickets
   - Implement query parameters for filtering
   - Add proper error handling and validation

2. **Setup Zustand Store**
   - Create ticket state management
   - Implement computed values for filtering
   - Add actions for state updates

3. **Build React Query Integration**
   - Setup queries with proper cache keys
   - Configure stale time and refetch intervals
   - Handle loading and error states

4. **Create UI Components**
   - Build ticket list with filtering
   - Implement ticket item component
   - Add ticket detail view with messaging

5. **Add Utility Functions**
   - Channel icon and color mapping
   - Status and priority styling helpers
   - Date formatting utilities

## Acceptance Criteria

### ✅ Ticket List
- [ ] Displays all tickets with proper styling
- [ ] Filters work for channel, status, and search
- [ ] Shows ticket counts in sidebar navigation
- [ ] Loading and error states display correctly

### ✅ Ticket Detail
- [ ] Shows complete ticket information
- [ ] Displays client details in sidebar
- [ ] Message thread renders chronologically
- [ ] Status updates work correctly

### ✅ Multi-Channel Support
- [ ] Different icons for each channel type
- [ ] Consistent color coding across UI
- [ ] Channel filtering works properly

### ✅ Assignment & Status
- [ ] Agents can be assigned to tickets
- [ ] Status transitions follow proper workflow
- [ ] Priority levels display correctly

## Testing Instructions

1. **Create Test Tickets**
   ```bash
   # Use Prisma Studio to create sample tickets
   npx prisma studio
   ```

2. **Test Filtering**
   - Filter by each channel type
   - Filter by status (open, pending, resolved)
   - Test search functionality

3. **Test State Management**
   - Select different tickets
   - Verify state updates correctly
   - Check ticket counts update

4. **Test API Integration**
   - Monitor network requests
   - Verify proper error handling
   - Check loading states

## Architecture Patterns Established

- **State Management**: Zustand for client state
- **Server State**: React Query for API integration
- **Component Design**: Compound components pattern
- **API Design**: RESTful endpoints with query parameters
- **Error Handling**: Consistent error boundaries

## Files Created
```
apps/web/src/
├── app/api/tickets/
│   ├── route.ts
│   └── [id]/route.ts
├── stores/
│   └── ticketStore.ts
├── components/tickets/
│   ├── TicketList.tsx
│   ├── TicketItem.tsx
│   └── TicketFilters.tsx
└── lib/
    └── utils.ts
```

---
**Next Task**: `06-client-management.md` - Implement client profile management and CRUD operations