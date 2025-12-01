'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NewInvoicePage() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  const handleSuccess = (invoice: any) => {
    // Navigate to the created invoice
    router.push(`/business/invoices/${invoice.id}`)
  }

  const handleClose = () => {
    // Navigate back to invoices list
    router.push('/business/invoices')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
            <p className="text-gray-600 mt-1">
              Create a new invoice for your client services
            </p>
          </div>
        </div>

        {/* Invoice Form */}
        <div className="bg-white rounded-lg border border-gray-200">
          <InvoiceForm
            isOpen={true}
            onClose={handleClose}
            onSuccess={handleSuccess}
            mode="create"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}