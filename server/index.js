import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';

dotenv.config();

const PORT = process.env.PORT || 3000;
const SHARED_SECRET = process.env.SHARED_SECRET || '';
const BODY_LIMIT = process.env.BODY_LIMIT || '200kb';
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 60;
// Comma-separated exact origins. Empty means: any chrome-extension:// origin.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

// Fail closed: a missing, placeholder or short secret would leave an open relay to the server's Groq key.
const PLACEHOLDER_SECRET = 'replace_with_a_long_random_string';
if (!SHARED_SECRET || SHARED_SECRET === PLACEHOLDER_SECRET || SHARED_SECRET.length < 32) {
    console.error('SHARED_SECRET must be set to a non-placeholder value of at least 32 characters. Refusing to start.');
    process.exit(1);
}

const app = express();

// Behind a reverse proxy / load balancer, set TRUST_PROXY to the number of proxy hops
// (e.g. 1). Without it every client shares the proxy's IP and one rate-limit bucket.
// Do not set it when the server is exposed directly: X-Forwarded-For would be spoofable.
// Accepted values: "true", "false", an integer hop count, or an Express trust-proxy
// subnet/IP list such as "loopback" or "10.0.0.0/8,127.0.0.1". "true" trusts any
// X-Forwarded-For and makes per-IP limiting spoofable; prefer a hop count.
function parseTrustProxy(raw) {
    const v = String(raw).trim();
    if (v === '' || v.toLowerCase() === 'false') return false;
    if (v.toLowerCase() === 'true') return true;
    if (/^\d+$/.test(v)) return Number(v);
    return v.split(',').map((x) => x.trim()).filter(Boolean);
}
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
}

app.use(cors({
    origin: (origin, cb) => {
        // Non-browser callers send no Origin; the shared secret guards those.
        if (!origin) return cb(null, true);
        if (ALLOWED_ORIGINS.length > 0) return cb(null, ALLOWED_ORIGINS.includes(origin));
        return cb(null, origin.startsWith('chrome-extension://'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-DeHype-Key'],
}));

// Per-IP rate limit, applied before auth so wrong-secret guessing is limited too.
app.use('/api/', rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Try again later.' },
}));

// Shared-secret check (constant-time), applied before the body is parsed.
function requireSharedSecret(req, res, next) {
    // Hash both sides so the comparison is fixed-length (no early exit on length).
    const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
    const ok = crypto.timingSafeEqual(sha(req.get('X-DeHype-Key') || ''), sha(SHARED_SECRET));
    if (!ok) {
        return res.status(401).json({ error: 'Invalid or missing X-DeHype-Key header' });
    }
    next();
}
app.use('/api/', requireSharedSecret);
app.use(express.json({ limit: BODY_LIMIT }));

// Root route to check server status
app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'DeHype Pro API Proxy Server' });
});

// Main analyze route
app.post('/api/analyze', async (req, res) => {
    const { content, title, url, type } = req.body;

    if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
    }
    if ((title !== undefined && typeof title !== 'string') ||
        (url !== undefined && typeof url !== 'string') ||
        (type !== undefined && typeof type !== 'string')) {
        return res.status(400).json({ error: 'title, url and type must be strings' });
    }

    // Determine API key: check Authorization header first, then fallback to environment
    let apiKey = process.env.GROQ_API_KEY;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const customKey = authHeader.substring(7).trim();
        if (customKey) {
            apiKey = customKey;
        }
    }

    if (!apiKey) {
        return res.status(401).json({ 
            error: 'No Groq API Key provided. Set GROQ_API_KEY on the server or provide it in the Authorization header.' 
        });
    }

    try {
        const groq = new Groq({ apiKey, timeout: 30_000, maxRetries: 1 });
        
        let systemPrompt = '';
        let userPrompt = '';

        if (type === 'video') {
            systemPrompt = `You are a YouTube content analysis AI. Analyze the transcript and title of the video and return a structured JSON report.
You must respond with a JSON object matching this schema:
{
  "summary": "A single sentence summary (max 20 words) that reveals the actual answer or core topic. Be dry, objective, and factual. Do not start with 'The video explains' or tease the reader.",
  "clickbait": {
    "score": 45, // integer 0-100 where 0 is honest/factual and 100 is extreme clickbait
    "verdict": "One sentence explaining the clickbait tactics used or why the title is honest."
  },
  "sentiment": {
    "tone": "Neutral", // Neutral, Positive, Negative, Manipulative, Sensational, or Informative
    "analysis": "One sentence explaining emotional tactics, bias, or tone."
  },
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"] // exactly 5 relevant tags
}`;
            userPrompt = `Title: "${title || ''}"\nTranscript: "${content}"`;

        } else if (type === 'page') {
            systemPrompt = `You are a media literacy and content analysis AI. Analyze the page content and title and return a structured JSON report.
You must respond with a JSON object matching this schema:
{
  "summary": "A concise, objective, and factual summary of 3-4 sentences.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"], // exactly 6 tags
  "suggestions": ["insight 1", "insight 2", "insight 3"], // exactly 3 actionable insights/suggestions
  "credibility": {
    "score": 85, // integer 0-100 representing trustworthiness
    "label": "High", // Very Low, Low, Moderate, High, or Very High
    "explanation": "One sentence explaining the credibility score based on sources cited, emotional language, and factual grounding."
  },
  "sentiment": {
    "score": 50, // integer 0-100 where 0 is very negative, 50 is neutral, and 100 is very positive
    "analysis": "One sentence describing the emotional tone, bias, or emotional triggers detected."
  }
}`;
            userPrompt = `Title: "${title || ''}"\nURL: "${url || ''}"\nContent: "${content}"`;

        } else {
            // Default to 'text' analysis
            systemPrompt = `You are an AI text analysis assistant. Analyze the selected text and return a structured JSON report.
You must respond with a JSON object matching this schema:
{
  "summary": "A concise 1-sentence summary.",
  "topic": "Key topic of 1-2 words.",
  "sentiment": "Neutral", // Positive, Negative, or Neutral
  "manipulation": "Brief analysis of any clickbait, bias, or emotional manipulation detected (or 'None')."
}`;
            userPrompt = `Selected Text: "${content}"`;
        }

        const chatCompletion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 800,
            response_format: { type: 'json_object' }
        });

        const rawContent = chatCompletion.choices[0]?.message?.content || '{}';
        
        // Parse the JSON to ensure it is valid before returning
        let resultData;
        try {
            resultData = JSON.parse(rawContent);
        } catch (e) {
            // Do not log rawContent: it is derived from the user's page text.
            console.error('Failed to parse JSON from Groq');
            return res.status(502).json({ error: 'Invalid JSON response from Groq API' });
        }

        res.json(resultData);

    } catch (error) {
        // Log status and message only, never request bodies.
        console.error('Groq Proxy Error:', error.status || 500, error.message);
        // Never send error.message to the client: it can contain internals or upstream detail.
        if (error.status === 429) {
            return res.status(429).json({ error: 'Upstream rate limited' });
        }
        res.status(502).json({ error: 'Upstream error' });
    }
});

// JSON error responses (e.g. 413 for oversized bodies, 400 for malformed JSON).
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        error: status === 413 ? 'Request body too large' : status < 500 ? 'Bad request' : 'Internal server error',
    });
});

app.listen(PORT, () => {
    console.log(`DeHype Proxy Server running on http://localhost:${PORT}`);
});
