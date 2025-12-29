'use client'

import { useState, useEffect } from 'react'
import { useServiceStore, Service, serviceUtils } from '@/stores/serviceStore'
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TagIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface ServiceFormProps {
  service?: Service // If provided, form is in edit mode
  isOpen: boolean
  onClose: () => void
  onSuccess?: (service: Service) => void
  className?: string
}

interface FormData {
  name: string
  category: string
  description: string
  rate: string
  unit: string
  sku: string
  active: boolean
}

interface FormErrors {
  name?: string
  category?: string
  rate?: string
  unit?: string
  sku?: string
  submit?: string
}

export function ServiceForm({
  service,
  isOpen,
  onClose,
  onSuccess,
  className = ''
}: ServiceFormProps) {
  const { categories, createService, updateService, isLoading } = useServiceStore()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    description: '',
    rate: '',
    unit: 'per item',
    sku: '',
    active: true
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoGenerateSku, setAutoGenerateSku] = useState(true)

  // Common service units
  const unitOptions = [
    'per item',
    'per hour',
    'per page',
    'per document',
    'per signature',
    'per application',
    'per certificate',
    'per translation',
    'per notarization',
    'per apostille',
    'flat fee',
    'per consultation'
  ]

  // Populate form when editing
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        category: service.category,
        description: service.description || '',
        rate: service.rate.toString(),
        unit: service.unit,
        sku: service.sku,
        active: service.active
      })
      setAutoGenerateSku(false)
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        rate: '',
        unit: 'per item',
        sku: '',
        active: true
      })
      setAutoGenerateSku(true)
    }
    setErrors({})
  }, [service, isOpen])

  // Auto-generate SKU when name or category changes
  useEffect(() => {
    if (autoGenerateSku && formData.name && formData.category && !service) {
      const generatedSku = serviceUtils.generateSku(formData.name, formData.category)
      setFormData(prev => ({ ...prev, sku: generatedSku }))
    }
  }, [formData.name, formData.category, autoGenerateSku, service])

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Service name must be at least 2 characters'
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    // Rate validation
    const rate = parseFloat(formData.rate)
    if (!formData.rate.trim()) {
      newErrors.rate = 'Rate is required'
    } else if (isNaN(rate) || rate < 0) {
      newErrors.rate = 'Rate must be a valid positive number'
    } else if (rate > 1000000) {
      newErrors.rate = 'Rate cannot exceed R1,000,000'
    }

    // Unit validation
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required'
    }

    // SKU validation
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    } else if (formData.sku.trim().length < 3) {
      newErrors.sku = 'SKU must be at least 3 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const serviceData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim() || undefined,
        rate: parseFloat(formData.rate),
        unit: formData.unit.trim(),
        sku: formData.sku.trim(),
        active: formData.active
      }

      let result: Service | null = null

      if (service) {
        // Update existing service
        result = await updateService(service.id, serviceData)
      } else {
        // Create new service
        result = await createService(serviceData)
      }

      if (result) {
        onSuccess?.(result)
        onClose()
      } else {
        setErrors({ submit: service ? 'Failed to update service' : 'Failed to create service' })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle field changes
  const handleFieldChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle manual SKU changes
  const handleSkuChange = (value: string) => {
    setAutoGenerateSku(false)
    handleFieldChange('sku', value)
  }

  // Reset SKU auto-generation
  const resetSku = () => {
    if (formData.name && formData.category) {
      const generatedSku = serviceUtils.generateSku(formData.name, formData.category)
      setFormData(prev => ({ ...prev, sku: generatedSku }))
      setAutoGenerateSku(true)
      setErrors(prev => ({ ...prev, sku: undefined }))
    }
  }

  // Get category options
  const categoryOptions = Array.from(new Set([
    ...categories.map(cat => cat.name),
    ...(formData.category ? [formData.category] : [])
  ])).sort()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {service ? 'Edit Service' : 'Create New Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {/* Error Alert */}
            {errors.submit && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Service Name */}
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                        errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Document Apostille Service"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleFieldChange('category', e.target.value)}
                        list="categories"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                          errors.category ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Apostille Services"
                      />
                      <datalist id="categories">
                        {categoryOptions.map(category => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </div>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                  </div>

                  {/* SKU */}
                  <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                      <button
                        type="button"
                        onClick={resetSku}
                        className="ml-2 text-xs text-slate-600 hover:text-slate-800 underline"
                      >
                        auto-generate
                      </button>
                    </label>
                    <input
                      type="text"
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleSkuChange(e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono ${
                        errors.sku ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., APO-DOC-123456"
                    />
                    {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
                    {autoGenerateSku && (
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <InformationCircleIcon className="h-3 w-3 mr-1" />
                        SKU will be auto-generated based on name and category
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Brief description of the service..."
                  />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                  Pricing
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rate */}
                  <div>
                    <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
                      Rate (ZAR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R</span>
                      <input
                        type="number"
                        id="rate"
                        step="0.01"
                        min="0"
                        max="1000000"
                        value={formData.rate}
                        onChange={(e) => handleFieldChange('rate', e.target.value)}
                        className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                          errors.rate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.rate && <p className="mt-1 text-sm text-red-600">{errors.rate}</p>}
                  </div>

                  {/* Unit */}
                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => handleFieldChange('unit', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                        errors.unit ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    >
                      {unitOptions.map(unit => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
                  </div>
                </div>

                {/* Rate Preview */}
                {formData.rate && !errors.rate && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Pricing Preview:</strong> {serviceUtils.formatRate(parseFloat(formData.rate), formData.unit)}
                    </p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <TagIcon className="h-5 w-5 mr-2" />
                  Status
                </h3>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => handleFieldChange('active', e.target.checked)}
                    className="h-4 w-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                  />
                  <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                    Active (service is available for use in quotes and invoices)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {service ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {service ? 'Update Service' : 'Create Service'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}