/**
 * HausPort AI - Özel E-Ticaret Platform Scraper'ları
 * 
 * Trendyol, Hepsiburada, Pazarama, Akakçe ve Cimri için özel scraping mekanizmaları.
 * Engelleme durumunda DuckDuckGo ve Google SERP fallback'lerini kullanır.
 */

const cheerio = require('cheerio');
const { extractPrice, formatPrice } = require('./product-search');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

function getRandomHeaders(host) {
  return {
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    'Referer': 'https://www.google.com/',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    ...(host ? { 'Host': host } : {})
  };
}

/**
 * DDG yönlendirme linklerini temizleme
 */
function decodeDDGLink(link) {
  if (!link) return '';
  if (link.includes('uddg=')) {
    try {
      const match = link.match(/[?&]uddg=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch (e) {}
  }
  if (link.startsWith('//')) return 'https:' + link;
  return link;
}

/**
 * Google yönlendirme linklerini temizleme
 */
function decodeGoogleLink(link) {
  if (!link) return '';
  if (link.includes('/url?q=')) {
    try {
      const match = link.match(/[?&]q=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch (e) {}
  }
  return link;
}

/**
 * Arama motorları üzerinden fallback arama yapma (Bing -> Yahoo -> DuckDuckGo)
 */
async function fallbackSearch(query, siteDomain, maxResults) {
  console.log(`⚠️ Direkt scraping engellendi veya başarısız oldu. Arama motoru fallback'i kullanılıyor (${siteDomain})...`);
  const cleanQuery = query.split(/\s+/).slice(0, 5).join(' ');
  const searchQuery = `${cleanQuery} site:${siteDomain}`;
  
  // 1. BİNG DENEMESİ (En kararlı)
  try {
    const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(bingUrl, {
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(6000)
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const results = [];
      
      $('li.b_algo').each((i, el) => {
        if (results.length >= maxResults) return false;
        const titleEl = $(el).find('h2 a');
        const snippetEl = $(el).find('.b_caption p, p').first();
        
        const title = titleEl.text().trim();
        const link = titleEl.attr('href');
        const snippet = snippetEl.text().trim();
        
        if (title && link && link.includes(siteDomain)) {
          const price = extractPrice(snippet) || extractPrice(title);
          results.push({
            title,
            link,
            price,
            priceFormatted: formatPrice(price),
            site: siteDomain,
            source: "Bing Fallback"
          });
        }
      });
      
      if (results.length > 0) return results;
    }
  } catch (e) {
    console.log("Bing fallback arama hatası:", e.message);
  }

  // 2. YAHOO DENEMESİ
  try {
    const yahooUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(6000)
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const results = [];
      
      $('div.dd.algo').each((i, el) => {
        if (results.length >= maxResults) return false;
        const titleEl = $(el).find('h3.title a, a').first();
        const snippetEl = $(el).find('.compText p, .compText, span').first();
        
        const title = titleEl.text().trim();
        let link = titleEl.attr('href');
        const snippet = snippetEl.text().trim();
        
        if (title && link) {
          if (link.includes('/RU=')) {
            try {
              const parts = link.split('/RU=');
              if (parts[1]) link = decodeURIComponent(parts[1].split('/')[0]);
            } catch (e) {}
          }
          
          if (link.includes(siteDomain)) {
            const price = extractPrice(snippet) || extractPrice(title);
            results.push({
              title,
              link,
              price,
              priceFormatted: formatPrice(price),
              site: siteDomain,
              source: "Yahoo Fallback"
            });
          }
        }
      });
      
      if (results.length > 0) return results;
    }
  } catch (e) {
    console.log("Yahoo fallback arama hatası:", e.message);
  }

  // 3. DUCKDUCKGO DENEMESİ (Son çare arama motoru)
  try {
    const url = 'https://html.duckduckgo.com/html/';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENTS[0],
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `q=${encodeURIComponent(searchQuery)}`,
      signal: AbortSignal.timeout(6000)
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const results = [];
      
      $('#links .result').each((i, el) => {
        if (results.length >= maxResults) return false;
        const title = $(el).find('.result__a').text().trim();
        let link = $(el).find('.result__a').attr('href');
        const snippet = $(el).find('.result__snippet').text().trim();
        
        if (title && link) {
          link = decodeDDGLink(link);
          if (link.includes(siteDomain)) {
            const price = extractPrice(snippet) || extractPrice(title);
            results.push({
              title,
              link,
              price,
              priceFormatted: formatPrice(price),
              site: siteDomain,
              source: "DDG Fallback"
            });
          }
        }
      });
      
      if (results.length > 0) return results;
    }
  } catch (e) {
    console.log("DDG fallback arama hatası:", e.message);
  }
  
  return [];
}

// ===== PLATFORM SCRAPER'LARI =====

/**
 * 1. TRENDYOL DIRECT SCRAPER
 */
async function scrapeTrendyol(query, maxResults = 5) {
  const url = `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`;
  console.log(`🔍 Trendyol taranıyor: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: getRandomHeaders('www.trendyol.com'),
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    
    // Yöntem A: __SEARCH_APP_INITIAL_STATE__ scriptinden çekme (En güvenilir)
    let foundJSON = false;
    $('script').each((i, el) => {
      const text = $(el).text();
      if (text.includes('__SEARCH_APP_INITIAL_STATE__')) {
        try {
          const jsonStr = text.split('__SEARCH_APP_INITIAL_STATE__ =')[1].split(';')[0].trim();
          const state = JSON.parse(jsonStr);
          if (state && state.products) {
            foundJSON = true;
            state.products.slice(0, maxResults).forEach(p => {
              const price = p.price?.discountedPrice || p.price?.sellingPrice;
              results.push({
                title: `${p.brand?.name || ''} ${p.name || ''}`.trim(),
                link: `https://www.trendyol.com${p.url}`,
                price: price,
                priceFormatted: formatPrice(price),
                site: "trendyol.com",
                image: p.images?.[0] ? `https://cdn.dsmcdn.com${p.images[0]}` : null,
                source: "Trendyol Direkt API"
              });
            });
          }
        } catch (err) {
          console.warn("Trendyol JSON parse hatası:", err.message);
        }
      }
    });
    
    // Yöntem B: DOM üzerinden çekme
    if (!foundJSON || results.length === 0) {
      $('.p-card-wrppr').each((i, el) => {
        if (results.length >= maxResults) return false;
        const brand = $(el).find('.prdct-desc-cntnr-ttl').text().trim();
        const name = $(el).find('.prdct-desc-cntnr-name').text().trim();
        const title = `${brand} ${name}`.trim();
        let link = $(el).find('a').attr('href');
        if (link && !link.startsWith('http')) link = 'https://www.trendyol.com' + link;
        
        const priceText = $(el).find('.prc-box-dscntd').text().trim() || $(el).find('.prc-box-sng').text().trim();
        const price = extractPrice(priceText);
        
        if (title && link) {
          results.push({
            title,
            link,
            price,
            priceFormatted: formatPrice(price),
            site: "trendyol.com",
            source: "Trendyol DOM"
          });
        }
      });
    }
    
    if (results.length > 0) return results;
    
  } catch (error) {
    console.warn("Trendyol direkt scrape başarısız:", error.message);
  }
  
  // Başarısız olursa arama motoru fallback'i
  return fallbackSearch(query, 'trendyol.com', maxResults);
}

/**
 * 2. HEPSİBURADA DIRECT SCRAPER
 */
async function scrapeHepsiburada(query, maxResults = 5) {
  const url = `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`;
  console.log(`🔍 Hepsiburada taranıyor: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: getRandomHeaders('www.hepsiburada.com'),
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    
    // DOM parsing
    $('li[class*="productListContent"], div[class*="ProductCard"]').each((i, el) => {
      if (results.length >= maxResults) return false;
      const title = $(el).find('h3').text().trim() || $(el).find('[data-test-id="product-card-name"]').text().trim();
      let link = $(el).find('a').attr('href');
      if (link && !link.startsWith('http')) link = 'https://www.hepsiburada.com' + link;
      
      const priceText = $(el).find('[data-test-id="price-current-price"]').text().trim() || $(el).find('[class*="price-value"]').text().trim();
      const price = extractPrice(priceText);
      
      if (title && link) {
        results.push({
          title,
          link,
          price,
          priceFormatted: formatPrice(price),
          site: "hepsiburada.com",
          source: "Hepsiburada DOM"
        });
      }
    });
    
    if (results.length > 0) return results;
    
  } catch (error) {
    console.warn("Hepsiburada direkt scrape başarısız:", error.message);
  }
  
  return fallbackSearch(query, 'hepsiburada.com', maxResults);
}

/**
 * 3. PAZARAMA DIRECT SCRAPER
 */
async function scrapePazarama(query, maxResults = 5) {
  const url = `https://www.pazarama.com/arama?q=${encodeURIComponent(query)}`;
  console.log(`🔍 Pazarama taranıyor: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: getRandomHeaders('www.pazarama.com'),
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    
    $('.product-card, .product-list-item').each((i, el) => {
      if (results.length >= maxResults) return false;
      const title = $(el).find('.product-card-title, .product-title').text().trim();
      let link = $(el).find('a').attr('href');
      if (link && !link.startsWith('http')) link = 'https://www.pazarama.com' + link;
      
      const priceText = $(el).find('.product-card-price, .price').text().trim();
      const price = extractPrice(priceText);
      
      if (title && link) {
        results.push({
          title,
          link,
          price,
          priceFormatted: formatPrice(price),
          site: "pazarama.com",
          source: "Pazarama DOM"
        });
      }
    });
    
    if (results.length > 0) return results;
    
  } catch (error) {
    console.warn("Pazarama direkt scrape başarısız:", error.message);
  }
  
  return fallbackSearch(query, 'pazarama.com', maxResults);
}

/**
 * 4. AKAKÇE DIRECT SCRAPER
 */
async function scrapeAkakce(query, maxResults = 5) {
  const url = `https://www.akakce.com/arama/?q=${encodeURIComponent(query)}`;
  console.log(`🔍 Akakçe taranıyor: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: getRandomHeaders('www.akakce.com'),
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    
    $('li.cell-v8, li.p-c').each((i, el) => {
      if (results.length >= maxResults) return false;
      const title = $(el).find('span.pn, h3').text().trim();
      let link = $(el).find('a').attr('href');
      if (link && !link.startsWith('http')) link = 'https://www.akakce.com' + link;
      
      const priceText = $(el).find('span.pr, .p-p').text().trim();
      const price = extractPrice(priceText);
      
      if (title && link) {
        results.push({
          title,
          link,
          price,
          priceFormatted: formatPrice(price),
          site: "akakce.com",
          source: "Akakçe DOM"
        });
      }
    });
    
    if (results.length > 0) return results;
    
  } catch (error) {
    console.warn("Akakçe direkt scrape başarısız:", error.message);
  }
  
  return fallbackSearch(query, 'akakce.com', maxResults);
}

/**
 * 5. CİMRİ DIRECT SCRAPER
 */
async function scrapeCimri(query, maxResults = 5) {
  const url = `https://www.cimri.com/arama?q=${encodeURIComponent(query)}`;
  console.log(`🔍 Cimri taranıyor: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: getRandomHeaders('www.cimri.com'),
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    
    // Cimri product card elementleri
    $('article[class*="ProductCard"], div[class*="product-card"]').each((i, el) => {
      if (results.length >= maxResults) return false;
      const title = $(el).find('h3, [class*="product-title"]').text().trim();
      let link = $(el).find('a').attr('href');
      if (link && !link.startsWith('http')) link = 'https://www.cimri.com' + link;
      
      const priceText = $(el).find('[class*="price"], .price-box').text().trim();
      const price = extractPrice(priceText);
      
      if (title && link) {
        results.push({
          title,
          link,
          price,
          priceFormatted: formatPrice(price),
          site: "cimri.com",
          source: "Cimri DOM"
        });
      }
    });
    
    if (results.length > 0) return results;
    
  } catch (error) {
    console.warn("Cimri direkt scrape başarısız:", error.message);
  }
  
  return fallbackSearch(query, 'cimri.com', maxResults);
}

module.exports = {
  scrapeTrendyol,
  scrapeHepsiburada,
  scrapePazarama,
  scrapeAkakce,
  scrapeCimri
};
