import "dotenv/config";
import prisma from './prisma';
import { FONTES, coletarFonte } from './scraper';
import { reescreverNoticia } from './groq';
import { buscarFoto } from './pexels';

export async function executarColeta(): Promise<void> {
  console.log('=== Iniciando coleta de noticias ===');
  for (const [categoria, fontes] of Object.entries(FONTES)) {
    for (const fonte of fontes) {
      const noticias = await coletarFonte(categoria, fonte);
      let salvas = 0;
      for (const n of noticias) {
        try {
          const existe = await prisma.noticia.findUnique({ where: { url: n.url } });
          if (existe) continue;
          const resumo = await reescreverNoticia(n.titulo, n.texto || n.titulo, n.categoria);
          if (!resumo) continue;
          const imagemUrl = await buscarFoto(n.categoria);
          await prisma.noticia.upsert({
            where: { url: n.url },
            update: {},
            create: {
              titulo:    n.titulo,
              url:       n.url,
              fonte:     n.fonte,
              resumo,
              categoria: n.categoria,
              imagemUrl,
            },
          });
          salvas++;
        } catch (err: any) {
          console.error(`Erro ao salvar [${n.url}]: ${err.message}`);
        }
      }
      console.log(`[${categoria}] ${fonte.nome}: ${salvas} noticias salvas`);
    }
  }
  console.log('=== Coleta concluida ===');
}
