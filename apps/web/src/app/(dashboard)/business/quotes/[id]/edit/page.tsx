'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder'
import { useQuoteStore, Quote } from '@/stores/quoteStore'
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function EditQuotePage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  const { quotes, fetchQuotes, isLoading, error } = useQuoteStore()
  const [quote, setQuote] = useState<Quote | null>(null)

  // Load quotes if not already loaded
  useEffect(() => {
    if (quoteId && quotes.length === 0) {
      fetchQuotes()
    }
  }, [quoteId, quotes.length, fetchQuotes])

  // Find the quote
  useEffect(() => {
    if (quoteId && quotes.length > 0) {
      const foundQuote = quotes.find(q => q.id === quoteId)
      setQuote(foundQuote || null)
    }
  }, [quoteId, quotes])

  const handleSuccess = (updatedQuote: Quote) => {
    // Navigate back to the quote detail page
    router.push(`/business/quotes/${updatedQuote.id}`)
  }

  const handleCancel = () => {
    // Navigate back to the quote detail page
    router.push(`/business/quotes/${quoteId}`)
  }

  const handleBackToList = () => {
    router.push('/quotes')
  }

  // Loading state
  if (isLoading && !quote) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mr-3" />
          <span className="text-gray-600">Loading quote...</span>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error loading quote</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back to Quotes
              </button>
              <button
                onClick={() => fetchQuotes(true)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Quote not found
  if (!quote && !isLoading) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quote not found</h3>
          <p className="text-gray-600 mb-4">
            The quote you're trying to edit could not be found or may have been deleted.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              Back to Quotes
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Check if quote is editable
  if (quote && !['DRAFT', 'SENT', 'PENDING'].includes(quote.status)) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg border border-yellow-200 p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quote cannot be edited</h3>
          <p className="text-gray-600 mb-4">
            This quote has a status of "{quote.status}" and cannot be edited. Only quotes with status
            "DRAFT", "SENT", or "PENDING" can be modified.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => router.push(`/business/quotes/${quote.id}`)}
              className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              View Quote
            </button>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Back to Quotes
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Back to quote detail"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Quote {quote?.number}
            </h1>
            <p className="text-gray-600 mt-1">
              Make changes to your quote using our step-by-step wizard
            </p>
          </div>
        </div>

        {/* Status Warning */}
        {quote?.status !== 'DRAFT' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This quote has already been sent to the client (status: {quote?.status}).
                    Any changes you make will update the existing quote. Consider creating a new quote
                    or revision if significant changes are needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quote Builder */}
        {quote && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <QuoteBuilder
              isOpen={true}
              onClose={handleCancel}
              onSuccess={handleSuccess}
              editQuote={quote}
            />
          </div>
        )}

        {/* Help Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Editing Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What can be edited?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Service items and quantities</li>
                <li>• Pricing and discount rates</li>
                <li>• Notes and terms & conditions</li>
                <li>• Validity dates and settings</li>
                <li>• Client and agent assignment</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Status Considerations</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>DRAFT:</strong> Full editing capabilities</p>
                <p><strong>SENT:</strong> Editable, but client may have seen original</p>
                <p><strong>PENDING:</strong> Editable, but inform client of changes</p>
                <p><strong>ACCEPTED/REJECTED/EXPIRED:</strong> Cannot be edited</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}