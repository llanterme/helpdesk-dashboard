'use client'

import { useState } from 'react'
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface AddEmailAccountModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AddEmailAccountModal({
  onClose,
  onSuccess,
}: AddEmailAccountModalProps) {
  const [step, setStep] = useState<'form' | 'redirect'>('form')
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    tenantId: '', // Optional for multi-tenant Azure AD
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/email/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          displayName: formData.displayName,
          tenantId: formData.tenantId || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      // Redirect to Microsoft OAuth
      setStep('redirect')
      window.location.href = data.authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const suggestedAccounts = [
    { email: 'info@easynotary.co.za', name: 'Easy Notary Info' },
    { email: 'support@easyservicesgroup.co.za', name: 'Easy Services Support' },
    { email: 'sales@easyservicesgroup.co.za', name: 'Easy Services Sales' },
  ]

  const handleQuickAdd = (email: string, name: string) => {
    setFormData({ ...formData, email, displayName: name })
  }

  if (step === 'redirect') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Redirecting to Microsoft...</h2>
          <p className="text-gray-500 text-sm">
            Please sign in with your Microsoft 365 account to authorize access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add Email Account</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Add Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Add
            </label>
            <div className="grid grid-cols-1 gap-2">
              {suggestedAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickAdd(acc.email, acc.name)}
                  className={`flex items-center gap-3 p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                    formData.email === acc.email
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{acc.name}</p>
                    <p className="text-xs text-gray-500">{acc.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">or enter manually</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Easy Services Support"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Azure AD Tenant ID
              <span className="text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.tenantId}
              onChange={(e) =>
                setFormData({ ...formData, tenantId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave empty for multi-tenant"
            />
            <p className="mt-1 text-xs text-gray-500">
              Only needed if your organization restricts to a specific tenant
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After clicking Connect, you&apos;ll be redirected to
              Microsoft to sign in and authorize access to the email account.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.displayName}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect with Microsoft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
