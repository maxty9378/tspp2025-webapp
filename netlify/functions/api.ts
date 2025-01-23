import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;

  try {
    // GET /users
    if (path === '/users' && method === 'GET') {
      const users = await prisma.user.findMany({
        orderBy: { points: 'desc' }
      });
      return {
        statusCode: 200,
        body: JSON.stringify(users)
      };
    }

    // GET /users/:id
    if (path.match(/\/users\/[\w-]+/) && method === 'GET') {
      const id = path.split('/')[2];
      const user = await prisma.user.findUnique({
        where: { id }
      });
      if (!user) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(user)
      };
    }

    // POST /users
    if (path === '/users' && method === 'POST') {
      const data = JSON.parse(event.body || '{}');
      const user = await prisma.user.create({
        data
      });
      return {
        statusCode: 201,
        body: JSON.stringify(user)
      };
    }

    // PATCH /users/:id
    if (path.match(/\/users\/[\w-]+/) && method === 'PATCH') {
      const id = path.split('/')[2];
      const data = JSON.parse(event.body || '{}');
      const user = await prisma.user.update({
        where: { id },
        data
      });
      return {
        statusCode: 200,
        body: JSON.stringify(user)
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};