/**
 * HausPort AI - Express Sunucu
 * 
 * Ana sunucu dosyası - API endpoint'leri ve statik dosya servisi
 * Port: env PORT veya 3000
 */

// Çevre değişkenlerini yükle
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { processChat } = require('./llm-engine');
const { getOrUpdateWeeklyTrends } = require('./tools/weekly-trends-builder');
const { parseXLSX, createXLSX } = require('./tools/xlsx-processor');

// ===== Express Uygulaması =====
const app = express();
const PORT = process.env.PORT || 3000;

// ===== Uploads Klasörü =====
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Uploads klasörü oluşturuldu:', UPLOADS_DIR);
}

// ===== Middleware =====

// CORS - tüm originlere izin ver (geliştirme ortamı için)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'X-OpenRouter-Key', 
    'X-OpenAI-Key', 
    'X-Gemini-Key', 
    'X-Groq-Key', 
    'X-Google-CSE-Key', 
    'X-Google-CSE-ID'
  ]
}));

// JSON body parser (10MB limit - büyük konuşma geçmişleri için)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statik dosya servisi - ../public/ klasöründen
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
console.log('📂 Statik dosya dizini:', publicDir);

// ===== Multer Konfigürasyonu (Dosya Yükleme) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Sadece XLSX ve XLS dosyalarına izin ver
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream'  // Bazı tarayıcılar bu MIME type'ı gönderir
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype} (${ext}). Sadece .xlsx ve .xls dosyaları kabul edilir.`));
    }
  }
});

// Yüklenen dosyaları takip et (memory store - production'da Redis/DB kullanılmalı)
const uploadedFilesStore = {};

// ===== Request'ten API Anahtarlarını Çıkar =====
function extractApiKeys(req) {
  return {
    openRouterKey: req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY || '',
    openAiKey: req.headers['x-openai-key'] || process.env.OPENAI_API_KEY || '',
    geminiKey: req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || '',
    groqKey: req.headers['x-groq-key'] || process.env.GROQ_API_KEY || '',
    googleCseKey: req.headers['x-google-cse-key'] || process.env.GOOGLE_CSE_API_KEY || '',
    googleCseId: req.headers['x-google-cse-id'] || process.env.GOOGLE_CSE_ID || '',
    uploadedFiles: uploadedFilesStore
  };
}

// ===== API Endpoint'leri =====

/**
 * GET /api/health - Sağlık kontrolü
 */
app.get('/api/health', (req, res) => {
  const apiKeys = extractApiKeys(req);
  
  res.json({
    status: 'ok',
    service: 'PazarPusulası AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform
    },
    apiKeys: {
      openRouter: apiKeys.openRouterKey ? 'configured ✅' : 'not set ❌',
      openAi: apiKeys.openAiKey ? 'configured ✅' : 'not set ❌',
      gemini: apiKeys.geminiKey ? 'configured ✅' : 'not set ❌',
      groq: apiKeys.groqKey ? 'configured ✅' : 'not set ❌',
      googleCse: apiKeys.googleCseKey ? 'configured ✅' : 'not set ❌',
      googleCseId: apiKeys.googleCseId ? 'configured ✅' : 'not set ❌'
    },
    uploadedFiles: Object.keys(uploadedFilesStore).length,
    message: '🛍️ PazarPusulası AI çalışıyor!'
  });
});

/**
 * POST /api/chat - Sohbet endpoint'i
 * Body: { message: string, history: Array, userProfile: Object }
 * Returns: { reply: string, updatedProfile: Object, toolCalls: Array }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, userProfile } = req.body;
    
    // Mesaj kontrolü
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: true,
        message: 'Mesaj (message) alanı gerekli ve boş olamaz.'
      });
    }
    
    console.log(`\n💬 Yeni mesaj: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
    
    // API anahtarlarını çıkar
    const apiKeys = extractApiKeys(req);
    
    // LLM motorunu çalıştır
    const result = await processChat(
      message.trim(),
      history || [],
      userProfile || {},
      apiKeys
    );
    
    console.log(`✅ Yanıt üretildi (${result.toolCalls?.length || 0} araç çağrısı)`);
    
    // Zengin kartlar ve tablolar için toolCalls'tan metadata ayıkla
    let products = [];
    let comparison = null;
    
    if (result.toolCalls && Array.isArray(result.toolCalls)) {
      for (const tc of result.toolCalls) {
        const tcResult = tc.result;
        if (!tcResult) continue;
        
        // 1. Ürün arama sonuçları
        if (tc.tool === 'search_products') {
          if (tcResult.success && Array.isArray(tcResult.results)) {
            products.push(...tcResult.results);
          }
        } else if (tc.tool === 'get_langchain_seasonal_trends') {
          if (tcResult.success && Array.isArray(tcResult.products)) {
            products.push(...tcResult.products);
          }
        } else if (['search_trendyol', 'search_hepsiburada', 'search_pazarama', 'search_akakce', 'search_cimri'].includes(tc.tool)) {
          if (Array.isArray(tcResult)) {
            products.push(...tcResult);
          }
        }
        
        // 2. Fiyat karşılaştırma sonuçları
        if (tc.tool === 'compare_prices' || tc.tool === 'find_cheapest') {
          if (tcResult.products && Array.isArray(tcResult.products)) {
            products.push(...tcResult.products);
          }
          if (tcResult.comparison) {
            comparison = tcResult.comparison;
          }
        }
      }
    }

    // Yanıtı döndür
    res.json({
      success: true,
      reply: result.reply,
      updatedProfile: result.updatedProfile || {},
      toolCalls: result.toolCalls || [],
      products: products.length > 0 ? products : null,
      comparison: comparison,
      model: result.model || 'unknown',
      usage: result.usage || null,
      isDemo: result.isDemo || false
    });
    
  } catch (error) {
    console.error('❌ Chat endpoint hatası:', error);
    
    res.status(500).json({
      success: false,
      error: true,
      reply: 'Üzgünüm, sunucu tarafında bir hata oluştu. Lütfen daha sonra tekrar deneyin. 😔',
      message: error.message
    });
  }
});

/**
 * POST /api/upload - XLSX dosya yükleme
 * Multipart form data ile dosya yüklenir
 * Returns: { fileId, fileName, data, headers, rowCount }
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    // Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'Dosya yüklenmedi. Lütfen bir .xlsx dosyası seçin.'
      });
    }
    
    console.log(`📤 Dosya yüklendi: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
    
    const filePath = req.file.path;
    const fileId = path.basename(filePath, path.extname(filePath));
    
    // Dosyayı store'a kaydet (tool executor'ın erişebilmesi için)
    uploadedFilesStore[fileId] = filePath;
    
    // XLSX dosyasını parse et
    const parsed = await parseXLSX(filePath);
    
    if (!parsed.success) {
      return res.status(400).json({
        error: true,
        message: parsed.error
      });
    }
    
    res.json({
      success: true,
      fileId: fileId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      data: parsed.data,
      headers: parsed.headers,
      rowCount: parsed.rowCount,
      sheetNames: parsed.sheetNames,
      summary: parsed.summary
    });
    
  } catch (error) {
    console.error('❌ Upload endpoint hatası:', error);
    
    // Multer hataları için özel mesajlar
    if (error.message && error.message.includes('Desteklenmeyen dosya türü')) {
      return res.status(400).json({
        error: true,
        message: error.message
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: true,
        message: 'Dosya boyutu çok büyük! Maksimum 10 MB dosya yüklenebilir.'
      });
    }
    
    res.status(500).json({
      error: true,
      message: `Dosya yüklenirken hata oluştu: ${error.message}`
    });
  }
});

/**
 * POST /api/download - JSON verisinden XLSX dosya indirme
 * Body: { data: Array, filename: string }
 * Returns: XLSX dosyası (binary)
 */
app.post('/api/download', (req, res) => {
  try {
    const { data, filename } = req.body;
    
    // Veri kontrolü
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Geçerli bir veri dizisi (data) gerekli. Boş dizi gönderilemez.'
      });
    }
    
    console.log(`📥 XLSX oluşturuluyor: ${data.length} satır`);
    
    // XLSX oluştur
    const result = createXLSX(data, filename);
    
    if (!result.success) {
      return res.status(500).json({
        error: true,
        message: result.error
      });
    }
    
    // Dosyayı indir olarak gönder
    const outputFilename = result.filename || 'hausport_export.xlsx';
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Length', result.buffer.length);
    
    res.send(result.buffer);
    
    console.log(`✅ XLSX gönderildi: ${outputFilename} (${result.rowCount} satır, ${result.columnCount} sütun)`);
    
  } catch (error) {
    console.error('❌ Download endpoint hatası:', error);
    
    res.status(500).json({
      error: true,
      message: `XLSX dosyası oluşturulurken hata oluştu: ${error.message}`
    });
  }
});

/**
 * GET /api/weekly-trends - Haftalık popüler 25 trend ürünü dönen endpoint
 */
app.get('/api/weekly-trends', async (req, res) => {
  try {
    const trends = await getOrUpdateWeeklyTrends();
    res.json(trends);
  } catch (error) {
    console.error('❌ Weekly trends hatası:', error);
    res.status(500).json({
      error: true,
      message: `Haftalık trendler alınırken hata oluştu: ${error.message}`
    });
  }
});

// ===== Multer Hata Yakalama Middleware =====
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: true,
        message: 'Dosya boyutu çok büyük! Maksimum 10 MB.'
      });
    }
    return res.status(400).json({
      error: true,
      message: `Dosya yükleme hatası: ${err.message}`
    });
  }
  
  if (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({
      error: true,
      message: `Sunucu hatası: ${err.message}`
    });
  }
  
  next();
});

// ===== SPA Fallback - Bilinmeyen route'lar için index.html döndür =====
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: true,
      message: 'Sayfa bulunamadı. public/index.html dosyası eksik olabilir.'
    });
  }
});

// ===== Sunucuyu Başlat =====
app.listen(PORT, () => {
  const apiKeys = {
    openRouter: process.env.OPENROUTER_API_KEY,
    openAi: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY
  };
  const isAnyKeyConfigured = Object.values(apiKeys).some(Boolean);
  
  console.log(`
╔══════════════════════════════════════════════╗
║     🛍️  PazarPusulası AI Sunucusu  🛍️        ║
╠══════════════════════════════════════════════╣
║  Adres:  http://localhost:${PORT}               ║
║  Durum:  Çalışıyor ✅                        ║
║  Mod:    ${isAnyKeyConfigured ? 'Tam Özellik ✨' : 'Demo Modu ⚠️ '}                       ║
╚══════════════════════════════════════════════╝

📌 API Endpoint'leri:
   POST /api/chat     - Sohbet
   POST /api/upload   - XLSX Yükleme
   POST /api/download - XLSX İndirme
   GET  /api/health   - Sağlık Kontrolü

${!isAnyKeyConfigured ? '⚠️  Herhangi bir LLM API anahtarı ayarlanmamış. Demo modda çalışılıyor.\n   .env dosyasına OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY veya OPENROUTER_API_KEY ekleyin.\n' : '✅ Yapay zeka API anahtarı başarıyla algılandı. Aktif modda çalışıyor!\n'}
  `);
});

module.exports = app;
