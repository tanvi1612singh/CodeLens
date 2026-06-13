// ─────────────────────────────────────────────
// app.js — Main application logic
//
// This is the "controller" — it ties everything
// together:
//   - example snippets
//   - reading user input
//   - calling api.js functions
//   - passing results to parser.js
//   - updating UI via ui.js
// ─────────────────────────────────────────────

// ── EXAMPLE CODE SNIPPETS ────────────────────
// These are pre-written buggy code examples
// so users can test the app without their own code
const examples = {
  sql: `// Vulnerable function — can you spot the issue?
function getUserByName(name) {
  const query = "SELECT * FROM users WHERE name = '" + name + "'";
  return db.query(query);
}

function loginUser(username, password) {
  const user = getUserByName(username);
  if (user && user.password === password) {
    return { success: true, token: user.id };
  }
  return { success: false };
}`,

  loop: `// Find all duplicate items in an array
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i !== j && arr[i] === arr[j]) {
        if (!duplicates.includes(arr[i])) {
          duplicates.push(arr[i]);
        }
      }
    }
  }
  return duplicates;
}

const result = findDuplicates([1,2,3,2,4,3,5]);
console.log(result);`,

  auth: `const jwt = require('jsonwebtoken');

function generateToken(userId) {
  return jwt.sign({ id: userId }, 'mysecretkey123', { expiresIn: '30d' });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, 'mysecretkey123');
    return decoded;
  } catch(e) {
    return null;
  }
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    const token = generateToken(1);
    res.json({ token });
  }
});`,

  async: `async function fetchUserData(userId) {
  const user = await fetch('/api/users/' + userId);
  const userData = await user.json();

  const posts = await fetch('/api/posts?userId=' + userId);
  const postsData = await posts.json();

  const comments = await fetch('/api/comments?userId=' + userId);
  const commentsData = await comments.json();

  return {
    user: userData,
    posts: postsData,
    comments: commentsData
  };
}`
};

// Load an example into the textarea
function loadExample(key) {
  document.getElementById('codeInput').value = examples[key];
  updateCharCount();
}

// Clear everything and reset
function clearAll() {
  document.getElementById('codeInput').value = '';
  updateCharCount();
  resetCards();
  document.getElementById('summaryBar').classList.remove('visible');
}

// Wire up the char counter on page load
document.getElementById('codeInput').addEventListener('input', updateCharCount);

// ── MAIN REVIEW FUNCTION ─────────────────────
// This is called when the user clicks "Review"
// It orchestrates: read input → call APIs → parse → show
async function runReview() {
  const code    = document.getElementById('codeInput').value.trim();
  const lang    = document.getElementById('langSelect').value;
  const groqKey1 = document.getElementById('openaiKey').value.trim();  // Security
  const geminiKey = document.getElementById('geminiKey').value.trim(); // Performance
  const groqKey2  = document.getElementById('claudeKey').value.trim(); // Readability

  // Basic validation
  if (!code) {
    alert('Please paste some code first, or click an example snippet!');
    return;
  }
  if (!groqKey1 && !geminiKey && !groqKey2) {
    alert('Please enter at least one API key to get started.');
    return;
  }

  // Reset UI state
  resetCards();
  document.getElementById('summaryBar').classList.remove('visible');
  document.getElementById('reviewBtn').disabled = true;
  document.getElementById('reviewBtn').textContent = '⏳ Analyzing...';

  const startTime = Date.now();

  // Show loading spinners for cards with keys
  if (groqKey1)   setCardLoading('security');
  if (geminiKey)  setCardLoading('performance');
  if (groqKey2)   setCardLoading('readability');

  // ── PARALLEL API CALLS ────────────────────
  // Promise.allSettled() fires all 3 at once.
  // Even if one fails, the others still complete.
  // This is MUCH faster than calling them one by one.
  const [securityResult, perfResult, readResult] = await Promise.allSettled([
    groqKey1  ? callSecurityModel(code, lang, groqKey1)     : Promise.reject(new Error('No API key')),
    geminiKey ? callPerformanceModel(code, lang, geminiKey) : Promise.reject(new Error('No API key')),
    groqKey2  ? callReadabilityModel(code, lang, groqKey2)  : Promise.reject(new Error('No API key'))
  ]);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  let totalIssues = 0;

  // Process each result and update the right card
  function handleResult(result, type) {
    if (result.status === 'fulfilled') {
      const { html, critCount, warnCount } = parseResponse(result.value);
      setCardResult(type, html);
      totalIssues += critCount + warnCount;
    } else {
      const msg = result.reason?.message || 'Unknown error';
      if (msg === 'No API key') {
        // Gracefully dim the card instead of showing an error
        document.getElementById('card-' + type).style.opacity = '0.4';
        document.getElementById('status-' + type).textContent = 'skipped';
      } else {
        setCardError(type, msg);
      }
    }
  }

  handleResult(securityResult, 'security');
  handleResult(perfResult,     'performance');
  handleResult(readResult,     'readability');

  // Update summary bar
  showSummary(totalIssues, elapsed, lang);

  // Re-enable button
  document.getElementById('reviewBtn').disabled = false;
  document.getElementById('reviewBtn').textContent = '⚡ Review with 3 AI Models';
}
