'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AgentForm } from '@/components/agents/AgentForm'
import { useAuth } from '@/hooks/useAuth'

export default function NewAgentPage() {
  useAuth() // Ensure user is authenticated

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Team Directory
          </Link>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <AgentForm />
        </div>
      </div>
    </DashboardLayout>
  )
}