import "dotenv/config";
import prisma from './prisma';
import { FONTES, coletarFonte } from './scraper';
import { reescreverNoticia } from './groq';

export async function executarColeta(): Promise<void> {
  console.log('=== Iniciando coleta de notícias ===');
  for (const [categoria, fontes] of Object.entries(FONTES)) {
    for (const fonte of fontes) {
      const noticias = await coletarFonte(categoria, fonte);
      let salvas = 0;
      for (const n of noticias) {
        const existe = await prisma.noticia.findUnique({ where: { url: n.url } });
        if (existe) continue;
        const resumo = await reescreverNoticia(n.titulo, n.texto || n.titulo, n.categoria);
        if (!resumo) continue;
        await prisma.noticia.create({
          data: {
            titulo:    n.titulo,
            url:       n.url,
            fonte:     n.fonte,
            resumo,
            categoria: n.categoria,
          },
        });
        salvas++;
      }
      console.log(`[${categoria}] ${fonte.nome}: ${salvas} notícias salvas`);
    }
  }
  console.log('=== Coleta concluída ===');
}
