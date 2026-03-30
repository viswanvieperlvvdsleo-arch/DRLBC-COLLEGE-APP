import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  const prisma = new PrismaClient();

  const teacherPassword = await bcrypt.hash("bug", 10);
  const studentPassword = await bcrypt.hash("student123", 10);

  await prisma.user.upsert({
    where: { email: "teacher@gmail.com" },
    update: {},
    create: {
      email: "teacher@gmail.com",
      username: "viswan",
      password: teacherPassword,
      role: "TEACHER",
    },
  });

  await prisma.user.upsert({
    where: { email: "student@gmail.com" },
    update: {},
    create: {
      email: "student@gmail.com",
      username: "student",
      password: studentPassword,
      role: "STUDENT",
    },
  });

  console.log("Seed completed");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed Error:", e);
  process.exit(1);
});
