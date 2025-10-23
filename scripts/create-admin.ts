import { prisma } from "../src/db";
import bcrypt from "bcryptjs";

async function createAdmin() {
  const email = "admin@example.com";
  const password = "admin123"; // Change this!
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("❌ Admin user already exists with email:", email);
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log("Email:", admin.email);
  console.log("Password:", password);
  console.log("Role:", admin.role);
  console.log("\n⚠️  Please change the password after first login!");
}

createAdmin()
  .catch((error) => {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
