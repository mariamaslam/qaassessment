/**
 * Converts a handful of markdown docs (test plan, risk matrix, release
 * readiness checklist, Task 2 strategy) to PDF, rendered via headless
 * Chromium rather than round-tripping through Word/LibreOffice (neither is
 * installed here, and Pages.app's own docx->PDF export was found to
 * double-render tables - not something worth shipping).
 *
 * Supports exactly the markdown subset this repo's docs use: headings
 * (#/##/###), bold/italic/inline-code, bullet/numbered lists, GitHub-style
 * task checkboxes (- [ ]), tables, and --- rules. Not a general-purpose
 * markdown parser - keep source docs within that subset (mirrors
 * scripts/md_to_docx.py, which the .docx versions of these same docs use).
 *
 * Usage: node scripts/md_to_pdf.js docs/_src/TEST_PLAN.md docs/_src/RISK_MATRIX.md ...
 * (or just `npm run docs:pdf`, which runs this against docs/_src/*.md and
 * moves the results into docs/). Each output file is written alongside its
 * source, with a .pdf extension.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const INLINE_TOKEN = /(\*\*.+?\*\*|\*[^*]+?\*|`[^`]+?`|\[[^\]]+?\]\([^)]+?\))/;

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function inlineHtml(text) {
  return text
    .split(INLINE_TOKEN)
    .filter(Boolean)
    .map((token) => {
      if (token.startsWith('**') && token.endsWith('**')) return `<strong>${escapeHtml(token.slice(2, -2))}</strong>`;
      if (token.startsWith('*') && token.endsWith('*')) return `<em>${escapeHtml(token.slice(1, -1))}</em>`;
      if (token.startsWith('`') && token.endsWith('`')) return `<code>${escapeHtml(token.slice(1, -1))}</code>`;
      if (token.startsWith('[') && token.includes('](')) {
        const visible = token.slice(1, token.indexOf(']('));
        return escapeHtml(visible);
      }
      return escapeHtml(token);
    })
    .join('');
}

function isTableSeparator(line) {
  line = line.trim();
  if (!line.startsWith('|')) return false;
  const cells = line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
}

function convertBody(markdown) {
  const lines = markdown.split('\n');
  const html = [];
  let titleDone = false;
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    if (line === '---') {
      html.push('<hr/>');
      i++;
      continue;
    }

    // Table: header row, separator row, then data rows.
    if (line.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerCells = line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      i += 2;
      const dataRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        dataRows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        i++;
      }
      html.push('<table>');
      html.push('<thead><tr>' + headerCells.map((c) => `<th>${inlineHtml(c)}</th>`).join('') + '</tr></thead>');
      html.push(
        '<tbody>' +
          dataRows.map((row) => '<tr>' + row.map((c) => `<td>${inlineHtml(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody>',
      );
      html.push('</table>');
      continue;
    }

    // Headings.
    let m = line.match(/^(#{1,3})\s+(.*)$/);
    if (m) {
      const level = m[1].length;
      if (level === 1 && !titleDone) {
        html.push(`<h1 class="doc-title">${inlineHtml(m[2])}</h1>`);
        titleDone = true;
      } else {
        html.push(`<h${level}>${inlineHtml(m[2])}</h${level}>`);
      }
      i++;
      continue;
    }

    // Checkbox list item.
    m = line.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
    if (m) {
      const checked = m[1].toLowerCase() === 'x';
      html.push(`<p class="checkbox">${checked ? '☑' : '☐'} ${inlineHtml(m[2])}</p>`);
      i++;
      continue;
    }

    // Numbered list item - accumulate a run into a single <ol>.
    m = line.match(/^\d+\.\s+(.*)$/);
    if (m) {
      const items = [];
      while (i < lines.length) {
        const im = lines[i].trim().match(/^\d+\.\s+(.*)$/);
        if (!im) break;
        items.push(im[1]);
        i++;
      }
      html.push('<ol>' + items.map((t) => `<li>${inlineHtml(t)}</li>`).join('') + '</ol>');
      continue;
    }

    // Nested bullet (2+ space indent).
    m = raw.match(/^\s{2,}[-*]\s+(.*)$/);
    if (m) {
      html.push(`<li class="nested">${inlineHtml(m[1])}</li>`);
      i++;
      continue;
    }

    // Plain bullet - accumulate a run into a single <ul>.
    m = line.match(/^[-*]\s+(.*)$/);
    if (m) {
      const items = [];
      while (i < lines.length) {
        const t = lines[i];
        const tm = t.trim().match(/^[-*]\s+(.*)$/);
        const nested = t.match(/^\s{2,}[-*]\s+(.*)$/);
        if (nested) {
          items.push({ nested: true, text: nested[1] });
          i++;
          continue;
        }
        if (!tm) break;
        items.push({ nested: false, text: tm[1] });
        i++;
      }
      html.push(
        '<ul>' +
          items
            .map((it) => (it.nested ? `<li class="nested">${inlineHtml(it.text)}</li>` : `<li>${inlineHtml(it.text)}</li>`))
            .join('') +
          '</ul>',
      );
      continue;
    }

    // Plain paragraph.
    html.push(`<p>${inlineHtml(line)}</p>`);
    i++;
  }

  return html.join('\n');
}

function wrapDocument(bodyHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #16202a; font-size: 11px; line-height: 1.5; margin: 0; }
  h1.doc-title { font-size: 22px; color: #0b1f3a; border-bottom: 3px solid #0b5fff; padding-bottom: 10px; margin: 0 0 16px; }
  h2 { font-size: 15px; color: #0b1f3a; border-left: 4px solid #0b5fff; padding-left: 8px; margin: 22px 0 10px; page-break-after: avoid; }
  h3 { font-size: 12.5px; color: #0b1f3a; margin: 16px 0 6px; page-break-after: avoid; }
  p { margin: 0 0 9px; }
  ul, ol { margin: 0 0 10px; padding-left: 20px; }
  li { margin-bottom: 4px; }
  li.nested { list-style-type: circle; margin-left: 14px; }
  p.checkbox { margin: 0 0 6px; padding-left: 2px; }
  code { background: #f2f4f7; padding: 1px 5px; border-radius: 4px; font-family: "Courier New", monospace; font-size: 9.5px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background: #1f3864; color: #fff; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .02em; padding: 6px 8px; }
  td { border-bottom: 1px solid #eaecf0; padding: 6px 8px; font-size: 10px; vertical-align: top; }
  hr { border: none; border-top: 1px solid #d0d5dd; margin: 18px 0; }
  strong { color: #0b1f3a; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

async function convert(mdPath, outPath) {
  const markdown = fs.readFileSync(mdPath, 'utf8');
  const bodyHtml = convertBody(markdown);
  const html = wrapDocument(bodyHtml);

  const tmpHtml = outPath.replace(/\.pdf$/, '.tmp.html');
  fs.writeFileSync(tmpHtml, html);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(tmpHtml));
  await page.pdf({ path: outPath, format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
  await browser.close();
  fs.unlinkSync(tmpHtml);
  console.log(`Wrote ${outPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/md_to_pdf.js <file.md> [file.md ...]');
    process.exit(1);
  }
  for (const arg of args) {
    const outPath = arg.replace(/\.md$/, '.pdf');
    await convert(arg, outPath);
  }
}

main();
