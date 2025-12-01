'use client'

import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { QuoteDetail } from '@/components/quotes/QuoteDetail'
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder'
import { Quote } from '@/stores/quoteStore'
import { useState } from 'react'

export default function QuoteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [editQuote, setEditQuote] = useState<Quote | null>(null)
  const [duplicateQuote, setDuplicateQuote] = useState<Quote | null>(null)

  const handleBack = () => {
    router.push('/quotes')
  }

  const handleEdit = (quote: Quote) => {
    setEditQuote(quote)
    setShowEditModal(true)
  }

  const handleDuplicate = (quote: Quote) => {
    setDuplicateQuote(quote)
    setShowDuplicateModal(true)
  }

  const handleConvert = (quote: Quote) => {
    // Navigate to invoice conversion page (to be implemented later)
    router.push(`/business/quotes/${quote.id}/convert`)
  }

  const handleEditSuccess = (quote: Quote) => {
    setShowEditModal(false)
    setEditQuote(null)
    // Refresh the page or update the quote in store
    // The QuoteDetail component will automatically update through the store
  }

  const handleDuplicateSuccess = (quote: Quote) => {
    setShowDuplicateModal(false)
    setDuplicateQuote(null)
    // Navigate to the newly created quote
    router.push(`/business/quotes/${quote.id}`)
  }

  const handleCloseModals = () => {
    setShowEditModal(false)
    setShowDuplicateModal(false)
    setEditQuote(null)
    setDuplicateQuote(null)
  }

  if (!quoteId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Quote</h2>
            <p className="text-gray-600 mb-4">The quote ID is missing or invalid.</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
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
        {/* Quote Detail */}
        <QuoteDetail
          quoteId={quoteId}
          onBack={handleBack}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onConvert={handleConvert}
        />

        {/* Edit Quote Modal */}
        {showEditModal && editQuote && (
          <QuoteBuilder
            isOpen={showEditModal}
            onClose={handleCloseModals}
            onSuccess={handleEditSuccess}
            editQuote={editQuote}
          />
        )}

        {/* Duplicate Quote Modal */}
        {showDuplicateModal && duplicateQuote && (
          <QuoteBuilder
            isOpen={showDuplicateModal}
            onClose={handleCloseModals}
            onSuccess={handleDuplicateSuccess}
            duplicateQuote={duplicateQuote}
          />
        )}
      </div>
    </DashboardLayout>
  )
}