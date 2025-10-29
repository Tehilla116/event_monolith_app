import { prisma } from "../src/db";

async function approveAllEvents() {
  // Update all events to approved
  const result = await prisma.event.updateMany({
    data: {
      approved: true,
    },
  });

  console.log(`✅ Approved ${result.count} events successfully!`);
}

approveAllEvents()
  .catch((error) => {
    console.error("❌ Error approving events:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });