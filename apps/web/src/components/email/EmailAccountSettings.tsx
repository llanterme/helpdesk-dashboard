'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface EmailAccount {
  id: string
  email: string
  displayName: string
  provider: string
  isActive: boolean
  isDefault: boolean
  syncEnabled: boolean
  autoCreateTickets: boolean
  signature?: string | null
  lastSyncAt: string | null
  syncError: string | null
  ticketCount: number
  hasValidSubscription: boolean
  isAuthenticated: boolean
}

interface EmailAccountSettingsProps {
  account: EmailAccount
  onClose: () => void
  onSave: (account: EmailAccount) => void
}

export function EmailAccountSettings({
  account,
  onClose,
  onSave,
}: EmailAccountSettingsProps) {
  const [formData, setFormData] = useState({
    displayName: account.displayName,
    isActive: account.isActive,
    isDefault: account.isDefault,
    syncEnabled: account.syncEnabled,
    autoCreateTickets: account.autoCreateTickets,
    signature: account.signature || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/email/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        onSave({ ...account, ...data.account })
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Email Account Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="text"
              value={account.email}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
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
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Account Active
                <span className="text-gray-500 text-xs ml-1">
                  (Enable/disable email sync)
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.syncEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, syncEnabled: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Sync Enabled
                <span className="text-gray-500 text-xs ml-1">
                  (Receive real-time email notifications)
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.autoCreateTickets}
                onChange={(e) =>
                  setFormData({ ...formData, autoCreateTickets: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Auto-Create Tickets
                <span className="text-gray-500 text-xs ml-1">
                  (Automatically create tickets from incoming emails)
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Default Account
                <span className="text-gray-500 text-xs ml-1">
                  (Use this account for sending by default)
                </span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Signature
            </label>
            <textarea
              value={formData.signature}
              onChange={(e) =>
                setFormData({ ...formData, signature: e.target.value })
              }
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="<p>Kind regards,<br>Your Name<br>Easy Services Group</p>"
            />
            <p className="mt-1 text-xs text-gray-500">
              HTML is supported for rich signatures
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
              disabled={saving}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
