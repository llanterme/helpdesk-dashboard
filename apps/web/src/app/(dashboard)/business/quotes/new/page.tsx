'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder'
import { Quote } from '@/stores/quoteStore'
import {
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

export default function NewQuotePage() {
  const router = useRouter()

  const handleSuccess = (quote: Quote) => {
    // Redirect to the newly created quote
    router.push(`/business/quotes/${quote.id}`)
  }

  const handleCancel = () => {
    // Return to quotes list
    router.push('/quotes')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Back to quotes"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Quote</h1>
            <p className="text-gray-600 mt-1">
              Build a comprehensive quote for your client with our step-by-step wizard
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Quote Creation Process</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">Follow these steps to create a comprehensive quote:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li><strong>Select Client:</strong> Choose the client for this quote and assign an agent</li>
                  <li><strong>Add Services:</strong> Browse and add services with quantities and custom rates</li>
                  <li><strong>Configure Settings:</strong> Set tax rates, discounts, notes, terms, and validity period</li>
                  <li><strong>Review & Create:</strong> Review all details and create the quote</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Builder */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <QuoteBuilder
            isOpen={true}
            onClose={handleCancel}
            onSuccess={handleSuccess}
          />
        </div>

        {/* Help Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Client Management</h4>
              <p className="text-sm text-gray-600 mb-2">
                Don't see your client? You can create new clients from the client directory.
              </p>
              <button
                onClick={() => router.push('/clients')}
                className="text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                Manage Clients →
              </button>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Service Catalog</h4>
              <p className="text-sm text-gray-600 mb-2">
                Browse our comprehensive service catalog or add custom services.
              </p>
              <button
                onClick={() => router.push('/services')}
                className="text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                View Services →
              </button>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pricing & Tax</h4>
              <p className="text-sm text-gray-600 mb-2">
                Default VAT rate is 15% (South Africa). You can adjust rates per quote.
              </p>
              <span className="text-sm text-gray-500">
                Discounts and custom rates available
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}