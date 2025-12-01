'use client'

import { useState } from 'react'
import { useInvoiceStore, Invoice, invoiceUtils } from '@/stores/invoiceStore'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

interface InvoiceDetailProps {
  invoice: Invoice
  onBack?: () => void
  onEdit?: (invoice: Invoice) => void
  onDelete?: (invoice: Invoice) => void
}

export function InvoiceDetail({ invoice, onBack, onEdit, onDelete }: InvoiceDetailProps) {
  const { updateInvoiceStatus, deleteInvoice, isLoading } = useInvoiceStore()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  // Handle status updates
  const handleMarkPaid = async () => {
    try {
      await updateInvoiceStatus(invoice.id, 'PAID', new Date(paymentDate).toISOString())
      setShowPaymentModal(false)
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
    }
  }

  const handleMarkSent = async () => {
    try {
      await updateInvoiceStatus(invoice.id, 'SENT')
    } catch (error) {
      console.error('Error marking invoice as sent:', error)
    }
  }

  const handleMarkOverdue = async () => {
    try {
      await updateInvoiceStatus(invoice.id, 'OVERDUE')
    } catch (error) {
      console.error('Error marking invoice as overdue:', error)
    }
  }

  const handleDeleteInvoice = async () => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceUtils.formatInvoiceNumber(invoice.id)}? This action cannot be undone.`)) {
      try {
        await deleteInvoice(invoice.id)
        if (onDelete) onDelete(invoice)
        if (onBack) onBack()
      } catch (error) {
        console.error('Error deleting invoice:', error)
      }
    }
  }

  const isOverdue = invoiceUtils.isOverdue(invoice)
  const daysPastDue = invoiceUtils.getDaysPastDue(invoice)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoiceUtils.formatInvoiceNumber(invoice.id)}
            </h1>
            <p className="text-gray-600">
              Created {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Actions */}
          {invoice.status === 'PENDING' && (
            <button
              onClick={handleMarkSent}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Mark as Sent
            </button>
          )}

          {invoiceUtils.canMarkPaid(invoice) && (
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
            >
              <BanknotesIcon className="h-4 w-4 mr-2" />
              Mark as Paid
            </button>
          )}

          {(invoice.status === 'SENT' && isOverdue) && (
            <button
              onClick={handleMarkOverdue}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
            >
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Mark Overdue
            </button>
          )}

          {/* Action Menu */}
          <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
            <button
              onClick={() => window.print()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Print invoice"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>

            <button
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Duplicate invoice"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
            </button>

            {invoiceUtils.canEdit(invoice) && onEdit && (
              <button
                onClick={() => onEdit(invoice)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit invoice"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}

            {invoiceUtils.canDelete(invoice) && onDelete && (
              <button
                onClick={handleDeleteInvoice}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                title="Delete invoice"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status and Due Date Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${invoiceUtils.getStatusColor(invoice.status)}20`,
                color: invoiceUtils.getStatusColor(invoice.status)
              }}
            >
              {invoice.status === 'PAID' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
              {(invoice.status === 'OVERDUE' || isOverdue) && <ClockIcon className="h-4 w-4 mr-1" />}
              {invoiceUtils.formatStatus(invoice.status)}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>

            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                  {isOverdue && (
                    <span className="ml-2 text-xs">({daysPastDue} days overdue)</span>
                  )}
                </span>
              </div>
            )}

            {invoice.paidDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="text-green-600 font-medium">{new Date(invoice.paidDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {invoiceUtils.formatAmount(invoice.totalAmount)}
          </div>
          <p className="text-gray-600">
            {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Client and Quote Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{invoice.client?.name}</p>
              {invoice.client?.company && (
                <p className="text-sm text-gray-600">{invoice.client.company}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-sm text-gray-900">{invoice.client?.email}</p>
            </div>

            {invoice.client?.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-sm text-gray-900">{invoice.client.phone}</p>
              </div>
            )}

            {invoice.client?.address && (
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{invoice.client.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quote Information */}
        {invoice.quote && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Quote</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Quote Number</p>
                <p className="text-sm font-medium text-gray-900">{invoice.quote.number}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Quote Status</p>
                <p className="text-sm text-gray-900">{invoice.quote.status}</p>
              </div>

              {invoice.quote.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm text-gray-900">{invoice.quote.notes}</p>
                </div>
              )}

              {invoice.quote.terms && (
                <div>
                  <p className="text-sm text-gray-600">Terms</p>
                  <p className="text-sm text-gray-900">{invoice.quote.terms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent Information */}
        {invoice.agent && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{invoice.agent.name}</p>
                <p className="text-sm text-gray-600">{invoice.agent.email}</p>
              </div>

              {invoice.agent.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm text-gray-900">{invoice.agent.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Items */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.service?.name}</p>
                      {item.service?.description && (
                        <p className="text-sm text-gray-600">{item.service.description}</p>
                      )}
                      <p className="text-xs text-gray-500">{item.service?.category}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.quantity} {item.service?.unit && `${item.service.unit}${item.quantity !== 1 ? 's' : ''}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {invoiceUtils.formatAmount(item.rate)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {invoiceUtils.formatAmount(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  Total Amount:
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  {invoiceUtils.formatAmount(invoice.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Commission Information */}
      {invoice.bill && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Bill</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Bill Status</p>
              <p className="text-sm font-medium text-gray-900">{invoice.bill.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Commission Amount</p>
              <p className="text-sm font-medium text-gray-900">
                {invoiceUtils.formatAmount(invoice.bill.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bill Created</p>
              <p className="text-sm text-gray-900">
                {new Date(invoice.bill.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark Invoice as Paid</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Marking...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}