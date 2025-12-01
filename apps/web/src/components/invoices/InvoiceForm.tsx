'use client'

import { useState, useEffect } from 'react'
import { useInvoiceStore, InvoiceFormData } from '@/stores/invoiceStore'
import { useClientStore } from '@/stores/clientStore'
import { useAgentStore } from '@/stores/agentStore'
import { useServiceStore } from '@/stores/serviceStore'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface InvoiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (invoice: any) => void
  initialData?: Partial<InvoiceFormData>
  fromQuoteId?: string
  mode?: 'create' | 'edit'
}

interface InvoiceItemForm {
  serviceId: string
  quantity: number
  rate: number
}

export function InvoiceForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  fromQuoteId,
  mode = 'create'
}: InvoiceFormProps) {
  const { createInvoice, convertQuoteToInvoice, isLoading } = useInvoiceStore()
  const { clients } = useClientStore()
  const { agents } = useAgentStore()
  const { services } = useServiceStore()

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    agentId: '',
    totalAmount: 0,
    dueDate: '',
    items: []
  })

  const [items, setItems] = useState<InvoiceItemForm[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form with provided data
  useEffect(() => {
    if (initialData) {
      setFormData({
        clientId: initialData.clientId || '',
        agentId: initialData.agentId || '',
        totalAmount: initialData.totalAmount || 0,
        dueDate: initialData.dueDate || '',
        items: initialData.items || []
      })

      if (initialData.items) {
        setItems(initialData.items.map(item => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          rate: item.rate
        })))
      }
    } else {
      // Reset form
      setFormData({
        clientId: '',
        agentId: '',
        totalAmount: 0,
        dueDate: '',
        items: []
      })
      setItems([])
    }
    setErrors({})
  }, [initialData, isOpen])

  // Calculate total amount when items change
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      const service = services.find(s => s.id === item.serviceId)
      if (service && item.quantity > 0 && item.rate > 0) {
        return sum + (item.quantity * item.rate)
      }
      return sum
    }, 0)

    setFormData(prev => ({ ...prev, totalAmount: total }))
  }, [items, services])

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle item changes
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-fill rate when service is selected
    if (field === 'serviceId') {
      const service = services.find(s => s.id === value)
      if (service) {
        newItems[index].rate = service.rate
      }
    }

    setItems(newItems)
  }

  // Add new item
  const addItem = () => {
    setItems(prev => [...prev, { serviceId: '', quantity: 1, rate: 0 }])
  }

  // Remove item
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required'
    }

    if (items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    items.forEach((item, index) => {
      if (!item.serviceId) {
        newErrors[`item-${index}-service`] = 'Service is required'
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item-${index}-quantity`] = 'Quantity must be greater than 0'
      }
      if (!item.rate || item.rate <= 0) {
        newErrors[`item-${index}-rate`] = 'Rate must be greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const invoiceData = {
        ...formData,
        items: items.map(item => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          rate: item.rate
        }))
      }

      let result
      if (fromQuoteId) {
        // Convert quote to invoice
        result = await convertQuoteToInvoice(fromQuoteId, formData.dueDate, formData.agentId)
      } else {
        // Create new invoice
        result = await createInvoice(invoiceData)
      }

      if (onSuccess) onSuccess(result)
      onClose()
    } catch (error) {
      console.error('Error creating invoice:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {fromQuoteId ? 'Convert Quote to Invoice' : mode === 'edit' ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                  errors.clientId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={fromQuoteId} // Can't change client when converting from quote
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent
              </label>
              <select
                value={formData.agentId || ''}
                onChange={(e) => handleChange('agentId', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">No agent assigned</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-lg font-semibold text-gray-900">
                R {formData.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          {!fromQuoteId && ( // Don't show items section when converting from quote
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>

              {errors.items && (
                <p className="mb-4 text-sm text-red-600">{errors.items}</p>
              )}

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Item {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Service *
                        </label>
                        <select
                          value={item.serviceId}
                          onChange={(e) => handleItemChange(index, 'serviceId', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                            errors[`item-${index}-service`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select a service</option>
                          {services.filter(s => s.active).map(service => (
                            <option key={service.id} value={service.id}>
                              {service.name} - R{service.rate}
                            </option>
                          ))}
                        </select>
                        {errors[`item-${index}-service`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`item-${index}-service`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                            errors[`item-${index}-quantity`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`item-${index}-quantity`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`item-${index}-quantity`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                            errors[`item-${index}-rate`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`item-${index}-rate`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`item-${index}-rate`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 text-right">
                      <span className="text-sm text-gray-600">Line Total: </span>
                      <span className="font-medium text-gray-900">
                        R {(item.quantity * item.rate).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-600">No items added yet</p>
                    <button
                      type="button"
                      onClick={addItem}
                      className="mt-2 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Add your first item
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? 'Creating...'
                : fromQuoteId
                  ? 'Create Invoice'
                  : mode === 'edit'
                    ? 'Update Invoice'
                    : 'Create Invoice'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}