import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({ mensagem: 'Coleta não disponível em modo serverless.' });
}
