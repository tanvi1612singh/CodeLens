CodeLens AI — Multi-Model Code Review System
Tech Stack: HTML, CSS, JavaScript, REST APIs

- Built a browser-based tool that analyzes code simultaneously
  using 3 AI models (Groq Llama 3.3, Gemini 2.5, Groq Llama 3.1)
  for security, performance, and readability review

- Implemented parallel API calls using Promise.allSettled(),
  reducing total analysis time by ~66% vs sequential requests

- Designed a custom response parser that converts unstructured
  AI text into structured, color-coded issue cards with
  line-number references and severity classification

- Applied Separation of Concerns architecture — split into
  API layer (api.js), parsing layer (parser.js),
  UI layer (ui.js), and application logic (app.js)
