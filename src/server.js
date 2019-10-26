// O server.js faço separado do App, pq qnd eu fizer testes unitários, não
// chegarei a conectar o servidor por porta
import app from './app';

app.listen(3333);
