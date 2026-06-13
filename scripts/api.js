// ─────────────────────────────────────────────
// api.js — All AI API call functions
//
// Each function:
//   1. Takes (code, lang, apiKey) as arguments
//   2. Sends the code to an AI model
//   3. Returns the AI's response as a plain string
//
// Why 3 separate functions?
//   Each provider has a different API format.
//   Keeping them separate makes it easy to swap
//   one model for another without touching other files.
// ─────────────────────────────────────────────

// Helper: adds line numbers to code before sending
// e.g. "const x = 1" becomes "1: const x = 1"
// This lets the AI say "Line 3 has an issue"
function addLineNumbers(code) {
  return code.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n');
}

// ── SECURITY: Groq (Llama 3.3 70B) ──────────
// Groq uses the same API format as OpenAI,
// just a different URL and model name.
// This is called an "OpenAI-compatible API".
async function callSecurityModel(code, lang, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `You are a security expert reviewing ${lang} code. Be concise.
Find: SQL injection, XSS, hardcoded secrets, auth issues, input validation problems, exposed data.
IMPORTANT: For every issue, mention the exact line number like "Line 3:" or "Lines 3-5:".
Format each issue on its own line as: [Severity] Line X: description.
Severity must be one of: [Critical] [Warning] [Minor] [OK].
Max 400 words. Always complete your sentences.`
        },
        {
          role: 'user',
          content: `Review this code for security issues:\n\n${addLineNumbers(code)}`
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`Groq Security API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// ── PERFORMANCE: Gemini 2.5 Flash ────────────
// Google's API has a different structure —
// it uses "contents" and "parts" instead of "messages".
async function callPerformanceModel(code, lang, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a performance expert reviewing ${lang} code. Be concise.
Find: O(n²) or worse loops, memory leaks, redundant operations, blocking calls, unoptimized queries.
IMPORTANT: For every issue, mention the exact line number like "Line 3:" or "Lines 3-5:".
Format each issue on its own line as: [Severity] Line X: description.
Severity must be one of: [Critical] [Warning] [Minor] [OK].
Max 400 words. Always complete your sentences.

Review this code:

${addLineNumbers(code)}`
          }]
        }],
        generationConfig: { maxOutputTokens: 1200 }
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ── READABILITY: Groq (Llama 3.1 8B) ─────────
// Same API format as Security (both are Groq),
// but using a smaller/faster model since
// readability checks are simpler than security analysis.
async function callReadabilityModel(code, lang, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `You are a code quality expert reviewing ${lang} code. Be concise.
Check: variable naming, function length, code duplication, comments quality, complexity, best practices.
IMPORTANT: For every issue, mention the exact line number like "Line 3:" or "Lines 3-5:".
Format each issue on its own line as: [Severity] Line X: description.
Severity must be one of: [Critical] [Warning] [Minor] [OK].
Max 400 words. Always complete your sentences.`
        },
        {
          role: 'user',
          content: `Review this code for readability and style:\n\n${addLineNumbers(code)}`
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`Groq Readability API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}
