import axios from 'axios';
import * as xml2js from 'xml2js';
import * as iconv from 'iconv-lite';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; AgenciaBot/1.0)',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

export interface NoticiaRaw {
  titulo: string;
  url: string;
  fonte: string;
  categoria: string;
  texto: string;
}

interface Fonte {
  url: string;
  nome: string;
}

export const FONTES: Record<string, Fonte[]> = {
  politica: [
    { url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml', nome: 'Agencia Brasil' },
    { url: 'https://g1.globo.com/rss/g1/politica/',                  nome: 'G1' },
    { url: 'https://feeds.folha.uol.com.br/poder/rss091.xml',        nome: 'Folha de S.Paulo' },
  ],
  'senado-camara-stf': [
    { url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml', nome: 'Agencia Brasil' },
    { url: 'https://feeds.folha.uol.com.br/poder/rss091.xml',        nome: 'Folha de S.Paulo' },
  ],
  celebridades: [
    { url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',    nome: 'Folha Ilustrada' },
    { url: 'https://papelpop.com/feed/',                              nome: 'PapelPop' },
  ],
  entretenimento: [
    { url: 'https://papelpop.com/feed/',                              nome: 'PapelPop' },
    { url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',    nome: 'Folha Ilustrada' },
  ],
  filmes: [
    { url: 'https://cinepop.com.br/feed/',                            nome: 'CinePOP' },
    { url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml',    nome: 'Folha Ilustrada' },
  ],
  moda: [
    { url: 'https://feeds.folha.uol.com.br/equilibrioesaude/rss091.xml', nome: 'Folha Equilíbrio' },
    { url: 'https://papelpop.com/feed/',                              nome: 'PapelPop' },
  ],
};

function toString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if (val._) return String(val._);
    if (val.__) return String(val.__);
  }
  return String(val);
}

function limparTexto(str: string): string {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_,c) => String.fromCodePoint(parseInt(c)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_,c) => String.fromCodePoint(parseInt(c,16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function detectarEncoding(buffer: Buffer): string {
  const head = buffer.slice(0, 200).toString('latin1');
  const match = head.match(/encoding=["']([^"']+)["']/i);
  return match ? match[1].toUpperCase() : 'UTF-8';
}

async function parseRSS(buffer: Buffer): Promise<{ titulo: string; url: string; texto: string }[]> {
  const encoding = detectarEncoding(buffer);
  const xml = (encoding === 'ISO-8859-1' || encoding === 'LATIN1' || encoding === 'ISO-8859-15')
    ? iconv.decode(buffer, 'iso-8859-1')
    : buffer.toString('utf8');

  const result = await xml2js.parseStringPromise(xml, {
    explicitArray: false,
    ignoreAttrs: false,
  });

  const itens = result?.rss?.channel?.item ?? result?.feed?.entry ?? [];
  const lista = Array.isArray(itens) ? itens : [itens];

  return lista.slice(0, 8).map((item: any) => {
    const titulo = limparTexto(toString(item.title));
    const urlRaw = item.link?.$ ? item.link.$['href'] : (item.link ?? item.guid?._ ?? item.guid ?? '');
    const url    = toString(urlRaw).trim();
    const texto  = limparTexto(toString(
      item['content:encoded'] ?? item.description ?? item.summary ?? ''
    )).substring(0, 1200);
    return { titulo, url, texto };
  }).filter(n => n.titulo.length > 5 && n.url.startsWith('http'));
}

export async function coletarFonte(
  categoria: string,
  fonte: Fonte
): Promise<NoticiaRaw[]> {
  try {
    const { data } = await axios.get(fonte.url, {
      headers: HEADERS,
      timeout: 12000,
      responseType: 'arraybuffer',
    });
    const itens = await parseRSS(Buffer.from(data));
    console.log(`  -> ${fonte.nome} (${categoria}): ${itens.length} itens no RSS`);
    return itens.map(n => ({ ...n, fonte: fonte.nome, categoria }));
  } catch (err: any) {
    console.error(`Erro RSS ${fonte.nome}: ${err.message}`);
    return [];
  }
}
