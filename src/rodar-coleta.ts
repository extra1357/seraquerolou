import { executarColeta } from './coletor';
executarColeta().then(() => {
  console.log('Coleta finalizada!');
  process.exit(0);
}).catch((err) => {
  console.error('Erro na coleta:', err);
  process.exit(1);
});
