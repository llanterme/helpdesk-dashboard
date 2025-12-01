const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedInvoices() {
  console.log('🧾 Seeding invoices...');

  // Get existing data to reference
  const clients = await prisma.client.findMany();
  const agents = await prisma.agent.findMany();
  const services = await prisma.service.findMany();
  const quotes = await prisma.quote.findMany({ where: { status: 'ACCEPTED' } });

  if (clients.length === 0 || services.length === 0) {
    console.log('❌ Cannot seed invoices: No clients or services found');
    return;
  }

  // Clear existing invoices
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();

  // Helper function to get random array element
  const getRandom = (array) => array[Math.floor(Math.random() * array.length)];

  // Helper function to generate date relative to now
  const getDateOffset = (daysOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  };

  // Helper function to get safe service ID with fallback
  const getServiceId = (index) => {
    return services[Math.min(index, services.length - 1)]?.id || services[0]?.id;
  };

  // Sample invoice data with various states
  const invoiceTemplates = [
    // Recent pending invoices
    {
      status: 'PENDING',
      totalAmount: 15000,
      dueDate: getDateOffset(30),
      items: [
        { serviceId: getServiceId(0), quantity: 1, rate: 15000 }
      ]
    },
    {
      status: 'PENDING',
      totalAmount: 8500,
      dueDate: getDateOffset(21),
      items: [
        { serviceId: getServiceId(1), quantity: 1, rate: 8500 }
      ]
    },

    // Sent invoices awaiting payment
    {
      status: 'SENT',
      totalAmount: 25000,
      dueDate: getDateOffset(15),
      items: [
        { serviceId: getServiceId(2), quantity: 1, rate: 25000 }
      ]
    },
    {
      status: 'SENT',
      totalAmount: 12000,
      dueDate: getDateOffset(20),
      items: [
        { serviceId: getServiceId(3), quantity: 2, rate: 6000 }
      ]
    },
    {
      status: 'SENT',
      totalAmount: 7500,
      dueDate: getDateOffset(10),
      items: [
        { serviceId: getServiceId(4), quantity: 3, rate: 2500 }
      ]
    },

    // Paid invoices (recent payments)
    {
      status: 'PAID',
      totalAmount: 18000,
      dueDate: getDateOffset(-5),
      paidDate: getDateOffset(-2),
      items: [
        { serviceId: getServiceId(5), quantity: 1, rate: 18000 }
      ]
    },
    {
      status: 'PAID',
      totalAmount: 9500,
      dueDate: getDateOffset(-10),
      paidDate: getDateOffset(-8),
      items: [
        { serviceId: getServiceId(6), quantity: 1, rate: 9500 }
      ]
    },
    {
      status: 'PAID',
      totalAmount: 22000,
      dueDate: getDateOffset(-15),
      paidDate: getDateOffset(-12),
      items: [
        { serviceId: getServiceId(0), quantity: 1, rate: 15000 },
        { serviceId: getServiceId(1), quantity: 1, rate: 7000 }
      ]
    },

    // Overdue invoices (past due date)
    {
      status: 'SENT',
      totalAmount: 11000,
      dueDate: getDateOffset(-5),
      items: [
        { serviceId: getServiceId(7), quantity: 1, rate: 11000 }
      ]
    },
    {
      status: 'SENT',
      totalAmount: 8000,
      dueDate: getDateOffset(-12),
      items: [
        { serviceId: getServiceId(8), quantity: 2, rate: 4000 }
      ]
    },
    {
      status: 'SENT',
      totalAmount: 16500,
      dueDate: getDateOffset(-20),
      items: [
        { serviceId: getServiceId(9), quantity: 1, rate: 16500 }
      ]
    },

    // Larger invoices with multiple services
    {
      status: 'PENDING',
      totalAmount: 45000,
      dueDate: getDateOffset(45),
      items: [
        { serviceId: getServiceId(0), quantity: 1, rate: 25000 },
        { serviceId: getServiceId(1), quantity: 1, rate: 12000 },
        { serviceId: getServiceId(2), quantity: 1, rate: 8000 }
      ]
    },
    {
      status: 'SENT',
      totalAmount: 32000,
      dueDate: getDateOffset(25),
      items: [
        { serviceId: getServiceId(3), quantity: 4, rate: 5000 },
        { serviceId: getServiceId(4), quantity: 1, rate: 12000 }
      ]
    },

    // Paid invoices with different payment timing
    {
      status: 'PAID',
      totalAmount: 28000,
      dueDate: getDateOffset(-30),
      paidDate: getDateOffset(-28), // Paid early
      items: [
        { serviceId: getServiceId(5), quantity: 1, rate: 18000 },
        { serviceId: getServiceId(6), quantity: 1, rate: 10000 }
      ]
    },
    {
      status: 'PAID',
      totalAmount: 14000,
      dueDate: getDateOffset(-25),
      paidDate: getDateOffset(-22), // Paid on time
      items: [
        { serviceId: getServiceId(7), quantity: 2, rate: 7000 }
      ]
    },
    {
      status: 'PAID',
      totalAmount: 19500,
      dueDate: getDateOffset(-40),
      paidDate: getDateOffset(-35), // Paid late but eventually paid
      items: [
        { serviceId: getServiceId(8), quantity: 1, rate: 19500 }
      ]
    }
  ];

  // Create invoices
  let invoiceCount = 0;
  for (const template of invoiceTemplates) {
    const client = getRandom(clients);
    const agent = Math.random() > 0.3 ? getRandom(agents) : null; // 70% chance of agent assignment

    try {
      const invoice = await prisma.invoice.create({
        data: {
          clientId: client.id,
          agentId: agent?.id,
          status: template.status,
          totalAmount: template.totalAmount,
          dueDate: template.dueDate,
          paidDate: template.paidDate || null,
          // Convert from quote if we have quotes available and it's a random chance
          quoteId: quotes.length > 0 && Math.random() > 0.7 ? getRandom(quotes).id : null,
          createdAt: getDateOffset(Math.floor(Math.random() * -60)), // Random creation date in last 60 days
          updatedAt: new Date()
        }
      });

      // Create invoice items
      for (const item of template.items) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            rate: item.rate,
            lineTotal: item.quantity * item.rate
          }
        });
      }

      invoiceCount++;
      console.log(`✅ Created invoice ${invoice.id} for ${client.name} - ${template.status} - R${template.totalAmount.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Error creating invoice:', error.message);
    }
  }

  // Create some invoices converted from quotes if quotes exist
  if (quotes.length > 0) {
    console.log('\n📋 Creating invoices from quotes...');

    for (let i = 0; i < Math.min(3, quotes.length); i++) {
      const quote = quotes[i];
      const quoteWithItems = await prisma.quote.findUnique({
        where: { id: quote.id },
        include: { items: true }
      });

      if (quoteWithItems && quoteWithItems.items.length > 0) {
        try {
          const invoiceFromQuote = await prisma.invoice.create({
            data: {
              clientId: quote.clientId,
              agentId: quote.agentId,
              quoteId: quote.id,
              status: 'SENT',
              totalAmount: quote.totalAmount,
              dueDate: getDateOffset(30),
              createdAt: getDateOffset(-10),
              updatedAt: new Date()
            }
          });

          // Copy quote items to invoice items
          for (const quoteItem of quoteWithItems.items) {
            await prisma.invoiceItem.create({
              data: {
                invoiceId: invoiceFromQuote.id,
                serviceId: quoteItem.serviceId,
                quantity: quoteItem.quantity,
                rate: quoteItem.rate,
                lineTotal: quoteItem.lineTotal
              }
            });
          }

          // Update quote status to invoiced
          await prisma.quote.update({
            where: { id: quote.id },
            data: { status: 'ACCEPTED' }
          });

          invoiceCount++;
          console.log(`✅ Created invoice from quote ${quote.number} - R${quote.totalAmount.toLocaleString()}`);

        } catch (error) {
          console.error('❌ Error creating invoice from quote:', error.message);
        }
      }
    }
  }

  console.log(`\n🎉 Successfully seeded ${invoiceCount} invoices!`);

  // Display summary statistics
  const stats = await prisma.invoice.groupBy({
    by: ['status'],
    _count: { _all: true },
    _sum: { totalAmount: true }
  });

  console.log('\n📊 Invoice Statistics:');
  for (const stat of stats) {
    const count = stat._count._all;
    const total = stat._sum.totalAmount || 0;
    console.log(`   ${stat.status}: ${count} invoices - R${total.toLocaleString()}`);
  }

  // Calculate overdue invoices
  const overdueCount = await prisma.invoice.count({
    where: {
      status: 'SENT',
      dueDate: {
        lt: new Date()
      }
    }
  });

  const overdueAmount = await prisma.invoice.aggregate({
    where: {
      status: 'SENT',
      dueDate: {
        lt: new Date()
      }
    },
    _sum: { totalAmount: true }
  });

  console.log(`   OVERDUE: ${overdueCount} invoices - R${(overdueAmount._sum.totalAmount || 0).toLocaleString()}`);
}

async function main() {
  try {
    await seedInvoices();
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedInvoices };