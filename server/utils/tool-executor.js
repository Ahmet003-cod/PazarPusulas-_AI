/**
 * HausPort AI - Araç Yürütücü (Tool Executor)
 * 
 * LLM'in çağırdığı araçları yönlendirir ve çalıştırır
 * Her araç çağrısının sonucunu JSON string olarak döndürür
 */

const { searchProducts } = require('../tools/product-search');
const { comparePrices, findCheapest } = require('../tools/price-compare');
const { getWeather } = require('../tools/weather');
const { getTrends, getLangchainSeasonalTrends } = require('../tools/trend-advisor');
const { getPriceHistoryGraph } = require('../tools/price-graph-analyzer');
const { parseXLSX, processXLSXWithLinks } = require('../tools/xlsx-processor');
const {
  scrapeTrendyol,
  scrapeHepsiburada,
  scrapePazarama,
  scrapeAkakce,
  scrapeCimri
} = require('../tools/platform-scrapers');

/**
 * Araç çağrısını yönlendir ve çalıştır
 * @param {string} toolName - Araç adı
 * @param {Object} args - Araç argümanları
 * @param {Object} context - Bağlam bilgisi (apiKeys, uploadedFiles, userProfile)
 * @returns {string} Araç sonucu (JSON string)
 */
async function executeTool(toolName, args, context) {
  const { apiKeys = {}, uploadedFiles = {}, userProfile = {} } = context || {};
  
  console.log(`🔧 Araç çalıştırılıyor: ${toolName}`, JSON.stringify(args));
  
  try {
    let result;
    
    switch (toolName) {
      // ===== Ürün Arama =====
      case 'search_products': {
        const { query, sites, max_results } = args;
        if (!query) {
          return JSON.stringify({ error: true, message: "Arama sorgusu (query) gerekli." });
        }
        result = await searchProducts(query, sites || [], max_results || 5, apiKeys);
        break;
      }
      
      // ===== Platform Bazlı Özel Aramalar =====
      case 'search_trendyol': {
        const { query, max_results } = args;
        if (!query) return JSON.stringify({ error: true, message: "Arama sorgusu gerekli." });
        result = await scrapeTrendyol(query, max_results || 5);
        break;
      }
      case 'search_hepsiburada': {
        const { query, max_results } = args;
        if (!query) return JSON.stringify({ error: true, message: "Arama sorgusu gerekli." });
        result = await scrapeHepsiburada(query, max_results || 5);
        break;
      }
      case 'search_pazarama': {
        const { query, max_results } = args;
        if (!query) return JSON.stringify({ error: true, message: "Arama sorgusu gerekli." });
        result = await scrapePazarama(query, max_results || 5);
        break;
      }
      case 'search_akakce': {
        const { query, max_results } = args;
        if (!query) return JSON.stringify({ error: true, message: "Arama sorgusu gerekli." });
        result = await scrapeAkakce(query, max_results || 5);
        break;
      }
      case 'search_cimri': {
        const { query, max_results } = args;
        if (!query) return JSON.stringify({ error: true, message: "Arama sorgusu gerekli." });
        result = await scrapeCimri(query, max_results || 5);
        break;
      }
      
      // ===== Fiyat Karşılaştırma =====
      case 'compare_prices': {
        const { product_name } = args;
        if (!product_name) {
          return JSON.stringify({ error: true, message: "Ürün adı (product_name) gerekli." });
        }
        result = await comparePrices(product_name, apiKeys);
        break;
      }
      
      // ===== En Ucuz Ürün Bulma =====
      case 'find_cheapest': {
        const { product_name, quality_keywords } = args;
        if (!product_name) {
          return JSON.stringify({ error: true, message: "Ürün adı (product_name) gerekli." });
        }
        result = await findCheapest(product_name, quality_keywords || '', apiKeys);
        break;
      }
      
      // ===== Hava Durumu =====
      case 'get_weather': {
        const { city } = args;
        if (!city) {
          return JSON.stringify({ error: true, message: "Şehir adı (city) gerekli." });
        }
        result = await getWeather(city);
        break;
      }
      
      // ===== Trend Bilgisi =====
      case 'get_trends': {
        const { season, category, region } = args;
        if (!season || !category) {
          return JSON.stringify({ error: true, message: "Mevsim (season) ve kategori (category) gerekli." });
        }
        result = await getTrends(season, category, region || null);
        break;
      }
      
      case 'get_langchain_seasonal_trends': {
        const { season, gender } = args;
        result = await getLangchainSeasonalTrends(season || null, gender || null);
        break;
      }
      case 'get_price_history_graph': {
        const { product_name, site } = args;
        if (!product_name) {
          return JSON.stringify({ error: true, message: "Ürün adı (product_name) gerekli." });
        }
        result = await getPriceHistoryGraph(product_name, site || null, apiKeys);
        break;
      }
      
      // ===== XLSX Dosya İşleme =====
      case 'process_xlsx_upload': {
        const { file_id, target_site } = args;
        if (!file_id) {
          return JSON.stringify({ error: true, message: "Dosya kimliği (file_id) gerekli." });
        }
        
        // Yüklenen dosyayı bul (uzantılı veya uzantısız arama desteği)
        let filePath = uploadedFiles[file_id];
        if (!filePath) {
          const cleanId = file_id.replace(/\.xlsx?$/i, '');
          filePath = uploadedFiles[cleanId];
        }
        
        if (!filePath) {
          return JSON.stringify({ 
            error: true, 
            message: `"${file_id}" kimlikli dosya bulunamadı. Lütfen önce dosyayı yükleyin.`,
            availableFiles: Object.keys(uploadedFiles)
          });
        }
        
        // Hedef site belirtilmişse linklerle zenginleştir, yoksa sadece parse et
        if (target_site) {
          result = await processXLSXWithLinks(filePath, target_site, apiKeys);
        } else {
          result = await parseXLSX(filePath);
        }
        break;
      }
      
      // ===== Kullanıcı Profili Getir =====
      case 'get_user_profile': {
        result = {
          success: true,
          profile: userProfile || {},
          hasProfile: Object.keys(userProfile || {}).length > 0,
          summary: Object.keys(userProfile || {}).length > 0 
            ? `Kullanıcı profili: ${Object.entries(userProfile).map(([k,v]) => `${k}: ${v}`).join(', ')}`
            : "Henüz kayıtlı kullanıcı profili yok."
        };
        break;
      }
      
      // ===== Kullanıcı Profili Güncelle =====
      case 'update_user_profile': {
        const { field, value } = args;
        if (!field || !value) {
          return JSON.stringify({ error: true, message: "Alan (field) ve değer (value) gerekli." });
        }
        
        // Geçerli alan kontrolü
        const validFields = ['city', 'size', 'style', 'favorite_brands', 'budget', 'gender', 'interests', 'name', 'age'];
        if (!validFields.includes(field)) {
          return JSON.stringify({ 
            error: true, 
            message: `Geçersiz alan: "${field}". Geçerli alanlar: ${validFields.join(', ')}`
          });
        }
        
        // Profili güncelle (context'teki userProfile'ı mutate ediyoruz)
        userProfile[field] = value;
        
        result = {
          success: true,
          field: field,
          value: value,
          updatedProfile: userProfile,
          message: `✅ Profil güncellendi: ${field} = "${value}"`
        };
        break;
      }
      
      // ===== Bilinmeyen Araç =====
      default: {
        result = {
          error: true,
          message: `Bilinmeyen araç: "${toolName}". Bu araç tanımlanmamış.`,
          availableTools: [
            'search_products', 'compare_prices', 'find_cheapest',
            'get_weather', 'get_trends', 'process_xlsx_upload',
            'get_user_profile', 'update_user_profile'
          ]
        };
      }
    }
    
    console.log(`✅ Araç tamamlandı: ${toolName}`);
    return JSON.stringify(result);
    
  } catch (error) {
    console.error(`❌ Araç hatası (${toolName}):`, error.message);
    
    return JSON.stringify({
      error: true,
      tool: toolName,
      message: `Araç çalıştırılırken hata oluştu: ${error.message}`,
      suggestion: "Lütfen daha sonra tekrar deneyin veya farklı parametreler kullanın."
    });
  }
}

module.exports = { executeTool };
