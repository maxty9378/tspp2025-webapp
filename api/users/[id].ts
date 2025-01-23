import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        const user = await prisma.user.findUnique({
          where: { id: String(id) }
        });
        return res.json(user);

      case 'PATCH':
        const updatedUser = await prisma.user.update({
          where: { id: String(id) },
          data: req.body
        });
        return res.json(updatedUser);

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