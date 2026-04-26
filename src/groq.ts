import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.GROQ_API_URL!;
const API_KEY = process.env.GROQ_API_KEY!;
const MODEL   = process.env.GROQ_MODEL!;

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function chamarGroq(prompt: string, tentativa = 1): Promise<string | null> {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
        },
        responseEncoding: 'utf8',
      }
    );
    const texto = response.data.choices?.[0]?.message?.content ?? null;
    return texto;
  } catch (err: any) {
    const msg = err.response?.data?.error?.message ?? '';
    const match = msg.match(/try again in ([0-9.]+)s/);
    if (match && tentativa <= 3) {
      const espera = Math.ceil(parseFloat(match[1]) * 1000) + 500;
      console.log(`  Aguardando ${espera}ms (tentativa ${tentativa}/3)`);
      await delay(espera);
      return chamarGroq(prompt, tentativa + 1);
    }
    console.error('Erro Groq:', err.response?.data ?? err.message);
    return null;
  }
}

export async function reescreverNoticia(
  titulo: string,
  texto: string,
  categoria: string
): Promise<string | null> {
  const textoCorto = texto.substring(0, 500);
  const prompt = `Voce e um redator jornalistico brasileiro. Reescreva em 2 paragrafos curtos, linguagem informal, sem copiar frases. Use apenas caracteres UTF-8 validos. Categoria: ${categoria}. Titulo: ${titulo}. Texto: ${textoCorto}`;
  await delay(3000);
  return chamarGroq(prompt);
}
