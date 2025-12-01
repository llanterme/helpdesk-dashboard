'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ClientForm } from '@/components/clients/ClientForm'
import { useAuth } from '@/hooks/useAuth'

export default function NewClientPage() {
  useAuth() // Ensure user is authenticated

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Clients
          </Link>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <ClientForm />
        </div>
      </div>
    </DashboardLayout>
  )
}