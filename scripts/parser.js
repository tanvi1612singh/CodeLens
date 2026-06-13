// ─────────────────────────────────────────────
// parser.js — Converts raw AI text into
//             structured HTML issue cards
//
// The AI returns plain text like:
//   "[Critical] Line 3: SQL injection risk here"
//   "[Warning] Line 8: Plain text password"
//
// This file parses that into clean HTML blocks.
// ─────────────────────────────────────────────

// Normalize severity aliases to our 5 standard levels
function normalizeSev(raw) {
  const s = raw.toLowerCase();
  if (['critical', 'high'].includes(s))                   return 'critical';
  if (['warning', 'major', 'medium'].includes(s))         return 'warning';
  if (['minor', 'suggestion', 'note', 'low'].includes(s)) return 'minor';
  if (['ok', 'good', 'none'].includes(s))                 return 'ok';
  return 'none';
}

// Main parser function
// Input:  raw string from AI API
// Output: { html, critCount, warnCount }
function parseResponse(text) {
  console.log('=== RAW AI RESPONSE ===');
  console.log(text);
  console.log('=======================');

  const lines = text.split('\n');
  const issues = [];
  let current = null;

  // Regex: matches lines starting with [Severity] or **[Severity]**
  // Examples it matches:
  //   "[Critical] Line 3: ..."
  //   "**[Warning]** Line 5: ..."
  //   "[minor] Lines 2-4: ..."
  const issueStartRegex = /^\*{0,2}\[?(critical|warning|major|minor|ok|good|high|medium|low|none|suggestion|note)\]?\*{0,2}[:\s]/i;

  for (const line of lines) {
    const match = line.match(issueStartRegex);

    if (match) {
      // Save previous issue if exists
      if (current) issues.push(current);

      const sev = normalizeSev(match[1]);

      // Extract "Line X" or "Lines X-Y" reference
      const lineRef = line.match(/lines?\s+[\d\-–]+/i);

      // Clean up description: remove severity tag and line reference
      const desc = line
        .replace(issueStartRegex, '')
        .replace(/lines?\s+[\d\-–]+:?\s*/i, '')
        .trim();

      current = { sev, lineRef: lineRef ? lineRef[0] : null, desc };

    } else if (current && line.trim()) {
      // Multi-line issue: append continuation to current issue
      current.desc += ' ' + line.trim();

    } else if (!current && line.trim()) {
      // Intro text before first issue (e.g. "Here's the review:")
      // Show it as a neutral info item
      issues.push({ sev: 'none', lineRef: null, desc: line.trim() });
    }
  }

  // Push the last issue
  if (current) issues.push(current);

  // Fallback: if nothing was parsed, show raw text as-is
  if (issues.length === 0) {
    const fallback = text
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    return {
      html: `<div class="issue-item sev-none" style="border-left:none;background:transparent">
               <div class="issue-desc">${fallback}</div>
             </div>`,
      critCount: 0,
      warnCount: 0
    };
  }

  // Build HTML for each issue
  let critCount = 0, warnCount = 0;
  let itemsHtml = '';

  for (const issue of issues) {
    if (!issue.desc) continue;
    const { sev } = issue;

    // Count for summary bar
    if (sev === 'critical') critCount++;
    if (sev === 'warning' || sev === 'major') warnCount++;

    // Format inline code and bold in description
    const desc = issue.desc
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    itemsHtml += `
      <div class="issue-item sev-${sev}">
        <div class="issue-header">
          <span class="issue-sev-tag tag-${sev}">${sev.toUpperCase()}</span>
          ${issue.lineRef ? `<span class="issue-line">${issue.lineRef}</span>` : ''}
        </div>
        <div class="issue-desc">${desc}</div>
      </div>`;
  }

  // Summary line above issues
  const realIssues = issues.filter(i => i.sev !== 'none').length;
  const summaryHtml = `<div class="result-summary">${realIssues} issue${realIssues !== 1 ? 's' : ''} found</div>`;

  // Severity badges below issues
  let badges = '<div class="severity-row">';
  if (critCount > 0) badges += `<span class="sev-badge sev-critical">● ${critCount} critical</span>`;
  if (warnCount > 0) badges += `<span class="sev-badge sev-warning">● ${warnCount} warnings</span>`;
  if (critCount === 0 && warnCount === 0) badges += `<span class="sev-badge sev-ok">● looks clean</span>`;
  badges += '</div>';

  return {
    html: summaryHtml + `<div class="issues-list">${itemsHtml}</div>` + badges,
    critCount,
    warnCount
  };
}
