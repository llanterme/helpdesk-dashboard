import { PrismaClient, QuoteStatus, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to generate quote number
function generateQuoteNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `QT-${timestamp}${random}`
}

// Helper function to calculate quote totals
function calculateQuoteTotals(subtotal: number, taxRate: number, discountRate: number) {
  const discountAmount = (subtotal * discountRate) / 100
  const subtotalAfterDiscount = subtotal - discountAmount
  const taxAmount = (subtotalAfterDiscount * taxRate) / 100
  const totalAmount = subtotalAfterDiscount + taxAmount

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  }
}

export async function seedQuotes() {
  console.log('🎯 Seeding quotes...')

  try {
    // Get existing clients, agents, and services
    const clients = await prisma.client.findMany()
    const agents = await prisma.agent.findMany()
    const services = await prisma.service.findMany()

    if (clients.length === 0 || agents.length === 0 || services.length === 0) {
      console.log('⚠️  Missing required data (clients, agents, or services). Skipping quote seeding.')
      return
    }

    // Sample quote data with various statuses and scenarios
    const sampleQuotes: Array<{
      clientId: string
      agentId?: string
      status: QuoteStatus
      taxRate: number
      discountRate: number
      notes?: string
      terms?: string
      validUntil?: Date
      sentAt?: Date
      acceptedAt?: Date
      items: Array<{
        serviceId: string
        quantity: number
        rate?: number // If not provided, use service rate
        description?: string
      }>
    }> = [
      // 1. Large corporate apostille package - ACCEPTED
      {
        clientId: clients[0]?.id,
        agentId: agents[0]?.id,
        status: 'ACCEPTED',
        taxRate: 15.0,
        discountRate: 10.0, // 10% bulk discount
        notes: 'Large volume apostille service for corporate documents. Client requires expedited processing within 5 business days.',
        terms: 'Payment due within 30 days of invoice date. All documents must be provided in original format. Expedited processing fee included.',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        items: [
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('apostille'))?.id || services[0].id,
            quantity: 25,
            description: 'Corporate registration documents'
          },
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('notariz'))?.id || services[1].id,
            quantity: 25,
            description: 'Document notarization prior to apostille'
          },
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('translation'))?.id || services[2].id,
            quantity: 5,
            description: 'English to Afrikaans translation for local filing'
          }
        ]
      },

      // 2. Individual document services - PENDING
      {
        clientId: clients[1]?.id,
        agentId: agents[1]?.id,
        status: 'PENDING',
        taxRate: 15.0,
        discountRate: 0,
        notes: 'Individual client requiring document services for emigration purposes. Documents needed for visa application.',
        terms: 'Standard terms and conditions apply. Payment required upfront for individual clients.',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        items: [
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('apostille'))?.id || services[0].id,
            quantity: 3,
            description: 'Birth certificate, marriage certificate, police clearance'
          },
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('translation'))?.id || services[2].id,
            quantity: 3,
            description: 'Translation to English for visa application'
          }
        ]
      },

      // 3. Legal consultation package - DRAFT
      {
        clientId: clients[0]?.id,
        agentId: agents[0]?.id,
        status: 'DRAFT',
        taxRate: 15.0,
        discountRate: 5.0, // 5% returning client discount
        notes: 'Comprehensive legal consultation package for property transaction. Client is repeat customer.',
        terms: 'Consultation fees are non-refundable. Additional work may be quoted separately based on requirements.',
        validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        items: [
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('consultation'))?.id || services[3].id,
            quantity: 5,
            description: 'Initial consultation and document review'
          },
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('contract'))?.id || services[4].id,
            quantity: 1,
            description: 'Property purchase agreement review'
          }
        ]
      },

      // 4. Business registration services - SENT
      {
        clientId: clients[1]?.id || clients[0].id,
        agentId: agents[1]?.id,
        status: 'SENT',
        taxRate: 15.0,
        discountRate: 0,
        notes: 'New business registration and compliance setup. Startup package for new client.',
        terms: 'CIPC registration fees not included. Additional government fees will be passed through at cost.',
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        items: [
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('registration'))?.id || services[5].id,
            quantity: 1,
            description: 'Company registration with CIPC'
          },
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('consultation'))?.id || services[3].id,
            quantity: 2,
            description: 'Business structure consultation'
          }
        ]
      },

      // 5. High-value document preparation - ACCEPTED
      {
        clientId: clients[0]?.id || clients[1].id,
        agentId: agents[0]?.id,
        status: 'ACCEPTED',
        taxRate: 15.0,
        discountRate: 15.0, // 15% volume discount
        notes: 'Large-scale document preparation for international tender. Time-sensitive project with tight deadlines.',
        terms: 'Rush processing fees apply. All documents must be completed within 3 business days. Payment terms: 50% upfront, 50% on completion.',
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        items: [
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('apostille'))?.id || services[0].id,
            quantity: 50,
            rate: 120, // Rush processing rate
            description: 'Expedited apostille service for tender documents'
          },
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('notariz'))?.id || services[1].id,
            quantity: 50,
            rate: 80, // Rush processing rate
            description: 'Expedited notarization service'
          },
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('translation'))?.id || services[2].id,
            quantity: 20,
            rate: 180, // Technical document translation
            description: 'Technical specification translation'
          }
        ]
      },

      // 6. Rejected quote for comparison
      {
        clientId: clients[1]?.id || clients[0].id,
        agentId: agents[1]?.id,
        status: 'REJECTED',
        taxRate: 15.0,
        discountRate: 0,
        notes: 'Client decided to handle some services internally. Quote rejected due to budget constraints.',
        terms: 'Standard terms and conditions apply.',
        validUntil: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired 5 days ago
        sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        items: [
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('consultation'))?.id || services[3].id,
            quantity: 10,
            description: 'Extended legal consultation package'
          }
        ]
      },

      // 7. Expired quote
      {
        clientId: clients[0]?.id,
        agentId: agents[0]?.id,
        status: 'EXPIRED',
        taxRate: 15.0,
        discountRate: 5.0,
        notes: 'Quote expired due to client delayed response. Services still available if client wishes to proceed with new quote.',
        terms: 'Prices subject to review for new quotes after expiration date.',
        validUntil: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired 10 days ago
        sentAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        items: [
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('apostille'))?.id || services[0].id,
            quantity: 15,
            description: 'Mixed document apostille service'
          }
        ]
      },

      // 8. Simple notarization - PENDING
      {
        clientId: clients[1]?.id || clients[0].id,
        agentId: agents[1]?.id,
        status: 'PENDING',
        taxRate: 15.0,
        discountRate: 0,
        notes: 'Simple notarization service for power of attorney documents.',
        terms: 'Client must bring valid ID and original documents.',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        items: [
          {
            serviceId: services.find(s => s.name.toLowerCase().includes('notariz'))?.id || services[1].id,
            quantity: 2,
            description: 'Power of attorney documents'
          }
        ]
      }
    ]

    // Create quotes with calculated totals
    for (const quoteData of sampleQuotes) {
      try {
        // Calculate subtotal from items
        let subtotal = 0
        const quoteItems = []

        for (const itemData of quoteData.items) {
          const service = services.find(s => s.id === itemData.serviceId)
          if (!service) continue

          const rate = itemData.rate || service.rate
          const lineTotal = rate * itemData.quantity

          subtotal += lineTotal

          quoteItems.push({
            serviceId: itemData.serviceId,
            quantity: itemData.quantity,
            rate: rate,
            lineTotal: lineTotal,
            customDescription: itemData.description
          })
        }

        // Calculate totals
        const { discountAmount, taxAmount, totalAmount } = calculateQuoteTotals(
          subtotal,
          quoteData.taxRate,
          quoteData.discountRate
        )

        // Generate unique quote number
        let quoteNumber: string
        let isUnique = false
        do {
          quoteNumber = generateQuoteNumber()
          const existing = await prisma.quote.findFirst({
            where: { number: quoteNumber }
          })
          isUnique = !existing
        } while (!isUnique)

        // Create quote with items in transaction
        const quote = await prisma.$transaction(async (tx) => {
          const newQuote = await tx.quote.create({
            data: {
              number: quoteNumber,
              clientId: quoteData.clientId,
              agentId: quoteData.agentId,
              status: quoteData.status,
              subtotal: subtotal,
              taxRate: quoteData.taxRate,
              taxAmount: taxAmount,
              discountRate: quoteData.discountRate,
              discountAmount: discountAmount,
              totalAmount: totalAmount,
              notes: quoteData.notes,
              terms: quoteData.terms,
              validUntil: quoteData.validUntil,
              sentAt: quoteData.sentAt,
              acceptedAt: quoteData.acceptedAt
            }
          })

          // Create quote items
          await Promise.all(
            quoteItems.map(item =>
              tx.quoteItem.create({
                data: {
                  quoteId: newQuote.id,
                  ...item
                }
              })
            )
          )

          // Create status log entry
          await tx.quoteStatusLog.create({
            data: {
              quoteId: newQuote.id,
              status: quoteData.status,
              changedBy: quoteData.agentId || 'system',
              notes: `Quote created with status ${quoteData.status}`
            }
          })

          return newQuote
        })

        console.log(`✅ Created quote: ${quote.number} (${quote.status}) - ${totalAmount.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}`)

      } catch (error) {
        console.error(`❌ Failed to create quote: ${error}`)
      }
    }

    // Get final count
    const quoteCount = await prisma.quote.count()
    console.log(`🎯 Quote seeding completed! Total quotes: ${quoteCount}`)

    // Print summary statistics
    const statusCounts = await prisma.quote.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true }
    })

    console.log('\n📊 Quote Summary:')
    for (const stat of statusCounts) {
      console.log(`   ${stat.status}: ${stat._count.id} quotes, ${stat._sum.totalAmount?.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })} total value`)
    }

  } catch (error) {
    console.error('❌ Error seeding quotes:', error)
    throw error
  }
}

export async function cleanupQuotes() {
  console.log('🧹 Cleaning up existing quotes...')

  // Delete in order due to foreign key constraints
  await prisma.quoteStatusLog.deleteMany()
  await prisma.quoteItem.deleteMany()
  await prisma.quote.deleteMany()

  console.log('✅ Quote cleanup completed')
}