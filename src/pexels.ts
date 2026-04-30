import axios from 'axios';

const PEXELS_KEY = process.env.PEXELS_API_KEY!;

function extrairPalavrasChave(titulo: string): string {
  // Remove palavras comuns em português
  const stopwords = ['de','do','da','dos','das','em','no','na','nos','nas','e','o','a','os','as','um','uma','que','por','para','com','se','ao','aos','às','é','foi','são','ser','ter','mais','mas','não','como'];
  return titulo
    .toLowerCase()
    .replace(/[^a-záéíóúãõâêôàü\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.includes(w))
    .slice(0, 3)
    .join(' ');
}

const FALLBACK: Record<string, string> = {
  politica:     'brazil congress government',
  celebridades: 'celebrity red carpet',
  filmes:       'cinema popcorn movie theater',
  moda:         'fashion runway style',
};

export async function buscarFoto(categoria: string, titulo?: string): Promise<string | null> {
  try {
    // Tenta buscar pela query do título primeiro
    const queries = [];
    if (titulo) queries.push(extrairPalavrasChave(titulo));
    queries.push(FALLBACK[categoria] || 'news');

    for (const query of queries) {
      if (!query.trim()) continue;
      const { data } = await axios.get('https://api.pexels.com/v1/search', {
        headers: { Authorization: PEXELS_KEY },
        params: { query, per_page: 10, orientation: 'landscape' },
        timeout: 8000,
      });
      const fotos = data.photos;
      if (fotos && fotos.length > 0) {
        const random = fotos[Math.floor(Math.random() * fotos.length)];
        return random.src.large;
      }
    }
    return null;
  } catch {
    return null;
  }
}
