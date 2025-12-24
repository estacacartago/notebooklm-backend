const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Función para conectar con NotebookLM
async function askNotebookLM(question) {
  let browser;
  try {
    console.log('🚀 Iniciando navegador para NotebookLM...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    console.log('📍 Navegando a NotebookLM...');
    await page.goto('https://notebooklm.google.com/notebook/1bb5a088-974c-41de-a4ff-0a5c4407e67d', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Esperar a que cargue
    await page.waitForTimeout(5000);

    // Buscar campo de pregunta
    console.log('🔍 Buscando campo de pregunta...');
    const selectors = [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="pregunta"]',
      'textarea[placeholder*="question"]',
      'input[type="text"]',
      'textarea',
      '[contenteditable="true"]',
      '[data-testid="question-input"]',
      '.question-input',
      'div[role="textbox"]'
    ];

    let inputFound = false;
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Campo encontrado: ${selector}`);
          
          await element.click();
          await page.waitForTimeout(500);
          
          // Limpiar y escribir
          await page.keyboard.down('Control');
          await page.keyboard.press('a');
          await page.keyboard.up('Control');
          
          await element.type(question, { delay: 100 });
          console.log('✍️ Pregunta escrita:', question);
          
          await page.keyboard.press('Enter');
          inputFound = true;
          break;
        }
      } catch (e) {
        console.log(`❌ Selector ${selector} no funcionó`);
        continue;
      }
    }

    if (!inputFound) {
      throw new Error('No se encontró el campo de pregunta');
    }

    // Esperar respuesta
    console.log('⏳ Esperando respuesta de NotebookLM...');
    await page.waitForTimeout(10000);

    // Buscar respuesta
    console.log('🔍 Buscando respuesta...');
    const responseSelectors = [
      '.response-text',
      '.answer-text',
      '[data-testid="response"]',
      '.markdown-content',
      '.prose',
      '.response-content',
      '.answer',
      '.chat-response',
      '.ai-response',
      '.message-content',
      '.bot-message'
    ];

    let response = 'No se pudo obtener la respuesta de NotebookLM';
    for (const selector of responseSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text && text.trim().length > 20) {
            response = text;
            console.log('✅ Respuesta obtenida:', response.substring(0, 100) + '...');
            break;
          }
        }
      } catch (e) {
        console.log(`❌ Selector de respuesta ${selector} no funcionó`);
        continue;
      }
    }

    await browser.close();
    return response;

  } catch (error) {
    console.error('❌ Error conectando a NotebookLM:', error);
    if (browser) {
      await browser.close();
    }
    return null;
  }
}

// Endpoint de estado
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Backend funcionando',
    notebooklm: 'Listo para conectar',
    timestamp: new Date().toISOString()
  });
});

// Endpoint principal para preguntas
app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;
    console.log('📝 Pregunta recibida:', question);
    
    // Conectar con NotebookLM
    const response = await askNotebookLM(question);
    
    let finalResponse;
    if (response && response !== 'No se pudo obtener la respuesta de NotebookLM') {
      finalResponse = response + '\n\n📚 *Respuesta obtenida directamente de NotebookLM*';
    } else {
      finalResponse = `No se pudo conectar con NotebookLM en este momento. Tu pregunta fue: "${question}".\n\nPor favor:\n1. Intenta más tarde\n2. O visita directamente: https://notebooklm.google.com/notebook/1bb5a088-974c-41de-a4ff-0a5c4407e67d\n\n🤖 *Modo de respaldo*`;
    }
    
    console.log('✅ Respuesta final enviada');
    res.json({ response: finalResponse });
    
  } catch (error) {
    console.error('❌ Error en el endpoint:', error);
    res.status(500).json({ error: 'Error procesando la pregunta' });
  }
});

// Página principal
app.get('/', (req, res) => {
  res.send(`
    <h1>🏛️ Backend Estaca Cartago - NotebookLM Real</h1>
    <p>✅ Servidor funcionando correctamente</p>
    <p>📚 Conexión real con NotebookLM</p>
    <p>🔗 Endpoint: /api/ask</p>
    <p>⏰ Hora: ${new Date().toLocaleString()}</p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
