'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { InvoiceList } from '@/components/invoices/InvoiceList'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'
import { useInvoiceStore, Invoice } from '@/stores/invoiceStore'
import {
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function InvoicesPage() {
  const router = useRouter()
  const { invoices } = useInvoiceStore()
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)

  // Handle navigation
  const handleViewInvoice = (invoice: Invoice) => {
    router.push(`/business/invoices/${invoice.id}`)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    router.push(`/business/invoices/${invoice.id}/edit`)
  }

  const handleDeleteInvoice = (invoice: Invoice) => {
    // Refresh the list after deletion
    // The deletion is handled in the InvoiceList component
  }

  const handleCreateInvoice = () => {
    router.push('/business/invoices/new')
  }

  const handleInvoiceSuccess = (invoice: Invoice) => {
    setShowInvoiceForm(false)
    router.push(`/business/invoices/${invoice.id}`)
  }

  // Calculate summary statistics
  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'PENDING').length,
    sent: invoices.filter(i => i.status === 'SENT').length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    overdue: invoices.filter(i => i.status === 'OVERDUE').length,
    totalValue: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    paidValue: invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.totalAmount, 0),
    outstandingValue: invoices
      .filter(i => ['PENDING', 'SENT', 'OVERDUE'].includes(i.status))
      .reduce((sum, i) => sum + i.totalAmount, 0),
    overdueValue: invoices
      .filter(i => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.totalAmount, 0)
  }

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">
              Manage billing and track payments from clients
            </p>
          </div>

          <button
            onClick={handleCreateInvoice}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Invoice
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Invoices */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Total value: {formatAmount(stats.totalValue)}
              </p>
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-amber-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-amber-600">
                Need to be sent
              </p>
            </div>
          </div>

          {/* Sent Invoices */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.sent}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-blue-600">
                Awaiting payment
              </p>
            </div>
          </div>

          {/* Paid Invoices */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-semibold text-green-600">{stats.paid}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-green-600">
                Value: {formatAmount(stats.paidValue)}
              </p>
            </div>
          </div>

          {/* Overdue Invoices */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-red-600">
                Value: {formatAmount(stats.overdueValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Outstanding Balance</p>
              <p className="text-3xl font-bold text-gray-900">{formatAmount(stats.outstandingValue)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.sent + stats.overdue} invoice{stats.sent + stats.overdue !== 1 ? 's' : ''} awaiting payment
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Paid This Month</p>
              <p className="text-3xl font-bold text-green-600">{formatAmount(stats.paidValue)}</p>
              <p className="text-sm text-green-500 mt-1">
                {stats.paid} invoice{stats.paid !== 1 ? 's' : ''} paid
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Overdue Amount</p>
              <p className="text-3xl font-bold text-red-600">{formatAmount(stats.overdueValue)}</p>
              <p className="text-sm text-red-500 mt-1">
                {stats.overdue} overdue invoice{stats.overdue !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCreateInvoice}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Invoice
            </button>

            <button
              onClick={() => router.push('/business/quotes')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Quotes
            </button>

            <button
              onClick={() => router.push('/clients')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Manage Clients
            </button>

            {stats.overdue > 0 && (
              <button
                onClick={() => {
                  // This would filter to show only overdue invoices
                  // Implementation would be in InvoiceList component
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                View Overdue ({stats.overdue})
              </button>
            )}

            {stats.sent > 0 && (
              <button
                onClick={() => {
                  // This would filter to show only sent invoices
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                Awaiting Payment ({stats.sent})
              </button>
            )}

            <button
              onClick={() => {
                // Export functionality would go here
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Data
            </button>
          </div>
        </div>

        {/* Invoice List */}
        <InvoiceList
          onViewInvoice={handleViewInvoice}
          onEditInvoice={handleEditInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onCreateInvoice={handleCreateInvoice}
        />

        {/* Invoice Form Modal */}
        {showInvoiceForm && (
          <InvoiceForm
            isOpen={showInvoiceForm}
            onClose={() => setShowInvoiceForm(false)}
            onSuccess={handleInvoiceSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  )
}