const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Backend funcionando',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/ask', (req, res) => {
  const { question } = req.body;
  res.json({ response: `Respuesta a: ${question}` });
});

app.get('/', (req, res) => {
  res.send('<h1>Backend funcionando</h1>');
});

app.listen(PORT, () => {
  console.log('Servidor corriendo en puerto 3000');
});
