import "dotenv/config";
import express from 'express';
import path from 'path';
import prisma from './prisma';
import { executarColeta } from './coletor';

const app = express();
const PORT = process.env.PORT ?? 3000;
const INTERVALO = Number(process.env.COLETA_INTERVALO_MS ?? 3600000);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/noticias', async (_req, res) => {
  try {
    const noticias = await prisma.noticia.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 20,
    });
    res.json(noticias);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar notícias' });
  }
});

app.get('/api/noticias/:categoria', async (req, res) => {
  try {
    const noticias = await prisma.noticia.findMany({
      where:   { categoria: req.params.categoria },
      orderBy: { criadoEm: 'desc' },
    });
    res.json(noticias);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar categoria' });
  }
});

app.post('/api/coletar', async (_req, res) => {
  res.json({ mensagem: 'Coleta iniciada!' });
  executarColeta();
});

setInterval(() => executarColeta(), INTERVALO);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  executarColeta();
});
