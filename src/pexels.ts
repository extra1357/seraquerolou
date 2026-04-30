import axios from 'axios';

const PEXELS_KEY = process.env.PEXELS_API_KEY!;

const KEYWORDS: Record<string, string> = {
  politica:     'brazil politics government',
  celebridades: 'celebrity fashion glamour',
  filmes:       'cinema movie film',
  moda:         'fashion style clothing',
};

export async function buscarFoto(categoria: string): Promise<string | null> {
  try {
    const query = KEYWORDS[categoria] || 'news';
    const { data } = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: PEXELS_KEY },
      params: { query, per_page: 15, orientation: 'landscape' },
      timeout: 8000,
    });
    const fotos = data.photos;
    if (!fotos || fotos.length === 0) return null;
    const random = fotos[Math.floor(Math.random() * fotos.length)];
    return random.src.large;
  } catch {
    return null;
  }
}
