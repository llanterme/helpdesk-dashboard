const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simulate invoice utility functions for testing
const invoiceUtils = {
  formatInvoiceNumber: (id) => `INV-${id.slice(-8).toUpperCase()}`,

  formatStatus: (status) => {
    const statusMap = {
      'PENDING': 'Pending Review',
      'SENT': 'Sent to Client',
      'PAID': 'Paid',
      'OVERDUE': 'Overdue'
    };
    return statusMap[status] || status;
  },

  getStatusColor: (status) => {
    const colorMap = {
      'PENDING': 'yellow',
      'SENT': 'blue',
      'PAID': 'green',
      'OVERDUE': 'red'
    };
    return colorMap[status] || 'gray';
  },

  isOverdue: (invoice) => {
    if (invoice.status === 'PAID' || !invoice.dueDate) return false;
    return new Date(invoice.dueDate) < new Date();
  },

  canEdit: (invoice) => {
    return invoice.status !== 'PAID';
  },

  canDelete: (invoice) => {
    return invoice.status !== 'PAID' && !invoice.bill;
  },

  getDaysUntilDue: (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  formatAmount: (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  }
};

async function testPaymentTracking() {
  console.log('🧾 Testing Invoice Payment Tracking System\n');

  try {
    // Fetch all invoices with related data
    const invoices = await prisma.invoice.findMany({
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        },
        agent: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            service: {
              select: { id: true, name: true, category: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total Invoices: ${invoices.length}\n`);

    // Test 1: Status Distribution
    console.log('1️⃣  Status Distribution:');
    const statusStats = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {});

    Object.entries(statusStats).forEach(([status, count]) => {
      const color = invoiceUtils.getStatusColor(status);
      console.log(`   ${invoiceUtils.formatStatus(status)}: ${count} invoices (${color})`);
    });

    // Test 2: Overdue Detection
    console.log('\n2️⃣  Overdue Detection:');
    const overdueInvoices = invoices.filter(invoice => invoiceUtils.isOverdue(invoice));
    console.log(`   Found ${overdueInvoices.length} overdue invoices:`);

    overdueInvoices.forEach(invoice => {
      const daysOverdue = Math.abs(invoiceUtils.getDaysUntilDue(invoice.dueDate));
      console.log(`   • ${invoiceUtils.formatInvoiceNumber(invoice.id)} - ${invoice.client.name} - ${invoiceUtils.formatAmount(invoice.totalAmount)} (${daysOverdue} days overdue)`);
    });

    // Test 3: Payment Status Tracking
    console.log('\n3️⃣  Payment Status Tracking:');
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
    const unpaidAmount = invoices
      .filter(inv => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    console.log(`   Paid Invoices: ${paidInvoices.length} (${invoiceUtils.formatAmount(paidAmount)})`);
    console.log(`   Outstanding Amount: ${invoiceUtils.formatAmount(unpaidAmount)}`);

    // Test 4: Due Date Analysis
    console.log('\n4️⃣  Due Date Analysis:');
    const upcomingDue = invoices
      .filter(inv => inv.status !== 'PAID' && inv.dueDate)
      .map(inv => ({
        ...inv,
        daysUntilDue: invoiceUtils.getDaysUntilDue(inv.dueDate)
      }))
      .filter(inv => inv.daysUntilDue > 0)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 5);

    console.log('   Next 5 invoices due:');
    upcomingDue.forEach(invoice => {
      console.log(`   • ${invoiceUtils.formatInvoiceNumber(invoice.id)} - ${invoice.client.name} - ${invoiceUtils.formatAmount(invoice.totalAmount)} (due in ${invoice.daysUntilDue} days)`);
    });

    // Test 5: Permission Testing
    console.log('\n5️⃣  Permission Testing:');
    const testInvoice = invoices[0];
    if (testInvoice) {
      console.log(`   Testing with invoice: ${invoiceUtils.formatInvoiceNumber(testInvoice.id)}`);
      console.log(`   Can Edit: ${invoiceUtils.canEdit(testInvoice)}`);
      console.log(`   Can Delete: ${invoiceUtils.canDelete(testInvoice)}`);
      console.log(`   Is Overdue: ${invoiceUtils.isOverdue(testInvoice)}`);
    }

    // Test 6: Agent Performance (if agents are assigned)
    console.log('\n6️⃣  Agent Performance:');
    const agentStats = invoices
      .filter(inv => inv.agent)
      .reduce((acc, inv) => {
        const agentId = inv.agent.id;
        if (!acc[agentId]) {
          acc[agentId] = {
            name: inv.agent.name,
            totalInvoices: 0,
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0
          };
        }
        acc[agentId].totalInvoices++;
        acc[agentId].totalAmount += inv.totalAmount;
        if (inv.status === 'PAID') {
          acc[agentId].paidAmount += inv.totalAmount;
        } else {
          acc[agentId].pendingAmount += inv.totalAmount;
        }
        return acc;
      }, {});

    Object.values(agentStats).forEach(agent => {
      const collectionRate = ((agent.paidAmount / agent.totalAmount) * 100).toFixed(1);
      console.log(`   ${agent.name}: ${agent.totalInvoices} invoices, ${collectionRate}% collection rate`);
    });

    console.log('\n✅ All payment tracking tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing payment tracking:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await testPaymentTracking();
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testPaymentTracking };