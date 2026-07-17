/**
 * HausPort AI — Main Application Controller
 * Initialises all modules, manages state, handles API communication,
 * and wires up all event listeners.
 */

import {
  addMessage,
  addProductCards,
  addComparisonTable,
  addToolStatus,
  completeToolStatus,
  showTypingIndicator,
  hideTypingIndicator,
  clearChat,
} from './chat.js';

import {
  generateChatId,
  listChats,
  loadChat,
  saveChat,
  deleteChat,
  getActiveChatId,
  setActiveChatId,
  loadSettings,
} from './memory.js';

import {
  handleFileUpload,
  downloadXLSX,
  initDragAndDrop,
  createUploadProgressUI,
} from './file-handler.js';

import { initSettings } from './settings.js';
import { scrollToBottom, initScrollAnimations, animateButtonPress } from './animations.js';

/* ------------------------------------------------------------------
   STATE
   ------------------------------------------------------------------ */

const state = {
  activeChatId: null,
  messages: [],       // { role: 'user'|'bot', content: string, metadata?: object }
  isLoading: false,
};

/* ------------------------------------------------------------------
   DOM REFERENCES
   ------------------------------------------------------------------ */

const $ = (sel) => document.querySelector(sel);
const messageInput = () => $('#messageInput');
const sendBtn = () => $('#sendBtn');
const messagesContainer = () => $('#messagesContainer');

/* ------------------------------------------------------------------
   INITIALISATION
   ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  initSidebar();
  initInput();
  initFileUpload();
  initWelcomeActions();
  initClearChat();
  initDragAndDrop(handleFileDrop);
  initScrollAnimations();
  initTabs();
  loadWeeklyTrends();
  loadLastSession();

  // Görsel yükleme hatalarını yakala ve şık bir placeholder yerleştir
  document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('product-img')) {
      const parent = e.target.parentElement;
      if (parent) {
        parent.innerHTML = `<div class="placeholder-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;
      }
    }
  }, true);
});

/* ------------------------------------------------------------------
   SIDEBAR
   ------------------------------------------------------------------ */

function initSidebar() {
  const sidebar = $('#sidebar');
  const overlay = $('#sidebarOverlay');
  const toggleBtn = $('#sidebarToggleBtn');
  const closeBtn = $('#sidebarCloseBtn');
  const newChatBtn = $('#newChatBtn');

  toggleBtn?.addEventListener('click', () => openSidebar());
  closeBtn?.addEventListener('click', () => closeSidebar());
  overlay?.addEventListener('click', () => closeSidebar());
  newChatBtn?.addEventListener('click', () => {
    startNewChat();
    closeSidebar();
  });

  renderChatHistory();
}

function openSidebar() {
  $('#sidebar')?.classList.add('open');
  $('#sidebarOverlay')?.classList.add('active');
}

function closeSidebar() {
  $('#sidebar')?.classList.remove('open');
  $('#sidebarOverlay')?.classList.remove('active');
}

function renderChatHistory() {
  const list = $('#chatHistoryList');
  if (!list) return;

  const chats = listChats();
  list.innerHTML = '';

  if (chats.length === 0) {
    list.innerHTML = '<li class="chat-history-empty">Henüz sohbet yok</li>';
    return;
  }

  chats.forEach((chat) => {
    const li = document.createElement('li');
    li.className = 'chat-history-item' + (chat.id === state.activeChatId ? ' active' : '');
    li.dataset.chatId = chat.id;

    li.innerHTML = `
      <svg class="chat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="chat-title">${escapeHtml(chat.title || 'Yeni Sohbet')}</span>
      <button class="delete-chat-btn" data-chat-id="${chat.id}" title="Sohbeti sil" aria-label="Sohbeti sil">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    // Click to load chat
    li.addEventListener('click', (e) => {
      if (e.target.closest('.delete-chat-btn')) return;
      loadExistingChat(chat.id);
      closeSidebar();
    });

    // Delete button
    const delBtn = li.querySelector('.delete-chat-btn');
    delBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
      if (state.activeChatId === chat.id) {
        startNewChat();
      }
      renderChatHistory();
    });

    list.appendChild(li);
  });
}

/* ------------------------------------------------------------------
   CHAT SESSION MANAGEMENT
   ------------------------------------------------------------------ */

function startNewChat() {
  state.activeChatId = generateChatId();
  state.messages = [];
  setActiveChatId(state.activeChatId);
  clearChat();
  renderChatHistory();
  
  // Switch to Akıllı Asistan tab automatically
  const tabChatBtn = $('#tabChatBtn');
  if (tabChatBtn && !tabChatBtn.classList.contains('active')) {
    tabChatBtn.click();
  }
  
  messageInput()?.focus();
}

function loadExistingChat(chatId) {
  const chat = loadChat(chatId);
  if (!chat) {
    startNewChat();
    return;
  }

  state.activeChatId = chatId;
  state.messages = chat.messages || [];
  setActiveChatId(chatId);

  // Re-render messages
  clearChat();
  state.messages.forEach((m) => {
    addMessage(m.role, m.content, m.metadata || {});
  });

  renderChatHistory();
  
  // Switch to Akıllı Asistan tab automatically
  const tabChatBtn = $('#tabChatBtn');
  if (tabChatBtn && !tabChatBtn.classList.contains('active')) {
    tabChatBtn.click();
  }

  setTimeout(() => scrollToBottom(messagesContainer(), true), 50);
}

function loadLastSession() {
  const lastId = getActiveChatId();
  if (lastId) {
    const chat = loadChat(lastId);
    if (chat && chat.messages.length > 0) {
      loadExistingChat(lastId);
      return;
    }
  }
  startNewChat();
}

function persistCurrentChat() {
  if (state.activeChatId && state.messages.length > 0) {
    saveChat(state.activeChatId, state.messages);
    renderChatHistory();
  }
}

/* ------------------------------------------------------------------
   INPUT HANDLING
   ------------------------------------------------------------------ */

function initInput() {
  const input = messageInput();
  const btn = sendBtn();
  if (!input || !btn) return;

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    btn.classList.toggle('active', input.value.trim().length > 0);
  });

  // Enter to send (Shift+Enter for newline)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Send button click
  btn.addEventListener('click', () => {
    animateButtonPress(btn);
    handleSend();
  });
}

async function handleSend() {
  const input = messageInput();
  const text = input?.value.trim();
  if (!text || state.isLoading) return;

  // Clear input
  input.value = '';
  input.style.height = 'auto';
  sendBtn()?.classList.remove('active');

  // Add user message
  addMessage('user', text);
  state.messages.push({ role: 'user', content: text });
  persistCurrentChat();

  // Send to API
  await sendToAPI(text);
}

/* ------------------------------------------------------------------
   API COMMUNICATION
   ------------------------------------------------------------------ */

async function sendToAPI(userMessage) {
  state.isLoading = true;
  showTypingIndicator();

  try {
    const settings = loadSettings();
    const body = {
      message: userMessage,
      chatId: state.activeChatId,
      history: state.messages.slice(-20), // send last 20 messages for context
    };

    // Include API keys if set (backend can also use env vars)
    if (settings.apiKeys?.openrouter) {
      body.apiKey = settings.apiKeys.openrouter;
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    hideTypingIndicator();

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || `Sunucu hatası: ${res.status}`);
    }

    const data = await res.json();

    // Handle tool calls / status updates
    if (data.toolCalls && Array.isArray(data.toolCalls)) {
      for (const tool of data.toolCalls) {
        const statusEl = addToolStatus(tool.name, 'running');
        // Simulate a brief delay for UX
        await sleep(600);
        completeToolStatus(statusEl);
      }
    }

    // Handle the reply
    const reply = data.reply || data.message || data.content || '';
    const metadata = {};

    // Extract products
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      metadata.products = data.products;
    }

    // Extract comparison
    if (data.comparison) {
      metadata.comparison = data.comparison;
    }

    // Extract XLSX processing result if tool called successfully
    if (data.toolCalls && Array.isArray(data.toolCalls)) {
      const xlsxTool = data.toolCalls.find(tc => tc.tool === 'process_xlsx_upload' && tc.result);
      if (xlsxTool && xlsxTool.result) {
        try {
          const parsedResult = typeof xlsxTool.result === 'string' ? JSON.parse(xlsxTool.result) : xlsxTool.result;
          if (parsedResult.success && parsedResult.data) {
            metadata.xlsxResult = parsedResult;
          }
        } catch (e) {
          console.error("XLSX tool result parsing error:", e);
        }
      }
    }

    if (reply) {
      addMessage('bot', reply, metadata);
      state.messages.push({ role: 'bot', content: reply, metadata });
      persistCurrentChat();
    }

  } catch (err) {
    hideTypingIndicator();

    // Provide a user-friendly error message
    const isNetworkError = err.message.includes('Failed to fetch') || err.message.includes('NetworkError');
    const errorMessage = isNetworkError
      ? 'Sunucuya bağlanılamadı. Lütfen sunucunun çalıştığından emin olun ve tekrar deneyin.'
      : `Bir hata oluştu: ${err.message}`;

    addMessage('bot', errorMessage);
    state.messages.push({ role: 'bot', content: errorMessage });
    persistCurrentChat();
  } finally {
    state.isLoading = false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------
   FILE UPLOAD
   ------------------------------------------------------------------ */

function initFileUpload() {
  const uploadBtn = $('#fileUploadBtn');
  const fileInput = $('#fileInput');

  uploadBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileUpload(file);
      fileInput.value = ''; // reset
    }
  });
}

async function handleFileDrop(file) {
  await processFileUpload(file);
}

async function processFileUpload(file) {
  if (state.isLoading) return;

  const progress = createUploadProgressUI(file.name);
  addMessage('user', `📎 Dosya yükleniyor: ${file.name}`);
  state.messages.push({ role: 'user', content: `📎 Dosya yükleniyor: ${file.name}` });

  try {
    const result = await handleFileUpload(file, (pct) => {
      progress?.update(pct);
    });

    progress?.complete();

    // Show success and the result
    const replyContent = result.message || result.summary || `"${file.name}" dosyası başarıyla yüklendi ve işlendi.`;
    addMessage('bot', replyContent, result);
    state.messages.push({ role: 'bot', content: replyContent, metadata: result });
    persistCurrentChat();

  } catch (err) {
    progress?.error(err.message);
    addMessage('bot', `❌ ${err.message}`);
    state.messages.push({ role: 'bot', content: `❌ ${err.message}` });
    persistCurrentChat();
  }
}

/* ------------------------------------------------------------------
   WELCOME SCREEN ACTIONS
   ------------------------------------------------------------------ */

function initWelcomeActions() {
  // Feature cards
  document.querySelectorAll('.feature-card[data-action]').forEach((card) => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      if (action) {
        const input = messageInput();
        if (input) {
          input.value = action;
          input.dispatchEvent(new Event('input'));
          handleSend();
        }
      }
    });
  });

  // Quick chips
  document.querySelectorAll('.quick-chip[data-message]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const msg = chip.dataset.message;
      if (msg) {
        const input = messageInput();
        if (input) {
          input.value = msg;
          input.dispatchEvent(new Event('input'));
          handleSend();
        }
      }
    });
  });
}

/* ------------------------------------------------------------------
   CLEAR CHAT
   ------------------------------------------------------------------ */

function initClearChat() {
  $('#clearChatBtn')?.addEventListener('click', () => {
    if (state.messages.length === 0) return;
    startNewChat();
  });
}

/* ------------------------------------------------------------------
   UTILITY
   ------------------------------------------------------------------ */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ------------------------------------------------------------------
   EXPORTS (for potential external use)
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   TAB VIEW NAVIGATION & WEEKLY TRENDS
   ------------------------------------------------------------------ */

function initTabs() {
  const tabTrendsBtn = $('#tabTrendsBtn');
  const tabChatBtn = $('#tabChatBtn');
  const trendsView = $('#trendsView');
  const chatView = $('#chatView');

  tabTrendsBtn?.addEventListener('click', () => {
    tabTrendsBtn.classList.add('active');
    tabChatBtn.classList.remove('active');
    trendsView.classList.add('active');
    chatView.classList.remove('active');
  });

  tabChatBtn?.addEventListener('click', () => {
    tabChatBtn.classList.add('active');
    tabTrendsBtn.classList.remove('active');
    chatView.classList.add('active');
    trendsView.classList.remove('active');
    setTimeout(() => scrollToBottom(messagesContainer(), true), 50);
  });
}

async function loadWeeklyTrends() {
  try {
    const res = await fetch('/api/weekly-trends');
    if (!res.ok) throw new Error('API hatası');
    const data = await res.json();
    
    if (data.updatedAt) {
      const date = new Date(data.updatedAt);
      const formattedDate = date.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const metaDiv = $('#trendsMeta');
      if (metaDiv) {
        metaDiv.textContent = `Son Güncelleme: ${formattedDate} (${data.season === 'yaz' ? 'Yaz ☀️' : data.season === 'ilkbahar' ? 'İlkbahar 🌸' : data.season === 'sonbahar' ? 'Sonbahar 🍂' : 'Kış ❄️'} Sezonu)`;
      }
    }
    
    renderWeeklyTrends(data.products || []);
  } catch (error) {
    console.error('Trendler yüklenirken hata:', error);
    const grid = $('#weeklyTrendsGrid');
    if (grid) {
      grid.innerHTML = '<div class="trends-error">Haftalık trend ürünler şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.</div>';
    }
  }
}

function renderWeeklyTrends(products) {
  const grid = $('#weeklyTrendsGrid');
  if (!grid) return;
  grid.innerHTML = ''; 

  if (!products || !Array.isArray(products) || products.length === 0) {
    grid.innerHTML = '<div class="trends-error">Haftalık trend ürünler bulunamadı. Lütfen daha sonra tekrar deneyin.</div>';
    return;
  }

  products.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageHtml = p.image
      ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title || 'Ürün')}" loading="lazy" class="product-img">`
      : `<div class="placeholder-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;

    const categoryLabel = p.category || 'Trend';
    const priceText = p.priceFormatted || (typeof p.price === 'number' ? p.price.toLocaleString('tr-TR') + ' TL' : (p.price || ''));

    let linksHtml = '<div class="product-card-links">';
    if (p.links) {
      if (p.links.trendyol) linksHtml += `<a class="product-card-link trendyol-btn" href="${escapeHtml(p.links.trendyol)}" target="_blank" rel="noopener">Trendyol</a>`;
      if (p.links.hepsiburada) linksHtml += `<a class="product-card-link hepsiburada-btn" href="${escapeHtml(p.links.hepsiburada)}" target="_blank" rel="noopener">Hepsiburada</a>`;
      if (p.links.pazarama) linksHtml += `<a class="product-card-link pazarama-btn" href="${escapeHtml(p.links.pazarama)}" target="_blank" rel="noopener">Pazarama</a>`;
    }
    linksHtml += '</div>';

    card.innerHTML = `
      <div class="product-card-image">${imageHtml}</div>
      <div class="product-card-body">
        <span class="product-card-site">${escapeHtml(categoryLabel)}</span>
        <h4 class="product-card-title">${escapeHtml(p.title || 'Ürün')}</h4>
        <div class="product-card-price">${escapeHtml(priceText)}</div>
        ${linksHtml}
      </div>
    `;
    grid.appendChild(card);
  });
}

export { state, handleSend as sendMessage, downloadXLSX };
