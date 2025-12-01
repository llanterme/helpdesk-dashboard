'use client'

import { useState, useEffect } from 'react'
import { useServiceStore, ServiceCategory, serviceUtils } from '@/stores/serviceStore'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  CurrencyDollarIcon,
  TagIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ArrowsRightLeftIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface BulkPricingFormProps {
  isOpen: boolean
  onClose: () => void
  categories: ServiceCategory[]
}

function BulkPricingForm({ isOpen, onClose, categories }: BulkPricingFormProps) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage')
  const [adjustmentValue, setAdjustmentValue] = useState('')
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Bulk Price Adjustment</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.activeServices} services)
                </option>
              ))}
            </select>
          </div>

          {/* Operation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operation
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOperation('increase')}
                className={`px-3 py-2 text-sm font-medium rounded-md border ${
                  operation === 'increase'
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Increase
              </button>
              <button
                onClick={() => setOperation('decrease')}
                className={`px-3 py-2 text-sm font-medium rounded-md border ${
                  operation === 'decrease'
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Decrease
              </button>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAdjustmentType('percentage')}
                className={`px-3 py-2 text-sm font-medium rounded-md border ${
                  adjustmentType === 'percentage'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Percentage
              </button>
              <button
                onClick={() => setAdjustmentType('fixed')}
                className={`px-3 py-2 text-sm font-medium rounded-md border ${
                  adjustmentType === 'fixed'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Fixed Amount
              </button>
            </div>
          </div>

          {/* Adjustment Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {adjustmentType === 'percentage' ? 'Percentage' : 'Amount (ZAR)'}
            </label>
            <div className="relative">
              {adjustmentType === 'fixed' && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R</span>
              )}
              <input
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  adjustmentType === 'fixed' ? 'pl-8' : ''
                }`}
                placeholder={adjustmentType === 'percentage' ? 'e.g., 10' : 'e.g., 50.00'}
                step={adjustmentType === 'percentage' ? '1' : '0.01'}
              />
              {adjustmentType === 'percentage' && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              )}
            </div>
          </div>

          {/* Preview */}
          {adjustmentValue && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Preview:</strong> This will {operation} all rates
                {selectedCategory ? ` in "${selectedCategory}"` : ''} by{' '}
                {adjustmentType === 'percentage' ? `${adjustmentValue}%` : `R${adjustmentValue}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Example: R100.00 → R{
                  adjustmentType === 'percentage'
                    ? operation === 'increase'
                      ? (100 * (1 + parseFloat(adjustmentValue || '0') / 100)).toFixed(2)
                      : (100 * (1 - parseFloat(adjustmentValue || '0') / 100)).toFixed(2)
                    : operation === 'increase'
                      ? (100 + parseFloat(adjustmentValue || '0')).toFixed(2)
                      : (100 - parseFloat(adjustmentValue || '0')).toFixed(2)
                }
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!adjustmentValue}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  )
}

interface CategoryManagerProps {
  isOpen: boolean
  onClose: () => void
  categories: ServiceCategory[]
}

function CategoryManager({ isOpen, onClose, categories }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Manage Categories</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Add New Category */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Add New Category</h4>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <button
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add
              </button>
            </div>
          </div>

          {/* Existing Categories */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Existing Categories</h4>
            <div className="space-y-3">
              {categories.map(category => (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    {editingCategory === category.name ? (
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                        />
                        <button
                          onClick={() => {
                            // Handle save
                            setEditingCategory(null)
                            setEditCategoryName('')
                          }}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null)
                            setEditCategoryName('')
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h5 className="font-medium text-gray-900">{category.name}</h5>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>{category.activeServices} active services</span>
                          <span>{category.totalServices} total services</span>
                          <span>Avg: {category.averageRate ? serviceUtils.formatRate(category.averageRate) : 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {editingCategory !== category.name && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category.name)
                          setEditCategoryName(category.name)
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {category.totalServices > 0 ? (
                        <button
                          title="Cannot delete category with services"
                          className="p-2 text-gray-300 cursor-not-allowed rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PricingManagementPage() {
  const {
    categories,
    categorySummary,
    isLoading,
    fetchCategories
  } = useServiceStore()

  const [isBulkPricingOpen, setIsBulkPricingOpen] = useState(false)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Pricing Management</h1>
              <p className="text-gray-600 mt-1">
                Manage service categories and perform bulk pricing operations
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsBulkPricingOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 flex items-center"
              >
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                Bulk Pricing
              </button>
              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Manage Categories
              </button>
            </div>
          </div>
        </div>

      {/* Summary Stats */}
      {categorySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <TagIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{categorySummary.totalCategories}</p>
                <p className="text-gray-600">Categories</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{categorySummary.totalServices}</p>
                <p className="text-gray-600">Total Services</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <CheckIcon className="h-8 w-8 text-emerald-500" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{categorySummary.activeServices}</p>
                <p className="text-gray-600">Active Services</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <XMarkIcon className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{categorySummary.inactiveServices}</p>
                <p className="text-gray-600">Inactive Services</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Categories Overview</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
              Loading categories...
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No categories found. Services will be created as categories are added.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => {
                  const categoryColor = serviceUtils.getCategoryColor(category.name)

                  return (
                    <tr key={category.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-medium">{category.activeServices}</span>
                          <span className="text-gray-500">active</span>
                          {category.inactiveServices > 0 && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-red-600">{category.inactiveServices}</span>
                              <span className="text-gray-500">inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.rateRange ?
                          `${serviceUtils.formatRate(category.rateRange.min)} - ${serviceUtils.formatRate(category.rateRange.max)}`
                          : 'No services'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {category.averageRate ? serviceUtils.formatRate(category.averageRate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setIsBulkPricingOpen(true)}
                          className="text-slate-600 hover:text-slate-900 mr-4"
                        >
                          Adjust Pricing
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Pricing Modal */}
      <BulkPricingForm
        isOpen={isBulkPricingOpen}
        onClose={() => setIsBulkPricingOpen(false)}
        categories={categories}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
      />
      </div>
    </DashboardLayout>
  )
}