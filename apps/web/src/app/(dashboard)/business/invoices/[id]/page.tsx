'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { InvoiceDetail } from '@/components/invoices/InvoiceDetail'
import { useInvoiceStore, Invoice } from '@/stores/invoiceStore'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface InvoicePageProps {
  params: {
    id: string
  }
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const router = useRouter()
  const { selectedInvoice, fetchInvoiceById, isLoading, error } = useInvoiceStore()
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const fetchedInvoice = await fetchInvoiceById(params.id)
        setInvoice(fetchedInvoice)
      } catch (error) {
        console.error('Error loading invoice:', error)
      }
    }

    loadInvoice()
  }, [params.id, fetchInvoiceById])

  // Use selectedInvoice from store if available, otherwise use local state
  const currentInvoice = selectedInvoice || invoice

  const handleBack = () => {
    router.push('/business/invoices')
  }

  const handleEdit = (invoice: Invoice) => {
    router.push(`/business/invoices/${invoice.id}/edit`)
  }

  const handleDelete = (invoice: Invoice) => {
    // Navigate back to invoices list after deletion
    router.push('/business/invoices')
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Error loading invoice</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back to Invoices
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Invoice not found
  if (!currentInvoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Invoice not found</p>
            <p className="text-gray-600 mb-4">
              The invoice you're looking for doesn't exist or may have been deleted.
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <InvoiceDetail
        invoice={currentInvoice}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </DashboardLayout>
  )
}