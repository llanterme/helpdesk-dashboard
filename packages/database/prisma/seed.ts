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

  console.log('✅ Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })