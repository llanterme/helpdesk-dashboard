# Task 12: Commission System

## Overview
Build agent commission calculation and payment tracking system with automated bill generation.

## Prerequisites
- Tasks 01-04 completed (foundation)
- Task 07 completed (agent management)
- Task 11 completed (invoice system)

## Technical Requirements

### Core Features
- Automated commission calculations
- Agent bill generation
- Payment tracking and history
- Commission rate management
- Performance-based bonuses

### API Endpoints
- `GET /api/commissions` - List commission records
- `GET /api/agents/[id]/commissions` - Agent commission history
- `POST /api/commissions/calculate` - Calculate commissions
- `POST /api/bills` - Generate commission bills
- `PUT /api/bills/[id]/status` - Update payment status

### UI Components
- Commission dashboard (`/business/commissions`)
- Agent commission reports
- Bill generation interface
- Payment tracking system
- Commission settings

## Acceptance Criteria

### ✅ Commission Calculation
- [ ] Automatic calculation from paid invoices
- [ ] Configurable commission rates per agent
- [ ] Performance-based bonus calculations
- [ ] Commission rule engine

### ✅ Bill Management
- [ ] Automated bill generation for agents
- [ ] Bill approval workflow
- [ ] Payment scheduling and tracking
- [ ] Bill history and reporting

### ✅ Agent Interface
- [ ] Commission dashboard for agents
- [ ] Earnings history and projections
- [ ] Performance metrics display
- [ ] Payment status tracking

### ✅ Administration
- [ ] Commission rate management
- [ ] Bulk commission processing
- [ ] Financial reconciliation tools
- [ ] Audit trail and reporting

---
**Next Task**: `13-dashboard-analytics.md` - Business intelligence system