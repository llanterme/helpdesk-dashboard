'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AgentWithStats, useAgentStore, agentUtils } from '@/stores/agentStore'
import { AgentRole, AgentStatus } from '@helpdesk/database'

interface AgentFormProps {
  agent?: AgentWithStats
  onSuccess?: (agent: AgentWithStats) => void
  onCancel?: () => void
}

interface FormData {
  name: string
  email: string
  phone: string
  role: AgentRole
  commissionRate: number
  avatar: string
  color: string
  status: AgentStatus
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  role?: string
  commissionRate?: string
  submit?: string
}

const COLOR_OPTIONS = [
  '#64748b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
]

export function AgentForm({ agent, onSuccess, onCancel }: AgentFormProps) {
  const router = useRouter()
  const { addAgent, updateAgent } = useAgentStore()

  const [formData, setFormData] = useState<FormData>({
    name: agent?.name || '',
    email: agent?.email || '',
    phone: agent?.phone || '',
    role: agent?.role || 'AGENT',
    commissionRate: agent?.commissionRate || 50.0,
    avatar: agent?.avatar || '',
    color: agent?.color || COLOR_OPTIONS[0],
    status: agent?.status || 'ACTIVE'
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!agent

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        email: agent.email,
        phone: agent.phone || '',
        role: agent.role,
        commissionRate: agent.commissionRate,
        avatar: agent.avatar || '',
        color: agent.color || COLOR_OPTIONS[0],
        status: agent.status
      })
    }
  }, [agent])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Commission rate validation
    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      newErrors.commissionRate = 'Commission rate must be between 0 and 100'
    }

    // Role validation
    const validRoles = ['ADMIN', 'SENIOR_AGENT', 'AGENT']
    if (!validRoles.includes(formData.role)) {
      newErrors.role = 'Please select a valid role'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        role: formData.role,
        commissionRate: formData.commissionRate,
        avatar: formData.avatar.trim() || null,
        color: formData.color,
        ...(isEditing && { status: formData.status })
      }

      if (isEditing && agent) {
        // Update existing agent
        const response = await fetch(`/api/agents/${agent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update agent')
        }

        const updatedAgent = await response.json()
        updateAgent(agent.id, updatedAgent)

        if (onSuccess) {
          onSuccess(updatedAgent)
        } else {
          router.push(`/agents/${agent.id}`)
        }
      } else {
        // Create new agent
        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create agent')
        }

        const newAgent = await response.json()
        addAgent(newAgent)

        if (onSuccess) {
          onSuccess(newAgent)
        } else {
          router.push(`/agents/${newAgent.id}`)
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Agent' : 'Add New Agent'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditing ? 'Update agent information and permissions' : 'Add a new team member to your organization'}
        </p>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm">{errors.submit}</div>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
              errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter full name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
              errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
              errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter phone number"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as AgentRole })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
              errors.role ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          >
            {agentUtils.getAvailableRoles().map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
        </div>

        {/* Commission Rate */}
        <div>
          <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-2">
            Commission Rate (%) *
          </label>
          <input
            type="number"
            id="commissionRate"
            min="0"
            max="100"
            step="0.1"
            value={formData.commissionRate}
            onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
              errors.commissionRate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="50.0"
          />
          {errors.commissionRate && <p className="mt-1 text-sm text-red-600">{errors.commissionRate}</p>}
        </div>

        {/* Avatar URL */}
        <div className="sm:col-span-2">
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
            Avatar URL (Optional)
          </label>
          <input
            type="url"
            id="avatar"
            value={formData.avatar}
            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        {/* Color Selection */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? 'border-gray-900' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Status (only for editing) */}
        {isEditing && (
          <div className="sm:col-span-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AgentStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {agentUtils.getAvailableStatuses().map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isEditing ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <span>{isEditing ? 'Update Agent' : 'Create Agent'}</span>
          )}
        </button>
      </div>
    </form>
  )
}