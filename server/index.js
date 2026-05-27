import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Root route to check server status
app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'DeHype Pro API Proxy Server' });
});

// Main analyze route
app.post('/api/analyze', async (req, res) => {
    const { content, title, url, type } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
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
        const groq = new Groq({ apiKey });
        
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
            console.error("Failed to parse JSON from Groq:", rawContent);
            return res.status(502).json({ error: 'Invalid JSON response from Groq API' });
        }

        res.json(resultData);

    } catch (error) {
        console.error('Groq Proxy Error:', error);
        res.status(error.status || 500).json({ 
            error: error.message || 'An error occurred while processing the request' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`DeHype Proxy Server running on http://localhost:${PORT}`);
});
