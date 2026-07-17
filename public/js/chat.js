/**
 * HausPort AI — Chat UI Module
 * Renders messages, product cards, comparison tables, tool statuses,
 * typing indicator, and handles markdown formatting.
 */

import { animateMessageEntry, scrollToBottom, staggerAnimation } from './animations.js';
import { downloadXLSX } from './file-handler.js';

const messagesContainer = () => document.getElementById('messagesContainer');

/* ------------------------------------------------------------------
   SIMPLE MARKDOWN RENDERER
   ------------------------------------------------------------------ */

function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);
  
  const codeBlocks = [];
  
  // 1. Parse Block Code (```) and store in array
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${code}</code></pre>`);
    return placeholder;
  });
  
  // 2. Parse Inline Code (`) and store in array
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
    codeBlocks.push(`<code>${code}</code>`);
    return placeholder;
  });

  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // Plain URLs
  html = html.replace(/(?<!["\(])(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  // Unordered lists: lines starting with - or *
  html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Ordered lists: lines starting with 1. 2. etc.
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  // wrap consecutive <li> in <ol> if they aren't already in <ul>
  html = html.replace(/(?<!<\/ul>)((?:<li>.*<\/li>\n?)+)/g, (match) => {
    if (match.includes('<ul>')) return match;
    return '<ol>' + match + '</ol>';
  });

  // Line breaks (double newline = paragraph, single = br)
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  // Clean empty <p></p>
  html = html.replace(/<p><\/p>/g, '');

  // 3. Restore Code Blocks
  codeBlocks.forEach((block, index) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${index}__`;
    html = html.replace(placeholder, block);
  });

  return html;
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

/* ------------------------------------------------------------------
   TIME FORMATTER
   ------------------------------------------------------------------ */

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/* ------------------------------------------------------------------
   ADD MESSAGE
   ------------------------------------------------------------------ */

/**
 * @param {'user'|'bot'} role
 * @param {string} content — plain text or markdown
 * @param {Object} [metadata] — optional extra data (products, comparison, etc.)
 * @returns {HTMLElement} the message DOM element
 */
export function addMessage(role, content, metadata = {}) {
  const container = messagesContainer();
  if (!container) return null;

  // Hide welcome screen
  const welcome = document.getElementById('welcomeScreen');
  if (welcome) welcome.classList.add('hidden');

  const msg = document.createElement('div');
  msg.className = `message ${role}-message`;

  const avatarContent =
    role === 'bot'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#F59E0B"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  const renderedContent = role === 'bot' ? renderMarkdown(content) : `<p>${escapeHtml(content)}</p>`;

  msg.innerHTML = `
    <div class="message-avatar">${avatarContent}</div>
    <div class="message-body">
      <div class="message-bubble">${renderedContent}</div>
      <span class="message-time">${formatTime(new Date())}</span>
    </div>
  `;

  container.appendChild(msg);
  animateMessageEntry(msg);
  scrollToBottom(container);

  // Render attached product cards
  if (metadata.products && metadata.products.length > 0) {
    addProductCards(metadata.products, msg);
  }

  // Render comparison table
  if (metadata.comparison) {
    addComparisonTable(metadata.comparison, msg);
  }

  // Render Excel download button
  if (metadata.xlsxResult) {
    addExcelDownloadButton(metadata.xlsxResult, msg);
  }

  return msg;
}

/* ------------------------------------------------------------------
   PRODUCT CARDS
   ------------------------------------------------------------------ */

/**
 * Render a grid of product cards.
 * @param {Array<Object>} products — each has { title, price, image?, link?, site? }
 * @param {HTMLElement} [parentMsg] — append inside the parent message body; if null, append to container
 */
export function addProductCards(products, parentMsg) {
  const grid = document.createElement('div');
  grid.className = 'product-cards-grid';

  products.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageHtml = p.image
      ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title || p.name || 'Ürün')}" loading="lazy" class="product-img">`
      : `<div class="placeholder-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;

    const siteLabel = p.site || (p.category ? p.category : 'Mağaza');
    const priceText = typeof p.price === 'number' ? p.price.toLocaleString('tr-TR') + ' TL' : (p.price || '');
    const linkHref = p.link || '#';

    let linksHtml = '';
    if (p.links && typeof p.links === 'object') {
      linksHtml = '<div class="product-card-links">';
      if (p.links.trendyol) linksHtml += `<a class="product-card-link trendyol-btn" href="${escapeHtml(p.links.trendyol)}" target="_blank" rel="noopener">Trendyol</a>`;
      if (p.links.hepsiburada) linksHtml += `<a class="product-card-link hepsiburada-btn" href="${escapeHtml(p.links.hepsiburada)}" target="_blank" rel="noopener">Hepsiburada</a>`;
      if (p.links.pazarama) linksHtml += `<a class="product-card-link pazarama-btn" href="${escapeHtml(p.links.pazarama)}" target="_blank" rel="noopener">Pazarama</a>`;
      linksHtml += '</div>';
    } else {
      linksHtml = `<a class="product-card-link" href="${escapeHtml(linkHref)}" target="_blank" rel="noopener">Siteye Git →</a>`;
    }

    card.innerHTML = `
      <div class="product-card-image">${imageHtml}</div>
      <div class="product-card-body">
        <span class="product-card-site">${escapeHtml(siteLabel)}</span>
        <h4 class="product-card-title">${escapeHtml(p.title || p.name || 'Ürün')}</h4>
        <div class="product-card-price">${escapeHtml(priceText)}</div>
        ${linksHtml}
      </div>
    `;
    grid.appendChild(card);
  });

  const target = parentMsg ? parentMsg.querySelector('.message-body') : messagesContainer();
  if (target) {
    target.appendChild(grid);
    staggerAnimation(grid.querySelectorAll('.product-card'), 80);
    scrollToBottom(messagesContainer());
  }
}

/* ------------------------------------------------------------------
   COMPARISON TABLE
   ------------------------------------------------------------------ */

/**
 * Render a comparison table.
 * @param {Object} data — { headers: string[], rows: Array<{ cells: string[], isWinner?: boolean }> }
 * @param {HTMLElement} [parentMsg]
 */
export function addComparisonTable(data, parentMsg) {
  if (!data || !data.headers || !data.rows) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'comparison-table-wrapper';

  let headHtml = '<tr>';
  data.headers.forEach((h) => {
    headHtml += `<th>${escapeHtml(h)}</th>`;
  });
  headHtml += '</tr>';

  let bodyHtml = '';
  data.rows.forEach((row) => {
    const winnerClass = row.isWinner ? ' class="winner"' : '';
    bodyHtml += `<tr${winnerClass}>`;
    row.cells.forEach((cell, i) => {
      // Check if this looks like a price column (header contains 'fiyat' or 'price')
      const headerLower = (data.headers[i] || '').toLowerCase();
      const isPrice = headerLower.includes('fiyat') || headerLower.includes('price') || headerLower.includes('ücret');
      // Check if this looks like a site/store column
      const isSite = headerLower.includes('site') || headerLower.includes('mağaza') || headerLower.includes('store');
      // Check if it looks like a link column
      const isLink = headerLower.includes('link') || headerLower.includes('url') || headerLower.includes('bağlantı') || headerLower.includes('detay');

      let cellContent = String(cell);
      let cellClass = '';

      if (isPrice) {
        cellClass = ' class="price-cell"';
        cellContent = escapeHtml(cellContent);
      } else if (isSite) {
        cellContent = `<span class="site-badge">${escapeHtml(cellContent)}</span>`;
      } else if (isLink || cellContent.startsWith('http') || cellContent.includes('](')) {
        // Parse markdown link [Text](URL) or direct URL
        const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/;
        const match = cellContent.match(mdLinkRegex);
        if (match) {
          cellContent = `<a href="${escapeHtml(match[2])}" class="table-link" target="_blank" rel="noopener">${escapeHtml(match[1])}</a>`;
        } else if (cellContent.startsWith('http')) {
          cellContent = `<a href="${escapeHtml(cellContent)}" class="table-link" target="_blank" rel="noopener">Git →</a>`;
        } else {
          cellContent = escapeHtml(cellContent);
        }
      } else {
        cellContent = escapeHtml(cellContent);
      }

      bodyHtml += `<td${cellClass}>${cellContent}</td>`;
    });
    bodyHtml += '</tr>';
  });

  wrapper.innerHTML = `
    <table class="comparison-table">
      <thead>${headHtml}</thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  `;

  const target = parentMsg ? parentMsg.querySelector('.message-body') : messagesContainer();
  if (target) {
    target.appendChild(wrapper);
    scrollToBottom(messagesContainer());
  }
}

/* ------------------------------------------------------------------
   TOOL STATUS
   ------------------------------------------------------------------ */

/**
 * Show a tool-status indicator (e.g. "Ürünler aranıyor…").
 * @param {string} toolName — e.g. 'search_products'
 * @param {'running'|'completed'} status
 * @returns {HTMLElement}
 */
export function addToolStatus(toolName, status = 'running') {
  const container = messagesContainer();
  if (!container) return null;

  const TOOL_LABELS = {
    search_products: '🔍 Ürünler aranıyor…',
    compare_prices: '📊 Fiyatlar karşılaştırılıyor…',
    get_trends: '📈 Trendler analiz ediliyor…',
    process_excel: '📄 Excel dosyası işleniyor…',
    web_search: '🌐 Web araması yapılıyor…',
    analyze: '🧠 Analiz ediliyor…',
  };

  const label = TOOL_LABELS[toolName] || `⚙️ ${toolName}…`;

  const el = document.createElement('div');
  el.className = `tool-status${status === 'completed' ? ' completed' : ''}`;
  el.dataset.tool = toolName;

  el.innerHTML = `
    <div class="tool-status-spinner"></div>
    <span>${label}</span>
  `;

  container.appendChild(el);
  scrollToBottom(container);
  return el;
}

/**
 * Mark a tool status as completed (swap spinner for check).
 * @param {HTMLElement} el
 */
export function completeToolStatus(el) {
  if (!el) return;
  el.classList.add('completed');
  const spinner = el.querySelector('.tool-status-spinner');
  if (spinner) {
    spinner.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    spinner.style.border = 'none';
    spinner.style.animation = 'none';
    spinner.style.width = 'auto';
    spinner.style.height = 'auto';
  }
}

/* ------------------------------------------------------------------
   TYPING INDICATOR
   ------------------------------------------------------------------ */

let typingEl = null;

export function showTypingIndicator() {
  if (typingEl) return;
  const container = messagesContainer();
  if (!container) return;

  typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator';
  typingEl.id = 'typingIndicator';
  typingEl.innerHTML = `
    <div class="message-avatar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#F59E0B"/></svg>
    </div>
    <div class="typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  container.appendChild(typingEl);
  scrollToBottom(container);
}

export function hideTypingIndicator() {
  if (typingEl) {
    typingEl.remove();
    typingEl = null;
  }
}

/* ------------------------------------------------------------------
   CLEAR CHAT
   ------------------------------------------------------------------ */

export function clearChat() {
  const container = messagesContainer();
  if (!container) return;

  // Remove all messages, tool statuses, typing indicators, upload progress
  container.querySelectorAll('.message, .tool-status, .typing-indicator, .upload-progress, .product-cards-grid, .comparison-table-wrapper, .xlsx-download-wrapper').forEach((el) => el.remove());

  // Show welcome screen again
  const welcome = document.getElementById('welcomeScreen');
  if (welcome) welcome.classList.remove('hidden');

  hideTypingIndicator();
}

/**
 * Render a beautiful download button for processed Excel files
 */
export function addExcelDownloadButton(xlsxResult, parentMsg) {
  const btnWrapper = document.createElement('div');
  btnWrapper.className = 'xlsx-download-wrapper';
  
  const infoText = document.createElement('div');
  infoText.className = 'xlsx-download-info';
  infoText.textContent = xlsxResult.summary || 'Dosya başarıyla işlendi.';
  
  const btn = document.createElement('button');
  btn.className = 'xlsx-download-btn';
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    <span>${xlsxResult.fileName ? xlsxResult.fileName.replace(/\.xlsx?$/i, '') : 'dosya'}_linkli.xlsx İndir</span>
  `;
  
  btnWrapper.appendChild(infoText);
  btnWrapper.appendChild(btn);
  
  btn.addEventListener('click', async () => {
    try {
      btn.disabled = true;
      btn.querySelector('span').textContent = 'İndiriliyor...';
      const outputName = xlsxResult.fileName 
        ? xlsxResult.fileName.replace(/\.xlsx?$/i, '') + '_linkli.xlsx'
        : 'pazarpusulasi_linkli.xlsx';
        
      await downloadXLSX(xlsxResult.data, outputName);
      
      btn.disabled = false;
      btn.querySelector('span').textContent = `${xlsxResult.fileName ? xlsxResult.fileName.replace(/\.xlsx?$/i, '') : 'dosya'}_linkli.xlsx İndir`;
    } catch (e) {
      alert('Dosya indirilirken hata oluştu: ' + e.message);
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Tekrar Dene';
    }
  });
  
  const target = parentMsg ? parentMsg.querySelector('.message-body') : messagesContainer();
  if (target) {
    target.appendChild(btnWrapper);
    scrollToBottom(messagesContainer());
  }
}
