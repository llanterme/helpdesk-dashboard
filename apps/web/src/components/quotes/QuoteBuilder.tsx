'use client'

import { useState, useEffect } from 'react'
import { useQuoteStore, quoteUtils } from '@/stores/quoteStore'
import { useServiceStore } from '@/stores/serviceStore'
import { useClientStore } from '@/stores/clientStore'
import { useAgentStore } from '@/stores/agentStore'
import {
  UserIcon,
  CogIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface QuoteBuilderProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (quote: any) => void
  editQuote?: any // For editing existing quotes
}

type Step = 'client' | 'services' | 'settings' | 'review'

export function QuoteBuilder({ isOpen, onClose, onSuccess, editQuote }: QuoteBuilderProps) {
  const [currentStep, setCurrentStep] = useState<Step>('client')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Store hooks
  const {
    cart,
    initializeCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    updateCartSettings,
    clearCart,
    calculateCartTotals,
    createQuote,
    updateQuote,
    isLoading,
    error
  } = useQuoteStore()

  const { clients, fetchClients } = useClientStore()
  const { agents, fetchAgents } = useAgentStore()
  const { services, categories, fetchServices, fetchCategories } = useServiceStore()

  // Initialize data
  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchAgents()
      fetchServices()
      fetchCategories()

      // Initialize for editing
      if (editQuote) {
        setSelectedClientId(editQuote.clientId)
        setSelectedAgentId(editQuote.agentId || '')
        initializeCart(editQuote.clientId, editQuote.agentId)

        // Populate cart with existing items
        editQuote.items.forEach((item: any) => {
          addToCart(item.serviceId, item.quantity, item.rate, item.customDescription)
        })

        // Set cart settings
        updateCartSettings({
          taxRate: editQuote.taxRate,
          discountRate: editQuote.discountRate,
          notes: editQuote.notes,
          terms: editQuote.terms,
          validUntil: editQuote.validUntil?.split('T')[0] // Format for date input
        })
      }
    }
  }, [isOpen, editQuote])

  // Reset when closing
  const handleClose = () => {
    clearCart()
    setCurrentStep('client')
    setSelectedClientId('')
    setSelectedAgentId('')
    setServiceSearch('')
    setSelectedCategory('all')
    onClose()
  }

  // Step navigation
  const steps: { key: Step; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'client', label: 'Client', icon: UserIcon },
    { key: 'services', label: 'Services', icon: ShoppingCartIcon },
    { key: 'settings', label: 'Settings', icon: CogIcon },
    { key: 'review', label: 'Review', icon: DocumentTextIcon }
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

  const canProceedFromClient = selectedClientId
  const canProceedFromServices = cart.items.length > 0
  const canProceedFromSettings = true
  const canFinalize = canProceedFromClient && canProceedFromServices

  // Filter services
  const filteredServices = services.filter(service => {
    if (!service.active) return false

    const matchesSearch = !serviceSearch ||
      service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      service.category.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      service.sku.toLowerCase().includes(serviceSearch.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    if (cart.clientId !== clientId) {
      initializeCart(clientId, selectedAgentId)
    }
  }

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId)
    updateCartSettings({ agentId })
  }

  // Handle add service to cart
  const handleAddService = (service: any) => {
    addToCart(service.id, 1, service.rate)
  }

  // Handle cart item updates
  const handleUpdateCartItem = (serviceId: string, field: string, value: any) => {
    const updates: any = {}
    updates[field] = field === 'quantity' ? parseInt(value) || 1 : value
    updateCartItem(serviceId, updates)
  }

  // Calculate totals
  const totals = calculateCartTotals()

  // Handle quote submission
  const handleSubmit = async () => {
    if (!canFinalize) return

    try {
      const quoteData = {
        clientId: selectedClientId,
        agentId: selectedAgentId || undefined,
        items: cart.items,
        taxRate: cart.taxRate,
        discountRate: cart.discountRate,
        notes: cart.notes,
        terms: cart.terms,
        validUntil: cart.validUntil
      }

      let result
      if (editQuote) {
        result = await updateQuote(editQuote.id, quoteData)
      } else {
        result = await createQuote(quoteData)
      }

      clearCart()
      onSuccess?.(result)
      handleClose()
    } catch (err) {
      // Error is handled by the store
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editQuote ? 'Edit Quote' : 'Create New Quote'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="mt-4">
            <nav className="flex space-x-4">
              {steps.map((step, index) => {
                const isCurrent = step.key === currentStep
                const isCompleted = index < currentStepIndex
                const isAccessible =
                  index === 0 ||
                  (index === 1 && canProceedFromClient) ||
                  (index === 2 && canProceedFromServices) ||
                  (index === 3 && canProceedFromSettings)

                return (
                  <button
                    key={step.key}
                    onClick={() => isAccessible && setCurrentStep(step.key)}
                    disabled={!isAccessible}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-700'
                        : isCompleted
                          ? 'text-green-600 hover:text-green-700'
                          : isAccessible
                            ? 'text-gray-600 hover:text-gray-700'
                            : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <step.icon className={`h-4 w-4 mr-2 ${isCompleted ? 'text-green-500' : ''}`} />
                    {step.label}
                    {isCompleted && <CheckIcon className="h-4 w-4 ml-1 text-green-500" />}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">

            {/* Step 1: Client Selection */}
            {currentStep === 'client' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Client</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {clients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => handleClientSelect(client.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedClientId === client.id
                          ? 'border-slate-500 bg-slate-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{client.name}</h4>
                          <p className="text-sm text-gray-600">{client.email}</p>
                          {client.company && (
                            <p className="text-sm text-gray-500">{client.company}</p>
                          )}
                        </div>
                        {selectedClientId === client.id && (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agent Selection */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Assign Agent (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {agents.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => handleAgentSelect(agent.id)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          selectedAgentId === agent.id
                            ? 'border-slate-500 bg-slate-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                            style={{ backgroundColor: agent.color || '#6B7280' }}
                          >
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{agent.name}</p>
                            <p className="text-xs text-gray-500">{agent.role}</p>
                          </div>
                          {selectedAgentId === agent.id && (
                            <CheckIcon className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Service Selection */}
            {currentStep === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add Services</h3>
                  <div className="flex items-center space-x-3">
                    {/* Search */}
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>

                    {/* Category filter */}
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category.name} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Service grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredServices.map(service => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{service.name}</h4>
                          <p className="text-xs text-gray-500 mb-1">{service.sku}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{service.description}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {service.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {quoteUtils.formatAmount(service.rate)}
                          </p>
                          <p className="text-xs text-gray-500">per {service.unit}</p>
                        </div>
                        <button
                          onClick={() => handleAddService(service)}
                          className="px-3 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-700 flex items-center"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredServices.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No services found matching your criteria</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Settings */}
            {currentStep === 'settings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quote Settings</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pricing settings */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={cart.taxRate}
                          onChange={(e) => updateCartSettings({ taxRate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount Rate (%)
                        </label>
                        <input
                          type="number"
                          value={cart.discountRate}
                          onChange={(e) => updateCartSettings({ discountRate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quote details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Quote Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valid Until
                        </label>
                        <input
                          type="date"
                          value={cart.validUntil || ''}
                          onChange={(e) => updateCartSettings({ validUntil: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={cart.notes || ''}
                          onChange={(e) => updateCartSettings({ notes: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="Internal notes about this quote..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Terms & Conditions
                        </label>
                        <textarea
                          value={cart.terms || ''}
                          onChange={(e) => updateCartSettings({ terms: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="Terms and conditions for this quote..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Quote</h3>

                {/* Client and Agent info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Client</h4>
                      {(() => {
                        const client = clients.find(c => c.id === selectedClientId)
                        return client ? (
                          <div>
                            <p className="text-sm text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.email}</p>
                            {client.company && <p className="text-sm text-gray-600">{client.company}</p>}
                          </div>
                        ) : null
                      })()}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Agent</h4>
                      {(() => {
                        const agent = agents.find(a => a.id === selectedAgentId)
                        return agent ? (
                          <div>
                            <p className="text-sm text-gray-900">{agent.name}</p>
                            <p className="text-sm text-gray-600">{agent.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No agent assigned</p>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* Quote settings summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Quote Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tax Rate:</span>
                      <span className="ml-2 font-medium">{cart.taxRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Discount:</span>
                      <span className="ml-2 font-medium">{cart.discountRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valid Until:</span>
                      <span className="ml-2 font-medium">
                        {cart.validUntil ? new Date(cart.validUntil).toLocaleDateString() : 'No expiration'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Services summary - will be shown in sidebar */}
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Sidebar - Cart & Totals */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Quote Items ({cart.items.length})
            </h4>

            {/* Cart items */}
            <div className="space-y-3 mb-6">
              {cart.items.map((item) => {
                const service = services.find(s => s.id === item.serviceId)
                if (!service) return null

                return (
                  <div key={item.serviceId} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">{service.name}</h5>
                        <p className="text-xs text-gray-500">{service.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.serviceId)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Quantity */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateCartItem(item.serviceId, 'quantity', Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateCartItem(item.serviceId, 'quantity', e.target.value)}
                          className="w-16 text-center text-sm border border-gray-300 rounded px-2 py-1"
                          min="1"
                        />
                        <button
                          onClick={() => handleUpdateCartItem(item.serviceId, 'quantity', item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                        <span className="text-xs text-gray-500">× {service.unit}</span>
                      </div>

                      {/* Rate */}
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 w-12">Rate:</span>
                        <input
                          type="number"
                          value={item.rate || service.rate}
                          onChange={(e) => handleUpdateCartItem(item.serviceId, 'rate', parseFloat(e.target.value))}
                          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                          step="0.01"
                        />
                      </div>

                      {/* Line total */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Line Total:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {quoteUtils.formatAmount(quoteUtils.calculateItemTotal(item.quantity, item.rate || service.rate))}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            {cart.items.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-3">Quote Totals</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{quoteUtils.formatAmount(totals.subtotal)}</span>
                  </div>

                  {cart.discountRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount ({cart.discountRate}%):</span>
                      <span className="text-red-600">-{quoteUtils.formatAmount(totals.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({cart.taxRate}%):</span>
                    <span>{quoteUtils.formatAmount(totals.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span>{quoteUtils.formatAmount(totals.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentStepIndex > 0 && (
              <button
                onClick={() => {
                  const prevStep = steps[currentStepIndex - 1]
                  setCurrentStep(prevStep.key)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentStep !== 'review' ? (
              <button
                onClick={() => {
                  const nextStep = steps[currentStepIndex + 1]
                  if (nextStep) setCurrentStep(nextStep.key)
                }}
                disabled={
                  (currentStep === 'client' && !canProceedFromClient) ||
                  (currentStep === 'services' && !canProceedFromServices)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canFinalize || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : (editQuote ? 'Update Quote' : 'Create Quote')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}