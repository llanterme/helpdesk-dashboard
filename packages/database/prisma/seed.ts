import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@helpdesk.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    }
  })

  // Create admin agent
  const adminAgent = await prisma.agent.create({
    data: {
      userId: adminUser.id,
      name: 'Admin User',
      email: 'admin@helpdesk.com',
      phone: '+27 11 000 0000',
      role: 'ADMIN',
      avatar: 'AD',
      color: '#f59e0b',
      commissionRate: 0,
    }
  })

  // Create sample agents
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        name: 'Sipho Ndlovu',
        email: 'sipho@helpdesk.com',
        phone: '+27 82 123 4567',
        role: 'SENIOR_AGENT',
        avatar: 'SN',
        color: '#3b82f6',
        commissionRate: 50,
      }
    }),
    prisma.agent.create({
      data: {
        name: 'Maria Santos',
        email: 'maria@helpdesk.com',
        phone: '+27 83 234 5678',
        role: 'AGENT',
        avatar: 'MS',
        color: '#10b981',
        commissionRate: 50,
      }
    })
  ])

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'James Mokoena',
        email: 'james@example.com',
        phone: '+27 82 123 4567',
        company: 'Mokoena Legal',
      }
    }),
    prisma.client.create({
      data: {
        name: 'Sarah Nkosi',
        email: 'sarah.nkosi@gmail.com',
        phone: '+27 83 234 5678',
      }
    })
  ])

  // Create services catalog
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Apostille - DIRCO',
        category: 'Apostille',
        description: 'Document apostille through DIRCO (3-4 weeks)',
        rate: 850,
        unit: 'per document',
        sku: 'APO-DIRCO',
      }
    }),
    prisma.service.create({
      data: {
        name: 'Apostille - High Court',
        category: 'Apostille',
        description: 'Fast-track apostille through High Court (1-2 days)',
        rate: 1200,
        unit: 'per document',
        sku: 'APO-HC',
      }
    }),
    prisma.service.create({
      data: {
        name: 'Notarial Certification',
        category: 'Notary',
        description: 'Certified true copy by Notary Public',
        rate: 350,
        unit: 'per document',
        sku: 'NOT-CERT',
      }
    })
  ])

  // Create sample tickets with messages
  const sampleTickets = await Promise.all([
    // WhatsApp ticket with conversation
    prisma.ticket.create({
      data: {
        subject: 'Document Apostille Request',
        channel: 'WHATSAPP',
        status: 'OPEN',
        priority: 'HIGH',
        clientId: clients[0].id,
        agentId: agents[0].id,
      }
    }),
    // Email ticket
    prisma.ticket.create({
      data: {
        subject: 'Notary Certification Inquiry',
        channel: 'EMAIL',
        status: 'PENDING',
        priority: 'MEDIUM',
        clientId: clients[1].id,
        agentId: agents[1].id,
      }
    }),
    // Form submission ticket
    prisma.ticket.create({
      data: {
        subject: 'High Court Apostille - Urgent',
        channel: 'FORM',
        status: 'OPEN',
        priority: 'URGENT',
        clientId: clients[0].id,
      }
    }),
    // Live chat ticket
    prisma.ticket.create({
      data: {
        subject: 'General Questions About Services',
        channel: 'CHAT',
        status: 'RESOLVED',
        priority: 'LOW',
        clientId: clients[1].id,
        agentId: agents[0].id,
      }
    })
  ])

  // Create sample messages for each ticket
  const sampleMessages = [
    // WhatsApp conversation
    {
      ticketId: sampleTickets[0].id,
      senderType: 'CLIENT',
      content: '👋 Hi there! I need to get my university degree apostilled for a job application overseas. Can you help me with this?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      ticketId: sampleTickets[0].id,
      senderType: 'AGENT',
      content: 'Hello! Absolutely, I can help you with that. We offer two options for degree apostille:\n\n1. DIRCO route (3-4 weeks) - R850\n2. High Court route (1-2 days) - R1200\n\nWhich timeline works better for you?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 mins later
    },
    {
      ticketId: sampleTickets[0].id,
      senderType: 'CLIENT',
      content: 'I need it quite urgently - probably the High Court option. What documents do I need to provide?',
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
    },
    {
      ticketId: sampleTickets[0].id,
      senderType: 'AGENT',
      content: 'Perfect! For the High Court apostille, you\'ll need:\n\n📄 Original university degree\n📄 Certified copy of your ID\n📄 Completed application form\n\nI can email you the application form now. What\'s your email address?',
      timestamp: new Date(Date.now() - 1.4 * 60 * 60 * 1000),
    },

    // Email conversation
    {
      ticketId: sampleTickets[1].id,
      senderType: 'CLIENT',
      content: 'Dear Team,\n\nI hope this email finds you well. I am writing to inquire about your notary certification services. \n\nI have several documents that need to be certified as true copies for a visa application. Could you please provide me with:\n\n1. The current pricing for notary certification\n2. The typical turnaround time\n3. Whether you accept walk-ins or require appointments\n\nI would appreciate any information you can provide.\n\nBest regards,\nSarah Nkosi',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      ticketId: sampleTickets[1].id,
      senderType: 'AGENT',
      content: 'Dear Sarah,\n\nThank you for your inquiry about our notary certification services.\n\nI\'m pleased to provide you with the following information:\n\n1. **Pricing**: R350 per document for notarial certification\n2. **Turnaround**: Same day service (within 2-4 hours)\n3. **Appointments**: We accept both walk-ins and appointments. However, I\'d recommend booking an appointment to avoid waiting times.\n\nFor your visa application documents, we can also advise on whether you might need apostille services in addition to notarization, depending on your destination country.\n\nWould you like to schedule an appointment? I have availability tomorrow between 10 AM and 4 PM.\n\nBest regards,\nMaria Santos\nSenior Agent',
      timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
    },

    // Form submission
    {
      ticketId: sampleTickets[2].id,
      senderType: 'CLIENT',
      content: 'URGENT: I submitted a contact form requesting High Court apostille service. I have a flight next week and need my documents apostilled immediately. This is for a job offer that expires soon.\n\nDocuments needed:\n- Marriage certificate\n- Police clearance certificate\n\nPlease contact me ASAP: james@example.com or +27 82 123 4567',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },

    // Live chat conversation
    {
      ticketId: sampleTickets[3].id,
      senderType: 'CLIENT',
      content: 'Hi! I\'m new to this whole apostille process. Can you explain what it is exactly?',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
    {
      ticketId: sampleTickets[3].id,
      senderType: 'AGENT',
      content: 'Hello! Great question! An apostille is an official certification that authenticates the origin of a public document for use in countries that are part of the Hague Convention.',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
    },
    {
      ticketId: sampleTickets[3].id,
      senderType: 'CLIENT',
      content: 'Ah I see. So it\'s like a stamp that says "this document is real"?',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
    },
    {
      ticketId: sampleTickets[3].id,
      senderType: 'AGENT',
      content: 'Exactly! It\'s an internationally recognized certification. Think of it as a "passport" for your documents 😊',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000),
    },
    {
      ticketId: sampleTickets[3].id,
      senderType: 'CLIENT',
      content: 'Perfect! That makes total sense. Thank you for explaining it so clearly! 👍',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000),
    }
  ]

  // Create all messages
  for (const messageData of sampleMessages) {
    await prisma.message.create({
      data: messageData
    })
  }

  console.log('✅ Database seeded successfully with sample messages')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })