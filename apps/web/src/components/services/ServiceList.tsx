'use client'

import { useState, useEffect } from 'react'
import { useServiceStore, Service, serviceUtils } from '@/stores/serviceStore'
import { ServiceCard } from './ServiceCard'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  QueueListIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface ServiceListProps {
  onViewService?: (service: Service) => void
  onEditService?: (service: Service) => void
  onDeleteService?: (service: Service) => void
  onCreateService?: () => void
  onAddToQuote?: (service: Service) => void
  className?: string
  selectable?: boolean
  selectedServices?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

type ViewMode = 'grid' | 'list'

export function ServiceList({
  onViewService,
  onEditService,
  onDeleteService,
  onCreateService,
  onAddToQuote,
  className = '',
  selectable = false,
  selectedServices = [],
  onSelectionChange
}: ServiceListProps) {
  const {
    services,
    categories,
    isLoading,
    error,
    filters,
    fetchServices,
    setFilters,
    clearFilters,
    toggleServiceStatus,
    clearError
  } = useServiceStore()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [tempFilters, setTempFilters] = useState(filters)

  // Load services on mount
  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof tempFilters) => {
    setTempFilters(newFilters)
  }

  const applyFilters = () => {
    setFilters(tempFilters)
    setShowFilters(false)
  }

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      category: 'all',
      active: true,
      sortBy: 'name',
      sortOrder: 'asc' as const
    }
    setTempFilters(defaultFilters)
    setFilters(defaultFilters)
    setShowFilters(false)
  }

  // Handle service selection
  const handleServiceSelect = (serviceId: string, selected: boolean) => {
    if (!onSelectionChange) return

    if (selected) {
      onSelectionChange([...selectedServices, serviceId])
    } else {
      onSelectionChange(selectedServices.filter(id => id !== serviceId))
    }
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return

    if (selectedServices.length === filteredServices.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredServices.map(s => s.id))
    }
  }

  // Filter and sort services
  const filteredServices = serviceUtils.filterServices(services, filters)
  const sortedServices = serviceUtils.sortServices(filteredServices, filters.sortBy, filters.sortOrder)

  // Category options for filter
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.name, label: cat.name }))
  ]

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error loading services</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearError()
              fetchServices(true)
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Services</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${sortedServices.length} service${sortedServices.length !== 1 ? 's' : ''}`}
            {filters.search && ` matching "${filters.search}"`}
            {filters.category !== 'all' && ` in ${filters.category}`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="border border-gray-300 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid view"
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
            >
              <QueueListIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
              showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
            }`}
            title="Filters"
          >
            <FunnelIcon className="h-4 w-4" />
          </button>

          {/* Add Service */}
          {onCreateService && (
            <button
              onClick={onCreateService}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Service
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={tempFilters.search}
                  onChange={(e) => handleFilterChange({ ...tempFilters, search: e.target.value })}
                  placeholder="Search services..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={tempFilters.category}
                onChange={(e) => handleFilterChange({ ...tempFilters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={tempFilters.active?.toString() || 'all'}
                onChange={(e) => handleFilterChange({
                  ...tempFilters,
                  active: e.target.value === 'all' ? undefined : e.target.value === 'true'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={tempFilters.sortBy}
                  onChange={(e) => handleFilterChange({ ...tempFilters, sortBy: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="name">Name</option>
                  <option value="category">Category</option>
                  <option value="rate">Rate</option>
                  <option value="createdAt">Created</option>
                  <option value="updatedAt">Updated</option>
                  <option value="usage">Usage</option>
                </select>
                <select
                  value={tempFilters.sortOrder}
                  onChange={(e) => handleFilterChange({ ...tempFilters, sortOrder: e.target.value as 'asc' | 'desc' })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="asc">↑</option>
                  <option value="desc">↓</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
              {sortedServices.length} result{sortedServices.length !== 1 ? 's' : ''}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-slate-600 text-white text-sm rounded-md hover:bg-slate-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Bar */}
      {selectable && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedServices.length === sortedServices.length && sortedServices.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Select all ({selectedServices.length} selected)
                </span>
              </label>
            </div>

            {selectedServices.length > 0 && (
              <button
                onClick={() => onSelectionChange?.([])}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mr-3" />
          <span className="text-gray-600">Loading services...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.category !== 'all'
              ? 'Try adjusting your filters to find more services.'
              : 'Get started by creating your first service.'}
          </p>
          {onCreateService && (
            <button
              onClick={onCreateService}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Service
            </button>
          )}
        </div>
      )}

      {/* Services Grid/List */}
      {!isLoading && sortedServices.length > 0 && (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {sortedServices.map(service => (
            <div key={service.id} className={selectable ? 'relative' : ''}>
              {selectable && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={(e) => handleServiceSelect(service.id, e.target.checked)}
                    className="h-4 w-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                  />
                </div>
              )}

              <ServiceCard
                service={service}
                onView={onViewService}
                onEdit={onEditService}
                onDelete={onDeleteService}
                onToggleStatus={toggleServiceStatus}
                onAddToQuote={onAddToQuote}
                className={viewMode === 'list' ? 'w-full' : ''}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}