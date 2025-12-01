'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { QuoteList } from '@/components/quotes/QuoteList'
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder'
import { useQuoteStore, Quote } from '@/stores/quoteStore'
import {
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function QuotesPage() {
  const router = useRouter()
  const { quotes } = useQuoteStore()
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false)

  // Handle navigation
  const handleViewQuote = (quote: Quote) => {
    router.push(`/business/quotes/${quote.id}`)
  }

  const handleEditQuote = (quote: Quote) => {
    router.push(`/business/quotes/${quote.id}/edit`)
  }

  const handleDuplicateQuote = (quote: Quote) => {
    // Open quote builder with duplicated quote data
    setShowQuoteBuilder(true)
  }

  const handleCreateQuote = () => {
    router.push('/business/quotes/new')
  }

  const handleQuoteSuccess = (quote: Quote) => {
    setShowQuoteBuilder(false)
    router.push(`/business/quotes/${quote.id}`)
  }

  // Calculate summary statistics
  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'DRAFT').length,
    pending: quotes.filter(q => q.status === 'PENDING' || q.status === 'SENT').length,
    accepted: quotes.filter(q => q.status === 'ACCEPTED').length,
    totalValue: quotes.reduce((sum, q) => sum + q.totalAmount, 0),
    pendingValue: quotes
      .filter(q => q.status === 'PENDING' || q.status === 'SENT')
      .reduce((sum, q) => sum + q.totalAmount, 0),
    acceptedValue: quotes
      .filter(q => q.status === 'ACCEPTED')
      .reduce((sum, q) => sum + q.totalAmount, 0)
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
            <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all your client quotes
            </p>
          </div>

          <button
            onClick={handleCreateQuote}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Quote
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Quotes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quotes</p>
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

          {/* Draft Quotes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft Quotes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.draft}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {stats.draft > 0 ? `${stats.draft} quote${stats.draft !== 1 ? 's' : ''} in progress` : 'No drafts'}
              </p>
            </div>
          </div>

          {/* Pending Quotes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-yellow-600">
                Value: {formatAmount(stats.pendingValue)}
              </p>
            </div>
          </div>

          {/* Accepted Quotes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-semibold text-green-600">{stats.accepted}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-green-600">
                Value: {formatAmount(stats.acceptedValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCreateQuote}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Quote
            </button>

            <button
              onClick={() => router.push('/clients')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Manage Clients
            </button>

            <button
              onClick={() => router.push('/services')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Browse Services
            </button>

            <button
              onClick={() => {
                // Filter to show only pending quotes
                // This would need to be implemented in the QuoteList component
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              View Pending ({stats.pending})
            </button>

            <button
              onClick={() => {
                // Filter to show only accepted quotes ready for invoicing
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Ready for Invoice ({stats.accepted})
            </button>
          </div>
        </div>

        {/* Quote List */}
        <QuoteList
          onViewQuote={handleViewQuote}
          onEditQuote={handleEditQuote}
          onDuplicateQuote={handleDuplicateQuote}
          onCreateQuote={handleCreateQuote}
        />

        {/* Quote Builder Modal */}
        {showQuoteBuilder && (
          <QuoteBuilder
            isOpen={showQuoteBuilder}
            onClose={() => setShowQuoteBuilder(false)}
            onSuccess={handleQuoteSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  )
}