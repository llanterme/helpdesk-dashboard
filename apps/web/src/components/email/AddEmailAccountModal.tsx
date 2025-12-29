'use client'

import { useState } from 'react'
import { XMarkIcon, EnvelopeIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface AddEmailAccountModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AddEmailAccountModal({
  onClose,
  onSuccess,
}: AddEmailAccountModalProps) {
  const [step, setStep] = useState<'form' | 'testing' | 'success'>('form')
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    imapHost: 'imap.secureserver.net',
    imapPort: 993,
    smtpHost: 'smtpout.secureserver.net',
    smtpPort: 465,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    imap: boolean | null
    smtp: boolean | null
    imapError?: string
    smtpError?: string
  }>({ imap: null, smtp: null })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setStep('testing')
    setTestResult({ imap: null, smtp: null })

    try {
      const response = await fetch('/api/email/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          displayName: formData.displayName,
          password: formData.password,
          imapHost: formData.imapHost,
          imapPort: formData.imapPort,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          provider: 'IMAP_SMTP',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      setTestResult({
        imap: data.testResults?.imap?.success ?? true,
        smtp: data.testResults?.smtp?.success ?? true,
        imapError: data.testResults?.imap?.error,
        smtpError: data.testResults?.smtp?.error,
      })

      if (data.testResults?.imap?.success && data.testResults?.smtp?.success) {
        setStep('success')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        // Connection test failed
        setError(
          `Connection test failed: ${data.testResults?.imap?.error || ''} ${data.testResults?.smtp?.error || ''}`
        )
        setStep('form')
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStep('form')
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

  if (step === 'testing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-8">
          <h2 className="text-lg font-semibold mb-6 text-center">Testing Connection...</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {testResult.imap === null ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              ) : testResult.imap ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              ) : (
                <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm">IMAP Connection (Receiving)</span>
            </div>

            <div className="flex items-center gap-3">
              {testResult.smtp === null ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              ) : testResult.smtp ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              ) : (
                <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm">SMTP Connection (Sending)</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-8 text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Account Connected!</h2>
          <p className="text-gray-500 text-sm">
            {formData.email} has been added successfully.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
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
              Email Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your email password"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Your GoDaddy email password. This is stored securely.
            </p>
          </div>

          {/* Advanced Settings (collapsed by default) */}
          <details className="border border-gray-200 rounded-md">
            <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
              Advanced Server Settings
            </summary>
            <div className="p-4 pt-2 space-y-3 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    IMAP Server
                  </label>
                  <input
                    type="text"
                    value={formData.imapHost}
                    onChange={(e) =>
                      setFormData({ ...formData, imapHost: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    IMAP Port
                  </label>
                  <input
                    type="number"
                    value={formData.imapPort}
                    onChange={(e) =>
                      setFormData({ ...formData, imapPort: parseInt(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    SMTP Server
                  </label>
                  <input
                    type="text"
                    value={formData.smtpHost}
                    onChange={(e) =>
                      setFormData({ ...formData, smtpHost: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) =>
                      setFormData({ ...formData, smtpPort: parseInt(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Default settings are for GoDaddy. Change only if using a different provider.
              </p>
            </div>
          </details>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-sm text-amber-800">
              <strong>Security Note:</strong> Your password is encrypted and stored securely.
              We only use it to connect to your email server.
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
              disabled={loading || !formData.email || !formData.displayName || !formData.password}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
