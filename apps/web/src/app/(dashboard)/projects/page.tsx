'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TrelloBoard } from '@/components/trello'

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -my-6 h-[calc(100vh-4rem)]">
        <TrelloBoard />
      </div>
    </DashboardLayout>
  )
}
