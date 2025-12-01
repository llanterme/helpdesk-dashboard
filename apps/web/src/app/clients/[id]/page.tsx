'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ClientDetail } from '@/components/clients/ClientDetail'
import { useAuth } from '@/hooks/useAuth'

interface ClientDetailPageProps {
  params: {
    id: string
  }
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  useAuth() // Ensure user is authenticated

  return (
    <DashboardLayout>
      <div className="py-8 px-6">
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

        {/* Client Detail */}
        <ClientDetail clientId={params.id} />
      </div>
    </DashboardLayout>
  )
}