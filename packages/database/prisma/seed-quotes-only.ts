import { PrismaClient } from '@prisma/client'
import { seedQuotes, cleanupQuotes } from './seeds/quotes'

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Starting quotes-only seeding...')

  try {
    // Clean up existing quotes first
    await cleanupQuotes()

    // Seed new quotes
    await seedQuotes()

    console.log('✅ Quotes seeding completed successfully!')
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