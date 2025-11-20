import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
  const data = await prisma.session.findMany(); // ← reemplaza con tu tabla
  fs.writeFileSync('export.json', JSON.stringify(data, null, 2));
  console.log("Datos exportados a export.json");
}

exportData()
  .finally(() => prisma.$disconnect());
