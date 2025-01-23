import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET':
        const users = await prisma.user.findMany({
          orderBy: { points: 'desc' }
        });
        return res.json(users);

      case 'POST':
        const newUser = await prisma.user.create({
          data: req.body
        });
        return res.json(newUser);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Error processing request' });
  } finally {
    await prisma.$disconnect();
  }
}