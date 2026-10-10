import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ข้อมูลเส้นทางและจุดจอดภายในมหาวิทยาลัยแม่โจ้ (จากต้นแบบของทีม)
const ROUTES = [
  {
    name: 'สาย 1 (หอพักใน - อาคารเรียนรวม 60 ปี)',
    departureTimes: ['08:00', '09:00', '10:00'],
    stops: [
      { name: 'ป้ายหอพักชายใน', latitude: 18.89, longitude: 99.004 },
      { name: 'ป้ายสำนักหอสมุด', latitude: 18.8918, longitude: 99.0022 },
      { name: 'ป้ายคณะวิทยาศาสตร์', latitude: 18.8945, longitude: 98.9995 },
      { name: 'ป้ายอาคารเรียนรวม 60 ปี', latitude: 18.891, longitude: 99.0008 },
    ],
  },
  {
    name: 'สาย 2 (โซนเกษตร - โรงอาหารกลาง)',
    departureTimes: ['08:30', '09:30', '10:30'],
    stops: [
      { name: 'ป้ายคณะผลิตกรรมการเกษตร', latitude: 18.8905, longitude: 99.0035 },
      { name: 'ป้ายฟาร์มมหาวิทยาลัย', latitude: 18.888, longitude: 99.006 },
      { name: 'ป้ายโรงอาหารกลาง (โดม)', latitude: 18.892, longitude: 99.0015 },
      { name: 'ป้ายอาคารอำนวยการ', latitude: 18.8931, longitude: 99.001 },
    ],
  },
  {
    name: 'สาย 3 (รอบรั้วมหาวิทยาลัย)',
    departureTimes: ['09:00', '11:00', '13:00'],
    stops: [
      { name: 'ประตูหน้ามหาวิทยาลัย', latitude: 18.897, longitude: 98.997 },
      { name: 'ป้ายหน้าคณะบริหารธุรกิจ', latitude: 18.895, longitude: 99.0 },
      { name: 'ป้ายหอพักหญิง', latitude: 18.889, longitude: 99.005 },
    ],
  },
];

async function main(): Promise<void> {
  for (const route of ROUTES) {
    const existing = await prisma.shuttleRoute.findFirst({ where: { name: route.name } });
    if (existing) continue;
    await prisma.shuttleRoute.create({
      data: {
        name: route.name,
        departureTimes: route.departureTimes,
        stops: { create: route.stops.map((stop, index) => ({ ...stop, sequence: index + 1 })) },
      },
    });
  }
  const count = await prisma.shuttleRoute.count();
  console.log(`[seed] done: ${count} shuttle routes`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
