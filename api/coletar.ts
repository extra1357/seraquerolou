import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client';
import { FONTES, coletarFonte } from '../src/scraper';
import { reescreverNoticia } from '../src/groq';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const prisma = new PrismaClient({ adapter } as any);

  const categoria = (req.query.categoria as string) || null;
  const fontesFiltradas = categoria
    ? { [categoria]: FONTES[categoria] || [] }
    : FONTES;

  let totalSalvas = 0;

  try {
    for (const [cat, fontes] of Object.entries(fontesFiltradas)) {
      for (const fonte of fontes) {
        const noticias = await coletarFonte(cat, fonte);
        for (const n of noticias) {
          try {
            const resumo = await reescreverNoticia(n.titulo, n.texto || n.titulo, n.categoria);
            if (!resumo) continue;
            await prisma.noticia.upsert({
              where: { url: n.url },
              update: {},
              create: { titulo: n.titulo, url: n.url, fonte: n.fonte, resumo, categoria: n.categoria },
            });
            totalSalvas++;
          } catch {}
        }
      }
    }
    res.json({ ok: true, salvas: totalSalvas, categoria: categoria || 'todas' });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  } finally {
    await prisma.$disconnect();
  }
}
