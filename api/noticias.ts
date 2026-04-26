import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const prisma = new PrismaClient({ adapter } as any);

  try {
    const take = Number(req.query.take) || 100;
    const noticias = await prisma.noticia.findMany({
      orderBy: { criadoEm: 'desc' },
      take,
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json(noticias);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  } finally {
    await prisma.$disconnect();
  }
}
