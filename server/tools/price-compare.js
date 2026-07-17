/**
 * HausPort AI - Fiyat Karşılaştırma Servisi
 * 
 * Farklı e-ticaret siteleri arasında fiyat karşılaştırması yapar
 * En ucuz ürünleri bulur, alakasız aksesuarları eler ve kalite/fiyat analiz raporu sunar
 */

const { searchProducts, formatPrice } = require('./product-search');

// Karşılaştırma yapılacak ana siteler
const COMPARISON_SITES = ["hepsiburada", "trendyol", "cimri", "akakce", "pazarama"];

/**
 * Arama sonuçlarını temizle ve alakasız ürünleri (aksesuar vb.) filtrele
 */
function filterResults(query, results) {
  if (!results || !Array.isArray(results)) return [];
  
  const queryLower = query.toLowerCase();
  // Kısa kelimeleri ele
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Negatif kelimeler (kullanıcı aramıyorsa elenecek aksesuarlar vb.)
  const defaultNegatives = [
    'kılıf', 'kap', 'ekran koruyucu', 'cam', 'kablo', 'adaptör', 'şarj', 'askı', 
    'çanta', 'aksesuar', 'yedek', 'kulaklık ucu', 'temizleme', 'maketi', 'oyuncak',
    'kordon', 'bant', 'kılıfı', 'koruyucu film', 'şarj cihazı'
  ];
  
  // Kullanıcı aramasında geçen negatif kelimeleri muaf tut
  const activeNegatives = defaultNegatives.filter(neg => !queryLower.includes(neg));
  
  return results.filter(item => {
    const titleLower = item.title.toLowerCase();
    
    // 1. Negatif kelime filtresi
    for (const neg of activeNegatives) {
      if (titleLower.includes(neg)) {
        return false;
      }
    }
    
    // 2. Kelime eşleşme oranı (Relevance Score)
    if (queryWords.length > 0) {
      let matchedWords = 0;
      for (const word of queryWords) {
        if (titleLower.includes(word)) {
          matchedWords++;
        }
      }
      // Sorgudaki kelimelerin en az %50'si başlıkta geçmeli (böylece alakasız ürünler elenir)
      const matchRatio = matchedWords / queryWords.length;
      if (matchRatio < 0.5) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Ürün fiyatlarını analiz et ve en ucuz, en pahalı ve mağaza farklarını belirle
 */
function analyzePriceComparison(query, pricedResults) {
  if (pricedResults.length === 0) return null;
  
  const cheapest = pricedResults[0];
  const mostExpensive = pricedResults[pricedResults.length - 1];
  const averagePrice = pricedResults.reduce((acc, curr) => acc + curr.price, 0) / pricedResults.length;
  
  // Mağaza bazlı en ucuzları grupla
  const siteCheapest = {};
  pricedResults.forEach(item => {
    if (!siteCheapest[item.site] || item.price < siteCheapest[item.site].price) {
      siteCheapest[item.site] = item;
    }
  });
  
  const uniqueSiteCheapest = Object.values(siteCheapest).sort((a, b) => a.price - b.price);
  
  // Karşılaştırma Analiz Raporu
  const analysis = {
    cheapest: cheapest,
    mostExpensive: mostExpensive,
    averagePrice: averagePrice,
    averagePriceFormatted: formatPrice(averagePrice),
    siteCheapest: uniqueSiteCheapest,
    comparisonComment: ""
  };
  
  // Mağazalar arası fark analizi
  if (uniqueSiteCheapest.length >= 2) {
    const minPrice = uniqueSiteCheapest[0].price;
    const maxPrice = uniqueSiteCheapest[uniqueSiteCheapest.length - 1].price;
    const minSite = uniqueSiteCheapest[0].site;
    const maxSite = uniqueSiteCheapest[uniqueSiteCheapest.length - 1].site;
    
    const difference = maxPrice - minPrice;
    const savingsPercent = ((difference / maxPrice) * 100).toFixed(1);
    
    analysis.priceDifference = difference;
    analysis.savingsPercent = savingsPercent + "%";
    
    analysis.comparisonComment = `🔍 **PazarPusulası Fiyat ve Kalite Analiz Raporu:**
- **Aynı Kalitedeki Ürün** için en ucuz seçenek **${formatPrice(minPrice)}** ile **${minSite}** mağazasında tespit edilmiştir.
- En yüksek fiyat ise **${formatPrice(maxPrice)}** ile **${maxSite}** mağazasında bulunuyor.
- Mağazalar arası fiyat farkı: **${formatPrice(difference)}** (Tam **%${savingsPercent}** tasarruf!).
- Bu ürünü **${minSite}** üzerinden satın almanız bütçeniz için çok daha avantajlı olacaktır.`;
  } else {
    analysis.comparisonComment = `🔍 **PazarPusulası Fiyat ve Kalite Analiz Raporu:**
- Ürün yalnızca **${cheapest.site}** mağazasında bulundu (${cheapest.priceFormatted}). 
- Diğer e-ticaret mağazalarında birebir aynı kalitede eşleşen başka bir ürün fiyatı tespit edilemedi.`;
  }
  
  return analysis;
}

/**
 * Birden fazla sitede fiyat karşılaştırması yap
 * @param {string} productName - Ürün adı
 * @param {Object} apiKeys - API anahtarları
 * @returns {Object} Karşılaştırma sonuçları
 */
async function comparePrices(productName, apiKeys) {
  try {
    // Tüm sitelerde paralel arama yap
    const searchPromises = COMPARISON_SITES.map(site => 
      searchProducts(productName, [site], 5, apiKeys)
        .catch(err => {
          console.error(`${site} arama hatası:`, err.message);
          return { success: false, results: [], site };
        })
    );
    
    const searchResults = await Promise.all(searchPromises);
    
    // Tüm sonuçları birleştir
    let allResults = [];
    
    searchResults.forEach((result, index) => {
      if (result.success && result.results) {
        result.results.forEach(item => {
          allResults.push({
            ...item,
            sourceSite: COMPARISON_SITES[index]
          });
        });
      }
    });
    
    // Alakasız aksesuarları ellemek için filtre uygula
    const filteredResults = filterResults(productName, allResults);
    
    // Fiyatı olan sonuçları filtrele ve sırala
    const pricedResults = filteredResults.filter(r => r.hasPrice && r.price > 0);
    const unpricedResults = filteredResults.filter(r => !r.hasPrice || !r.price);
    
    // Fiyata göre artan sırada sırala
    pricedResults.sort((a, b) => a.price - b.price);
    
    // Fiyat Analizini Gerçekleştir
    const priceAnalysis = analyzePriceComparison(productName, pricedResults);
    
    // Sonuç objesini oluştur
    const comparison = {
      success: true,
      productName: productName,
      totalResults: filteredResults.length,
      pricedResults: pricedResults.length,
      results: [...pricedResults, ...unpricedResults].slice(0, 10), // Maks 10 sonuç
      cheapest: priceAnalysis ? priceAnalysis.cheapest : null,
      mostExpensive: priceAnalysis ? priceAnalysis.mostExpensive : null,
      savings: priceAnalysis && priceAnalysis.priceDifference ? {
        amount: priceAnalysis.priceDifference,
        amountFormatted: formatPrice(priceAnalysis.priceDifference),
        percent: priceAnalysis.savingsPercent
      } : null,
      analysis: priceAnalysis,
      summary: priceAnalysis ? priceAnalysis.comparisonComment : `"${productName}" için fiyat bilgisi bulunamadı.`,
      comparedSites: COMPARISON_SITES,
      isDemo: searchResults.some(r => r.isDemo)
    };
    
    return comparison;
    
  } catch (error) {
    console.error("Fiyat karşılaştırma hatası:", error.message);
    return {
      success: false,
      productName: productName,
      error: `Fiyat karşılaştırması yapılamadı: ${error.message}`,
      suggestion: "Lütfen ürün adını daha spesifik yazmayı deneyin."
    };
  }
}

/**
 * En ucuz 2 ürünü bul (kalite filtresiyle)
 * @param {string} productName - Ürün adı
 * @param {string} qualityKeywords - Kalite anahtar kelimeleri (virgülle ayrılmış)
 * @param {Object} apiKeys - API anahtarları
 * @returns {Object} En ucuz 2 ürün
 */
async function findCheapest(productName, qualityKeywords, apiKeys) {
  try {
    // Kalite kelimelerini arama sorgusuna ekle
    let searchQuery = productName;
    const keywords = qualityKeywords 
      ? qualityKeywords.split(',').map(k => k.trim()).filter(Boolean)
      : [];
    
    if (keywords.length > 0) {
      searchQuery = `${productName} ${keywords.join(' ')}`;
    }
    
    // Tüm sitelerde ara
    const result = await searchProducts(searchQuery, null, 15, apiKeys);
    
    if (!result.success) {
      return {
        success: false,
        error: "Ürün araması başarısız oldu.",
        productName: productName
      };
    }
    
    // Aksesuarları filtrele
    const filteredResults = filterResults(productName, result.results);
    
    // Fiyatı olan sonuçları al
    let pricedResults = filteredResults.filter(r => r.hasPrice && r.price > 0);
    
    // Kalite kelimelerine göre filtrele (eğer belirtilmişse)
    if (keywords.length > 0) {
      const qualityFiltered = pricedResults.filter(r => {
        const text = `${r.title} ${r.snippet}`.toLowerCase();
        return keywords.some(kw => text.includes(kw.toLowerCase()));
      });
      
      if (qualityFiltered.length > 0) {
        pricedResults = qualityFiltered;
      }
    }
    
    // Fiyata göre sırala
    pricedResults.sort((a, b) => a.price - b.price);
    
    // En ucuz 2 ürünü al
    const cheapestTwo = pricedResults.slice(0, 2);
    
    // Fiyat farkı hesabı
    let diffComment = "";
    if (cheapestTwo.length >= 2) {
      const diff = cheapestTwo[1].price - cheapestTwo[0].price;
      diffComment = `\n- Bu iki seçenek arasında **${formatPrice(diff)}** tutarında bir fark bulunuyor.`;
    }
    
    const response = {
      success: true,
      productName: productName,
      qualityKeywords: keywords,
      searchQuery: searchQuery,
      cheapestProducts: cheapestTwo.map((item, index) => ({
        rank: index + 1,
        title: item.title,
        price: item.price,
        priceFormatted: item.priceFormatted,
        site: item.site,
        link: item.link,
        snippet: item.snippet
      })),
      totalSearched: result.results.length,
      totalWithPrice: pricedResults.length,
      isDemo: result.isDemo
    };
    
    // Özet oluştur
    if (cheapestTwo.length >= 2) {
      response.summary = `🔍 **PazarPusulası En Ucuz Kaliteli Seçenekler Raporu:**
- 1️⃣ **En Ucuz Seçenek:** **${cheapestTwo[0].priceFormatted}** ile **${cheapestTwo[0].site}** mağazasında (${cheapestTwo[0].title}).
- 2️⃣ **İkinci Uygun Seçenek:** **${cheapestTwo[1].priceFormatted}** ile **${cheapestTwo[1].site}** mağazasında (${cheapestTwo[1].title}).${diffComment}
- Her iki ürün de belirttiğiniz kalite standartlarına uymaktadır. Karar bütçenize göre sizin!`;
    } else if (cheapestTwo.length === 1) {
      response.summary = `🔍 **PazarPusulası En Ucuz Kaliteli Seçenekler Raporu:**
- Tek bir uygun seçenek bulundu: **${cheapestTwo[0].priceFormatted}** ile **${cheapestTwo[0].site}** (${cheapestTwo[0].title}).`;
    } else {
      response.summary = `"${productName}" için belirttiğiniz kalite kriterlerine uygun fiyatlı sonuç bulunamadı.`;
    }
    
    return response;
    
  } catch (error) {
    console.error("En ucuz ürün arama hatası:", error.message);
    return {
      success: false,
      productName: productName,
      error: `En ucuz ürün araması yapılamadı: ${error.message}`,
      suggestion: "Lütfen daha sonra tekrar deneyin veya farklı bir ürün adı kullanın."
    };
  }
}

module.exports = { comparePrices, findCheapest };
