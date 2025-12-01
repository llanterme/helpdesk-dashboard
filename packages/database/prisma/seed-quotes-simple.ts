import { PrismaClient, QuoteStatus } from '@prisma/client'

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

async function main() {
  console.log('🎯 Starting simple quotes seeding...')

  try {
    // Get existing data
    const clients = await prisma.client.findMany()
    const agents = await prisma.agent.findMany()
    const services = await prisma.service.findMany({ where: { active: true } })

    console.log(`Found: ${clients.length} clients, ${agents.length} agents, ${services.length} services`)

    if (clients.length === 0) {
      console.log('❌ No clients found. Please run the main seed first to create clients.')
      return
    }

    if (services.length === 0) {
      console.log('❌ No services found. Please run the main seed first to create services.')
      return
    }

    // Clean up existing quotes
    console.log('🧹 Cleaning up existing quotes...')
    try {
      await prisma.quoteStatusLog.deleteMany()
      await prisma.quoteItem.deleteMany()
      await prisma.quote.deleteMany()
    } catch (error) {
      console.log('Note: Some cleanup operations failed (tables may not exist yet)')
    }

    // Create simplified sample quotes
    const sampleQuotes = [
      // Quote 1: Accepted corporate quote
      {
        clientId: clients[0].id,
        agentId: agents.length > 0 ? agents[0].id : undefined,
        status: 'ACCEPTED' as QuoteStatus,
        taxRate: 15.0,
        discountRate: 10.0,
        notes: 'Corporate document apostille service. Bulk discount applied.',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        items: [
          {
            serviceId: services[0].id,
            quantity: 10,
            rate: services[0].rate,
            customDescription: 'Corporate documents for apostille'
          }
        ]
      },

      // Quote 2: Pending individual quote
      {
        clientId: clients.length > 1 ? clients[1].id : clients[0].id,
        agentId: agents.length > 1 ? agents[1].id : agents.length > 0 ? agents[0].id : undefined,
        status: 'PENDING' as QuoteStatus,
        taxRate: 15.0,
        discountRate: 0,
        notes: 'Individual document services for visa application.',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        items: [
          {
            serviceId: services[Math.min(1, services.length - 1)].id,
            quantity: 3,
            rate: services[Math.min(1, services.length - 1)].rate,
            customDescription: 'Personal documents for visa'
          }
        ]
      },

      // Quote 3: Draft quote
      {
        clientId: clients.length > 2 ? clients[2].id : clients[0].id,
        agentId: agents.length > 0 ? agents[0].id : undefined,
        status: 'DRAFT' as QuoteStatus,
        taxRate: 15.0,
        discountRate: 5.0,
        notes: 'Legal consultation package - draft in preparation.',
        validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        items: [
          {
            serviceId: services[Math.min(2, services.length - 1)].id,
            quantity: 5,
            rate: services[Math.min(2, services.length - 1)].rate,
            customDescription: 'Legal consultation hours'
          }
        ]
      }
    ]

    // Create quotes
    for (let i = 0; i < sampleQuotes.length; i++) {
      const quoteData = sampleQuotes[i]

      try {
        // Calculate subtotal
        let subtotal = 0
        const quoteItems = []

        for (const itemData of quoteData.items) {
          const lineTotal = itemData.rate * itemData.quantity
          subtotal += lineTotal

          quoteItems.push({
            serviceId: itemData.serviceId,
            quantity: itemData.quantity,
            rate: itemData.rate,
            lineTotal: lineTotal,
            customDescription: itemData.customDescription
          })
        }

        // Calculate totals
        const { discountAmount, taxAmount, totalAmount } = calculateQuoteTotals(
          subtotal,
          quoteData.taxRate,
          quoteData.discountRate
        )

        // Generate unique quote number
        let quoteNumber = generateQuoteNumber()
        let attempts = 0
        while (attempts < 10) {
          const existing = await prisma.quote.findFirst({
            where: { number: quoteNumber }
          })
          if (!existing) break
          quoteNumber = generateQuoteNumber()
          attempts++
        }

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
              terms: 'Standard terms and conditions apply. Payment due within 30 days.',
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
        console.error(`❌ Failed to create quote ${i + 1}: ${error}`)
      }
    }

    // Get final count and summary
    const quoteCount = await prisma.quote.count()
    console.log(`\n🎯 Simple quote seeding completed! Total quotes: ${quoteCount}`)

    const statusCounts = await prisma.quote.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true }
    })

    console.log('\n📊 Quote Summary:')
    for (const stat of statusCounts) {
      const total = stat._sum.totalAmount || 0
      console.log(`   ${stat.status}: ${stat._count.id} quotes, ${total.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })} total value`)
    }

  } catch (error) {
    console.error('❌ Error during quotes seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })