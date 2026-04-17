const express = require('express');
const redis = require('redis');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Redis Connection ─────────────────────────────────────
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379
  }
});

client.on('error', (err) => console.log('Redis error:', err));
client.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Frontend ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>URL Shortener</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a;
      color: #f0f0f0;
      font-family: monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container { max-width: 600px; width: 100%; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    h1 span { color: #00ff88; }
    p { color: #666; font-size: 0.85rem; margin-bottom: 2rem; }
    .card {
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    input {
      width: 100%;
      background: #0a0a0a;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 0.75rem;
      color: #fff;
      font-family: monospace;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    input:focus { outline: none; border-color: #00ff88; }
    button {
      width: 100%;
      background: #00ff88;
      color: #0a0a0a;
      border: none;
      border-radius: 6px;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 0.85rem;
      font-weight: bold;
      cursor: pointer;
    }
    button:hover { background: #00cc6a; }
    .result {
      background: #0a0a0a;
      border: 1px solid #00ff88;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
      display: none;
    }
    .result p { color: #666; font-size: 0.75rem; margin-bottom: 0.5rem; }
    .result a { color: #00ff88; font-size: 1rem; word-break: break-all; }
    .error {
      color: #ff4444;
      font-size: 0.75rem;
      margin-top: 0.5rem;
      display: none;
    }
    .history { margin-top: 1.5rem; }
    .history h2 { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
    .history-item {
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      font-size: 0.75rem;
    }
    .history-item .short { color: #00ff88; }
    .history-item .original { color: #666; margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    footer { text-align: center; color: #444; font-size: 0.75rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>URL <span>Shortener</span></h1>
    <p>Paste a long URL and get a short one back</p>

    <div class="card">
      <input type="text" id="url-input" placeholder="https://your-long-url.com/goes/here" />
      <button onclick="shorten()">Shorten URL</button>
      <div class="result" id="result">
        <p>Your shortened URL:</p>
        <a id="short-url" href="#" target="_blank"></a>
      </div>
      <div class="error" id="error">Please enter a valid URL</div>
    </div>

    <div class="history" id="history-section" style="display:none">
      <div class="card">
        <h2>Recent URLs</h2>
        <div id="history"></div>
      </div>
    </div>

    <footer>Built with Node.js · Express · Redis · Docker</footer>
  </div>

  <script>
    let history = [];

    async function shorten() {
      const url = document.getElementById('url-input').value.trim();
      const errorEl = document.getElementById('error');
      const resultEl = document.getElementById('result');

      errorEl.style.display = 'none';
      resultEl.style.display = 'none';

      if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        errorEl.style.display = 'block';
        return;
      }

      try {
        const res = await fetch('/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        const data = await res.json();

        if (data.shortUrl) {
          const shortUrlEl = document.getElementById('short-url');
          shortUrlEl.href = data.shortUrl;
          shortUrlEl.textContent = data.shortUrl;
          resultEl.style.display = 'block';

          history.unshift({ short: data.shortUrl, original: url });
          updateHistory();
          document.getElementById('url-input').value = '';
        }
      } catch(e) {
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.style.display = 'block';
      }
    }

    function updateHistory() {
      const historySection = document.getElementById('history-section');
      const historyEl = document.getElementById('history');
      historySection.style.display = 'block';
      historyEl.innerHTML = history.slice(0, 5).map(function(item) {
        return '<div class="history-item">' +
          '<div class="short"><a href="' + item.short + '" target="_blank">' + item.short + '</a></div>' +
          '<div class="original">' + item.original + '</div>' +
          '</div>';
      }).join('');
    }

    document.getElementById('url-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') shorten();
    });
  </script>
</body>
</html>
  `);
});

// ─── Health ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'url-shortener' });
});

// ─── Shorten URL ──────────────────────────────────────────
app.post('/shorten', async (req, res) => {
  const { url } = req.body;

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const id = nanoid(6);
  const shortUrl = `${req.protocol}://${req.get('host')}/${id}`;

  await client.setEx(id, 86400, url);

  res.json({ shortUrl, id });
});

// ─── Redirect ─────────────────────────────────────────────
app.get('/:id', async (req, res) => {
  const { id } = req.params;
  const url = await client.get(id);

  if (!url) {
    return res.status(404).send('URL not found or expired');
  }

  res.redirect(url);
});

// ─── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`URL Shortener running on port ${PORT}`);
});