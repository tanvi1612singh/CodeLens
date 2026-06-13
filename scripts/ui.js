// ─────────────────────────────────────────────
// ui.js — All DOM manipulation functions
//
// These functions update what the user sees
// without containing any business logic.
//
// Rule: this file ONLY touches the DOM.
//       It never calls APIs or parses text.
// ─────────────────────────────────────────────

// Set a card to "analyzing..." loading state
function setCardLoading(type) {
  const card = document.getElementById('card-' + type);
  card.classList.add('active');

  const status = document.getElementById('status-' + type);
  status.className = 'card-status status-loading';
  status.textContent = 'analyzing...';

  document.getElementById('body-' + type).innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-label">Consulting AI model...</div>
    </div>`;
}

// Set a card to show the AI's parsed result
function setCardResult(type, html) {
  const card = document.getElementById('card-' + type);
  card.className = 'model-card done-' + type;

  const status = document.getElementById('status-' + type);
  status.className = 'card-status status-done';
  status.textContent = 'done';

  document.getElementById('body-' + type).innerHTML = html;
}

// Set a card to show an error message
function setCardError(type, msg) {
  const card = document.getElementById('card-' + type);
  card.className = 'model-card';

  const status = document.getElementById('status-' + type);
  status.className = 'card-status status-error';
  status.textContent = 'error';

  document.getElementById('body-' + type).innerHTML = `
    <div class="error-box">⚠ ${msg}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:0.5rem;font-family:var(--mono);">
      Check your API key and try again.
    </div>`;
}

// Reset all 3 cards back to their empty/idle state
function resetCards() {
  ['security', 'performance', 'readability'].forEach(type => {
    const card = document.getElementById('card-' + type);
    card.className = 'model-card';
    card.style.opacity = '1';

    const status = document.getElementById('status-' + type);
    status.className = 'card-status status-idle';
    status.textContent = 'idle';
  });

  document.getElementById('body-security').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🛡️</div>
      <span>Checks for SQL injection, XSS,<br/>auth issues, exposed secrets</span>
    </div>`;

  document.getElementById('body-performance').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🚀</div>
      <span>Checks for O(n²) loops, memory leaks,<br/>unnecessary re-renders, bottlenecks</span>
    </div>`;

  document.getElementById('body-readability').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">✨</div>
      <span>Checks naming, complexity, comments,<br/>best practices, code structure</span>
    </div>`;
}

// Show the summary bar with analysis results
function showSummary(totalIssues, elapsed, lang) {
  document.getElementById('summaryBar').classList.add('visible');
  document.getElementById('issueCount').textContent = totalIssues || '0';
  document.getElementById('analysisTime').textContent = elapsed + 's';
  document.getElementById('langDisplay').textContent = lang.toUpperCase();
}

// Update the character count display
function updateCharCount() {
  const len = document.getElementById('codeInput').value.length;
  document.getElementById('charCount').textContent = len.toLocaleString() + ' characters';
}
