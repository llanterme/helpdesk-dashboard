const { PrismaClient } = require('@helpdesk/database')

const prisma = new PrismaClient()

async function createSampleTickets() {
  try {
    console.log('🎫 Creating sample tickets...')

    // Get existing clients
    const clients = await prisma.client.findMany()
    if (clients.length === 0) {
      console.log('❌ No clients found. Please run seed script first.')
      return
    }

    // Get existing agents
    const agents = await prisma.agent.findMany()

    console.log(`📋 Found ${clients.length} clients and ${agents.length} agents`)

    const sampleTickets = [
      {
        subject: 'Need apostille for birth certificate',
        clientId: clients[0].id,
        agentId: agents[0]?.id,
        channel: 'WHATSAPP',
        priority: 'HIGH',
        status: 'OPEN',
        unread: true
      },
      {
        subject: 'Notarial certification request',
        clientId: clients[1] ? clients[1].id : clients[0].id,
        agentId: agents[1]?.id,
        channel: 'EMAIL',
        priority: 'MEDIUM',
        status: 'PENDING',
        unread: false
      },
      {
        subject: 'Document authentication needed',
        clientId: clients[0].id,
        channel: 'FORM',
        priority: 'LOW',
        status: 'RESOLVED',
        unread: false
      },
      {
        subject: 'Urgent: Marriage certificate apostille',
        clientId: clients[1] ? clients[1].id : clients[0].id,
        channel: 'CHAT',
        priority: 'URGENT',
        status: 'OPEN',
        unread: true
      },
      {
        subject: 'Power of attorney notarization',
        clientId: clients[0].id,
        agentId: agents[0]?.id,
        channel: 'EMAIL',
        priority: 'MEDIUM',
        status: 'CLOSED',
        unread: false
      }
    ]

    for (const ticketData of sampleTickets) {
      const ticket = await prisma.ticket.create({
        data: ticketData,
        include: {
          client: true,
          agent: true
        }
      })

      // Create initial message for each ticket
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          senderType: 'CLIENT',
          content: `Hi, I need help with ${ticket.subject.toLowerCase()}. Can you please assist me with the requirements and process?`,
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
          read: false
        }
      })

      // Add agent response for some tickets
      if (Math.random() > 0.5) {
        await prisma.message.create({
          data: {
            ticketId: ticket.id,
            senderType: 'AGENT',
            senderId: ticket.agentId,
            content: 'Hello! I\'ve received your request and I\'ll be happy to help you. Let me review the requirements and get back to you shortly.',
            timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000), // Random time in last 12h
            read: true
          }
        })
      }

      console.log(`✅ Created ticket: ${ticket.subject} (${ticket.channel})`)
    }

    console.log(`🎉 Successfully created ${sampleTickets.length} sample tickets with messages!`)

    // Show summary
    const ticketCounts = await prisma.ticket.groupBy({
      by: ['channel', 'status'],
      _count: true
    })

    console.log('\n📊 Ticket Summary:')
    ticketCounts.forEach(({ channel, status, _count }) => {
      console.log(`  ${channel} - ${status}: ${_count} tickets`)
    })

  } catch (error) {
    console.error('❌ Error creating sample tickets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleTickets()