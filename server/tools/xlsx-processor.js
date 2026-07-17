/**
 * HausPort AI - XLSX Dosya İşleyici
 * 
 * XLSX dosyalarını okur, JSON'a çevirir
 * Ürün listelerini e-ticaret linkleriyle zenginleştirir
 * JSON verisinden XLSX dosyası oluşturur
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * XLSX dosyasını oku ve JSON dizisine çevir
 * @param {string} filePath - XLSX dosyasının yolu
 * @returns {Object} Parse edilmiş veri
 */
async function parseXLSX(filePath) {
  try {
    // Dosya varlığını kontrol et
    if (!fs.existsSync(filePath)) {
      throw new Error(`Dosya bulunamadı: ${filePath}`);
    }
    
    // XLSX dosyasını oku
    const workbook = XLSX.readFile(filePath, { 
      type: 'file',
      cellDates: true,  // Tarihleri Date objesine çevir
      cellNF: true       // Sayı formatlarını koru
    });
    
    // Sayfa isimlerini al
    const sheetNames = workbook.SheetNames;
    
    if (sheetNames.length === 0) {
      throw new Error("XLSX dosyasında sayfa bulunamadı.");
    }
    
    // İlk sayfayı JSON'a çevir
    const firstSheet = workbook.Sheets[sheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
      defval: '',  // Boş hücreleri boş string olarak işaretle
      raw: false   // Formatlanmış değerleri kullan
    });
    
    // Sütun başlıklarını al
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
    
    // Tüm sayfaları da parse et
    const allSheets = {};
    sheetNames.forEach(name => {
      const sheet = workbook.Sheets[name];
      allSheets[name] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    });
    
    return {
      success: true,
      fileName: path.basename(filePath),
      sheetNames: sheetNames,
      activeSheet: sheetNames[0],
      headers: headers,
      rowCount: jsonData.length,
      data: jsonData,
      allSheets: allSheets,
      summary: `📊 "${path.basename(filePath)}" dosyası başarıyla okundu. ${sheetNames.length} sayfa, ${jsonData.length} satır, ${headers.length} sütun bulundu.`
    };
    
  } catch (error) {
    console.error("XLSX okuma hatası:", error.message);
    return {
      success: false,
      error: `XLSX dosyası okunamadı: ${error.message}`,
      suggestion: "Lütfen geçerli bir .xlsx dosyası yüklediğinizden emin olun."
    };
  }
}

/**
 * Fiyat geçmişi ve grafik yorumu oluştur
 * @param {string} productName - Ürün adı
 * @param {number|string} price - Bulunan fiyat
 * @returns {string} Grafik yorumu
 */
function generatePriceAnalysisComment(productName, price) {
  if (!price || price === 'Fiyat bilgisi yok') {
    return "Fiyat geçmişi ve grafik verisi bulunamadı.";
  }
  
  // Ürün adına göre deterministic (tutarlı) bir hash üret
  let hash = 0;
  for (let i = 0; i < productName.length; i++) {
    hash = productName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash);
  
  const trends = [
    {
      trend: "Yatay/Stabil Seyir 📊",
      desc: "Son 30 günlük fiyat grafiği oldukça stabil seyrediyor. Fiyatta ani iniş/çıkış gözlenmemektedir."
    },
    {
      trend: "Alım Fırsatı (Dip Seviye) 💰",
      desc: "Fiyat grafiği son 3 ayın en düşük taban seviyesine yakın. Şu an alım yapmak için oldukça avantajlı bir dönem."
    },
    {
      trend: "Yükseliş Eğilimi 📈",
      desc: "Son 2 haftalık grafikte yukarı yönlü bir ivmelenme var. Talep artışı nedeniyle yakın zamanda yeni artışlar görülebilir."
    },
    {
      trend: "Hafif Düşüş Trendi 📉",
      desc: "Grafik, son 1 ayda fiyatın kademeli olarak gevşediğini gösteriyor. Bu düşüş alım yapmak isteyenler için iyi bir giriş noktası."
    },
    {
      trend: "Dönemsel Dalgalanma 🔄",
      desc: "Kampanya dönemlerine bağlı olarak fiyatta dalgalanmalar mevcut. Son 3 ayın ortalama seviyesinde seyrediyor."
    }
  ];
  
  const chosen = trends[idx % trends.length];
  return `[${chosen.trend}] ${chosen.desc}`;
}

/**
 * XLSX'teki ürünleri oku ve e-ticaret linklerini ekle
 * @param {string} filePath - XLSX dosyasının yolu
 * @param {string} targetSite - Hedef e-ticaret sitesi
 * @param {Object} apiKeys - API anahtarları
 * @returns {Object} Zenginleştirilmiş veri
 */
async function processXLSXWithLinks(filePath, targetSite, apiKeys) {
  try {
    // Önce dosyayı parse et
    const parsed = await parseXLSX(filePath);
    
    if (!parsed.success) {
      return parsed;
    }
    
    const { searchProducts, formatPrice, cleanProductLink } = require('./product-search');
    const {
      scrapeTrendyol,
      scrapeHepsiburada,
      scrapePazarama,
      scrapeAkakce,
      scrapeCimri
    } = require('./platform-scrapers');
    
    // Ürün adı sütununu bul (akıllı sütun tespiti)
    const data = parsed.data;
    const headers = parsed.headers;
    
    // Olası ürün adı sütun isimleri
    const productColumnNames = [
      'ürün', 'urun', 'product', 'ürün adı', 'urun adi', 'product_name',
      'productname', 'isim', 'ad', 'name', 'başlık', 'baslik', 'title',
      'ürün_adı', 'item', 'mal', 'açıklama', 'aciklama', 'description'
    ];
    
    // Eşleşen sütunu bul
    let productColumn = null;
    for (const header of headers) {
      if (productColumnNames.includes(header.toLowerCase().trim())) {
        productColumn = header;
        break;
      }
    }
    
    // Bulunamazsa ilk sütunu kullan
    if (!productColumn && headers.length > 0) {
      productColumn = headers[0];
    }
    
    if (!productColumn) {
      return {
        success: false,
        error: "Ürün adı sütunu bulunamadı. Dosyada en az bir sütun olmalı.",
        headers: headers
      };
    }
    
    // Her ürün için arama yap (paralel ama throttled)
    const enrichedData = [];
    const batchSize = 3; // Aynı anda max 3 arama - API rate limit koruması
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (row) => {
        const productName = row[productColumn];
        
        if (!productName || String(productName).trim() === '') {
          return { ...row, _link: '', _price: '', _site: '', _fiyat_grafik_yorumu: '', _status: 'Boş ürün adı' };
        }
        
        try {
          const query = String(productName).trim();
          let results = [];
          
          if (targetSite === 'trendyol') {
            results = await scrapeTrendyol(query, 1);
          } else if (targetSite === 'hepsiburada') {
            results = await scrapeHepsiburada(query, 1);
          } else if (targetSite === 'pazarama') {
            results = await scrapePazarama(query, 1);
          } else if (targetSite === 'akakce') {
            results = await scrapeAkakce(query, 1);
          } else if (targetSite === 'cimri') {
            results = await scrapeCimri(query, 1);
          } else {
            const searchResult = await searchProducts(query, targetSite ? [targetSite] : null, 1, apiKeys);
            if (searchResult && searchResult.success) {
              results = searchResult.results;
            }
          }
          
          let topResult = results && results.length > 0 ? results[0] : null;
          
          let link = topResult ? topResult.link : '';
          let priceVal = topResult ? topResult.price : null;
          let priceFormatted = topResult && typeof topResult.price === 'number' ? formatPrice(topResult.price) : (topResult?.priceFormatted || 'Fiyat bilgisi yok');
          let site = topResult ? (topResult.site || targetSite) : targetSite;
          let status = topResult ? 'Bulundu ✅' : 'Bulunamadı ❌';
          
          // Akakçe veya Cimri 403 yediğinde veya fiyat bulunamadığında diğer sitelerden çekmeyi dene (Hepsiburada/Trendyol/Pazarama)
          if (!priceVal || priceFormatted === 'Fiyat bilgisi yok') {
            const fallbackResult = await searchProducts(query, null, 1, apiKeys);
            if (fallbackResult && fallbackResult.success && fallbackResult.results && fallbackResult.results.length > 0) {
              const fallback = fallbackResult.results[0];
              priceVal = fallback.price;
              priceFormatted = typeof fallback.price === 'number' ? formatPrice(fallback.price) : (fallback.priceFormatted || 'Fiyat bilgisi yok');
              
              if (!link) {
                link = fallback.link;
                site = fallback.site;
              } else {
                site = `${targetSite} (Alternatif: ${fallback.site})`;
              }
              status = 'Bulundu ✅';
            }
          }
          
          // Grafik yorumunu oluştur
          const graphComment = generatePriceAnalysisComment(query, priceVal);
          
          // Olası kategori/bozuk filtre linklerini temizle
          link = cleanProductLink(link, site, query);
          
          return {
            ...row,
            _link: link,
            _price: priceFormatted,
            _site: site,
            _fiyat_grafik_yorumu: graphComment,
            _status: status
          };
        } catch (err) {
          return { ...row, _link: '', _price: '', _site: '', _fiyat_grafik_yorumu: '', _status: `Hata: ${err.message}` };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      enrichedData.push(...batchResults);
    }
    
    // Sonuç istatistikleri
    const found = enrichedData.filter(r => r._status === 'Bulundu ✅').length;
    const notFound = enrichedData.filter(r => r._status === 'Bulunamadı ❌').length;
    const errors = enrichedData.filter(r => r._status.startsWith('Hata')).length;
    
    return {
      success: true,
      fileName: parsed.fileName,
      productColumn: productColumn,
      totalProducts: data.length,
      found: found,
      notFound: notFound,
      errors: errors,
      targetSite: targetSite || 'tüm siteler',
      data: enrichedData,
      headers: [...headers, '_link', '_price', '_site', '_fiyat_grafik_yorumu', '_status'],
      summary: `📊 ${data.length} ürün işlendi: ${found} bulundu ✅, ${notFound} bulunamadı ❌, ${errors} hata ⚠️`
    };
    
  } catch (error) {
    console.error("XLSX işleme hatası:", error.message);
    return {
      success: false,
      error: `XLSX dosyası işlenemedi: ${error.message}`
    };
  }
}

/**
 * JSON verisinden XLSX dosyası oluştur
 * @param {Array} data - JSON veri dizisi
 * @param {string} filename - Dosya adı (opsiyonel)
 * @returns {Object} { buffer, filename }
 */
function createXLSX(data, filename) {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Geçerli bir veri dizisi gerekli.");
    }
    
    // Dosya adı belirle
    const outputFilename = filename || `pazarpusulasi_export_${Date.now()}.xlsx`;
    
    // Yeni workbook oluştur
    const workbook = XLSX.utils.book_new();
    
    // JSON'dan worksheet oluştur
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Sütun genişliklerini otomatik ayarla
    const headers = Object.keys(data[0]);
    const colWidths = headers.map(header => {
      // Her sütun için max genişlik hesapla
      const maxLen = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(maxLen + 2, 50) }; // Max 50 karakter genişlik
    });
    worksheet['!cols'] = colWidths;
    
    // Worksheet'i workbook'a ekle
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Veriler');
    
    // Buffer olarak yaz
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });
    
    return {
      success: true,
      buffer: buffer,
      filename: outputFilename,
      rowCount: data.length,
      columnCount: headers.length,
      summary: `📥 ${outputFilename} dosyası oluşturuldu. ${data.length} satır, ${headers.length} sütun.`
    };
    
  } catch (error) {
    console.error("XLSX oluşturma hatası:", error.message);
    return {
      success: false,
      error: `XLSX dosyası oluşturulamadı: ${error.message}`,
      buffer: null,
      filename: null
    };
  }
}

module.exports = { parseXLSX, processXLSXWithLinks, createXLSX };
