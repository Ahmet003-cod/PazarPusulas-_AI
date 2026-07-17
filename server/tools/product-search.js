/**
 * HausPort AI - Ürün Arama Servisi (v3 - Bing & Yahoo Arama Motoru Destekli)
 * 
 * Çoklu arama motoru desteği ile kesintisiz fiyat çekimi:
 * 1. Google Custom Search API (API key varsa)
 * 2. Bing Search Scraping (Engelleme oranı çok düşük, en güvenli fallback)
 * 3. Yahoo Search Scraping (İkinci güvenli fallback)
 * 4. DuckDuckGo HTML scraping
 * 5. Google SERP scraping
 * 6. Demo/Mock veriler (son çare)
 */

const cheerio = require('cheerio');

// Desteklenen e-ticaret siteleri
const SUPPORTED_SITES = {
  hepsiburada: "hepsiburada.com",
  trendyol: "trendyol.com",
  cimri: "cimri.com",
  akakce: "akakce.com",
  pazarama: "pazarama.com"
};

const ALL_SITE_DOMAINS = ["akakce.com", "cimri.com"];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function decodeBingUrl(url) {
  if (!url) return '';
  if (url.includes('bing.com/ck/a?!')) {
    try {
      const urlObj = new URL(url);
      const u = urlObj.searchParams.get('u');
      if (u) {
        let base64Part = u;
        const httpIdx = u.indexOf('aHR0cD');
        const httpsIdx = u.indexOf('aHR0cH');
        const idx = (httpsIdx !== -1) ? httpsIdx : httpIdx;
        if (idx !== -1) {
          base64Part = u.substring(idx);
          const padded = base64Part.padEnd(base64Part.length + (4 - base64Part.length % 4) % 4, '=');
          const decoded = Buffer.from(padded, 'base64').toString('utf-8');
          return decoded;
        }
      }
    } catch (e) {
      console.warn("Bing URL decoding error:", e.message);
    }
  }
  return url;
}

// ===== FİYAT ARAÇLARI =====

function extractPrice(text) {
  if (!text) return null;
  
  // HTML boşluklarını temizle
  text = text.replace(/&nbsp;/g, ' ');
  
  const patterns = [
    // 123.456,78 TL veya 123456,78 TL veya 123456 TL veya 123.456 TL
    /(\d+(?:\.\d{3})*(?:,\d{2})?)\s*(?:TL|₺|lira)/i,
    // TL 123.456,78
    /(?:TL|₺)\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i,
    // fiyatı: 123456
    /fiyat[ıi]?\s*:?\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let priceStr = match[1];
      
      // Hem nokta hem virgül varsa (örn: 1.250,90)
      if (priceStr.includes('.') && priceStr.includes(',')) {
        priceStr = priceStr.replace(/\./g, '').replace(',', '.');
      } 
      // Sadece virgül varsa ve virgülden sonrası 2 haneliyse (örn: 1250,90)
      else if (priceStr.includes(',') && priceStr.indexOf(',') === priceStr.lastIndexOf(',') && priceStr.split(',')[1].length === 2) {
        priceStr = priceStr.replace(',', '.');
      } 
      // Sadece nokta varsa ve binlik ayırıcı gibi duruyorsa (örn: 54.999)
      else if (priceStr.includes('.') && priceStr.split('.')[1].length === 3) {
        priceStr = priceStr.replace(/\./g, '');
      }
      // İngilizce binlik ayırıcı virgül varsa (örn: 54,999)
      else if (priceStr.includes(',') && priceStr.split(',')[1].length === 3) {
        priceStr = priceStr.replace(/,/g, '');
      }
      
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 10 && price < 10000000) {
        return price;
      }
    }
  }
  
  return null;
}

function formatPrice(price) {
  if (price === null || price === undefined) return "Fiyat bilgisi yok";
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY',
    minimumFractionDigits: 2 
  }).format(price);
}

function buildSiteFilter(sites) {
  let domains = ALL_SITE_DOMAINS;
  
  if (sites && sites.length > 0) {
    domains = sites
      .map(s => SUPPORTED_SITES[s.toLowerCase()])
      .filter(Boolean);
    
    if (domains.length === 0) {
      domains = ALL_SITE_DOMAINS;
    }
  }
  
  return domains.map(d => `site:${d}`).join(' OR ');
}

function cleanSearchQuery(query) {
  let clean = query.trim();
  const words = clean.split(/\s+/);
  if (words.length > 6) {
    clean = words.slice(0, 6).join(' ');
  }
  return clean;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== ARAMA MOTORLARI MOTOR ZİNCİRİ =====

/**
 * 1. Bing Arama Motoru Scraping (Rate limit oranı en düşük ve en kararlı çalışan)
 */
async function searchBing(query, sites, maxResults) {
  const max = Math.min(maxResults || 5, 10);
  const cleanQuery = cleanSearchQuery(query);
  const siteFilter = buildSiteFilter(sites);
  const searchQuery = `${cleanQuery} fiyat (${siteFilter})`;
  
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    
    if (!response.ok) throw new Error(`Bing HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    let rank = 1;
    
    $('li.b_algo').each((i, el) => {
      if (results.length >= max) return false;
      
      const titleEl = $(el).find('h2 a');
      const snippetEl = $(el).find('.b_caption p, p').first();
      
      const title = titleEl.text().trim();
      let link = titleEl.attr('href');
      const snippet = snippetEl.text().trim();
      
      if (!title || !link) return;
      
      // Bing redirect URL'ini orijinal linke dönüştür
      if (link.includes('bing.com/ck/a?!')) {
        link = decodeBingUrl(link);
      }
      
      if (!link || !link.startsWith('http')) return;
      
      let displayLink = '';
      try { displayLink = new URL(link).hostname; } catch (e) { displayLink = link; }
      const site = displayLink.replace('www.', '').split('/')[0] || 'bilinmiyor';
      
      link = cleanProductLink(link, site, query);
      
      const price = extractPrice(snippet) || extractPrice(title);
      
      results.push({
        rank: rank++, title, link, snippet, displayLink, site,
        price, priceFormatted: formatPrice(price), hasPrice: price !== null
      });
    });
    
    if (results.length === 0) return null;
    
    return {
      success: true, query, totalResults: results.length,
      resultCount: results.length, results,
      source: "Bing Arama", isDemo: false,
      searchedSites: sites || Object.keys(SUPPORTED_SITES)
    };
    
  } catch (error) {
    console.error("Bing arama hatası:", error.message);
    return null;
  }
}

/**
 * 2. Yahoo Arama Motoru Scraping
 */
async function searchYahoo(query, sites, maxResults) {
  const max = Math.min(maxResults || 5, 10);
  const cleanQuery = cleanSearchQuery(query);
  const siteFilter = buildSiteFilter(sites);
  const searchQuery = `${cleanQuery} fiyat (${siteFilter})`;
  
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    
    if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    let rank = 1;
    
    $('div.dd.algo').each((i, el) => {
      if (results.length >= max) return false;
      
      const titleEl = $(el).find('h3.title a, a').first();
      const snippetEl = $(el).find('.compText p, .compText, span').first();
      
      const title = titleEl.text().trim();
      let link = titleEl.attr('href');
      const snippet = snippetEl.text().trim();
      
      if (!title || !link) return;
      
      // Yahoo redirect link temizleme
      if (link.includes('/RU=')) {
        try {
          const parts = link.split('/RU=');
          if (parts[1]) {
            const rawUrl = parts[1].split('/')[0];
            link = decodeURIComponent(rawUrl);
          }
        } catch (e) {}
      }
      
      if (!link.startsWith('http')) return;
      
      let displayLink = '';
      try { displayLink = new URL(link).hostname; } catch (e) { displayLink = link; }
      const site = displayLink.replace('www.', '').split('/')[0] || 'bilinmiyor';
      
      link = cleanProductLink(link, site, query);
      
      const price = extractPrice(snippet) || extractPrice(title);
      
      results.push({
        rank: rank++, title, link, snippet, displayLink, site,
        price, priceFormatted: formatPrice(price), hasPrice: price !== null
      });
    });
    
    if (results.length === 0) return null;
    
    return {
      success: true, query, totalResults: results.length,
      resultCount: results.length, results,
      source: "Yahoo Arama", isDemo: false,
      searchedSites: sites || Object.keys(SUPPORTED_SITES)
    };
    
  } catch (error) {
    console.error("Yahoo arama hatası:", error.message);
    return null;
  }
}

/**
 * 3. DuckDuckGo HTML scraping
 */
async function searchDuckDuckGo(query, sites, maxResults) {
  const max = Math.min(maxResults || 5, 10);
  const cleanQuery = cleanSearchQuery(query);
  const siteFilter = buildSiteFilter(sites);
  const searchQuery = `${cleanQuery} fiyat TL (${siteFilter})`;
  
  try {
    const url = 'https://html.duckduckgo.com/html/';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': getRandomUA(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `q=${encodeURIComponent(searchQuery)}`,
      signal: AbortSignal.timeout(8000),
    });
    
    if (!response.ok) throw new Error(`DuckDuckGo HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    let rank = 1;
    
    $('#links .result').each((i, el) => {
      if (results.length >= max) return false;
      
      const title = $(el).find('.result__a').text().trim();
      let link = $(el).find('.result__a').attr('href');
      const snippet = $(el).find('.result__snippet').text().trim();
      
      if (!title || !link) return;
      
      if (link.includes('uddg=')) {
        try {
          const match = link.match(/[?&]uddg=([^&]+)/);
          if (match && match[1]) link = decodeURIComponent(match[1]);
        } catch (e) {}
      }
      
      if (link.startsWith('//')) link = 'https:' + link;
      
      let displayLink = '';
      try { displayLink = new URL(link).hostname; } catch (e) { displayLink = link; }
      const site = displayLink.replace('www.', '').split('/')[0] || 'bilinmiyor';
      const price = extractPrice(snippet) || extractPrice(title);
      
      results.push({
        rank: rank++, title, link, snippet, displayLink, site,
        price, priceFormatted: formatPrice(price), hasPrice: price !== null
      });
    });
    
    if (results.length === 0) return null;
    
    return {
      success: true, query, totalResults: results.length,
      resultCount: results.length, results,
      source: "DuckDuckGo Arama", isDemo: false,
      searchedSites: sites || Object.keys(SUPPORTED_SITES)
    };
    
  } catch (error) {
    console.error("DuckDuckGo hatası:", error.message);
    return null;
  }
}

/**
 * 4. Google SERP scraping (Uzatılmış /url?q= temizlikli)
 */
async function searchGoogleScrape(query, sites, maxResults) {
  const max = Math.min(maxResults || 5, 10);
  const cleanQuery = cleanSearchQuery(query);
  const siteFilter = buildSiteFilter(sites);
  const searchQuery = `${cleanQuery} fiyat TL ${siteFilter}`;
  
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=tr&gl=tr&num=${max + 5}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });
    
    if (!response.ok) throw new Error(`Google HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    let rank = 1;
    
    $('div.g, div[data-sokoban-container]').each((i, el) => {
      if (results.length >= max) return false;
      
      const titleEl = $(el).find('h3').first();
      const linkEl = $(el).find('a').first();
      const snippetEl = $(el).find('div[data-sncf], div.VwiC3b, span.aCOpRe').first();
      
      const title = titleEl.text().trim();
      let link = linkEl.attr('href');
      const snippet = snippetEl.text().trim();
      
      if (!title || !link) return;
      
      if (link.includes('/url?q=')) {
        try {
          const match = link.match(/[?&]q=([^&]+)/);
          if (match && match[1]) link = decodeURIComponent(match[1]);
        } catch (e) {}
      }
      
      if (!link.startsWith('http')) return;
      
      let displayLink = '';
      try { displayLink = new URL(link).hostname; } catch (e) { displayLink = link; }
      const site = displayLink.replace('www.', '').split('/')[0] || 'bilinmiyor';
      
      const isSupported = ALL_SITE_DOMAINS.some(d => displayLink.includes(d));
      if (!isSupported) return;
      
      const price = extractPrice(snippet) || extractPrice(title);
      
      results.push({
        rank: rank++, title, link, snippet, displayLink, site,
        price, priceFormatted: formatPrice(price), hasPrice: price !== null
      });
    });
    
    if (results.length === 0) return null;
    
    return {
      success: true, query, totalResults: results.length,
      resultCount: results.length, results,
      source: "Google Scrape Arama", isDemo: false,
      searchedSites: sites || Object.keys(SUPPORTED_SITES)
    };
    
  } catch (error) {
    console.error("Google scrape hatası:", error.message);
    return null;
  }
}

// ===== SEARCH PRODUCTS DISPATCHER =====

async function executeSearchEngines(query, sites, max, apiKeys) {
  // 1. Google CSE API (Anahtar Varsa)
  const cseKey = apiKeys?.googleCseKey || process.env.GOOGLE_CSE_API_KEY;
  const cseId = apiKeys?.googleCseId || process.env.GOOGLE_CSE_ID;
  
  if (cseKey && cseId) {
    try {
      console.log("🔍 Google CSE API ile aranıyor...");
      const siteFilter = buildSiteFilter(sites);
      const searchQuery = `${query} ${siteFilter}`;
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", cseKey);
      url.searchParams.set("cx", cseId);
      url.searchParams.set("q", searchQuery);
      url.searchParams.set("num", String(max));
      url.searchParams.set("lr", "lang_tr");
      url.searchParams.set("gl", "tr");
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        const results = (data.items || []).map((item, index) => {
          const price = extractPrice(item.snippet) || extractPrice(item.title);
          const image = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null;
          return {
            rank: index + 1,
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            displayLink: item.displayLink,
            site: item.displayLink?.replace('www.', '').split('/')[0] || 'bilinmiyor',
            price, priceFormatted: formatPrice(price), hasPrice: price !== null,
            image
          };
        });
        
        return {
          success: true, query,
          totalResults: data.searchInformation?.totalResults || results.length,
          resultCount: results.length, results,
          source: "Google Custom Search API", isDemo: false,
          searchedSites: sites || Object.keys(SUPPORTED_SITES)
        };
      }
    } catch (e) {
      console.warn("Google CSE API hatası, fallback'e geçiliyor:", e.message);
    }
  }

  // 2. DuckDuckGo HTML scraping (Fiyat snippet'leri açısından en zengini ve stabil olanı)
  console.log("🔍 DuckDuckGo ile aranıyor...");
  const ddgResults = await searchDuckDuckGo(query, sites, max);
  if (ddgResults && ddgResults.results.length > 0 && ddgResults.results.some(r => r.price !== null)) {
    return ddgResults;
  }
  
  // 3. Bing Arama Scraping
  console.log("🔍 Bing Arama ile aranıyor...");
  const bingResults = await searchBing(query, sites, max);
  if (bingResults && bingResults.results.length > 0 && bingResults.results.some(r => r.price !== null)) {
    return bingResults;
  }
  
  // 4. Yahoo Arama Scraping
  console.log("🔍 Yahoo Arama ile aranıyor...");
  const yahooResults = await searchYahoo(query, sites, max);
  if (yahooResults && yahooResults.results.length > 0 && yahooResults.results.some(r => r.price !== null)) {
    return yahooResults;
  }
  
  // 5. Google SERP scraping
  console.log("🔍 Google SERP Scraping ile aranıyor...");
  const googleScrapeResults = await searchGoogleScrape(query, sites, max);
  if (googleScrapeResults && googleScrapeResults.results.length > 0 && googleScrapeResults.results.some(r => r.price !== null)) {
    return googleScrapeResults;
  }
  
  // Eğer fiyat içeren hiçbir sonuç bulunamadıysa ama link bulunduysa, en azından orijinal linkleri kaybetmemek için ilk bulduğumuz sonucu dönelim
  if (ddgResults && ddgResults.results.length > 0) return ddgResults;
  if (bingResults && bingResults.results.length > 0) return bingResults;
  if (yahooResults && yahooResults.results.length > 0) return yahooResults;
  if (googleScrapeResults && googleScrapeResults.results.length > 0) return googleScrapeResults;
  
  return null;
}

function relaxSearchQuery(query) {
  let clean = query.trim();
  
  // GB, TB, SSD, RAM, Freedos gibi detayları temizle
  clean = clean.replace(/\b\d+\s*(?:gb|tb)\b/gi, '');
  clean = clean.replace(/\b(?:ssd|ram|hdd|freedos|fhd\+?|ips|144hz|165hz)\b/gi, '');
  
  // Çift boşlukları temizle
  clean = clean.replace(/\s+/g, ' ').trim();
  
  const words = clean.split(' ');
  if (words.length > 5) {
    const mainSeries = words.slice(0, 3).join(' ');
    // Önce GPU/Ekran Kartı modellerini (RTX, GTX vb.) ara, yoksa işlemci kelimelerini ara
    const gpu = words.find(w => w.toLowerCase().includes('rtx') || w.toLowerCase().includes('gtx') || w.toLowerCase().includes('rx'))
             || words.find(w => w.toLowerCase().includes('core') || w.toLowerCase().includes('i5') || w.toLowerCase().includes('i7') || w.toLowerCase().includes('i9') || w.toLowerCase().includes('ryzen'));
    return gpu ? `${mainSeries} ${gpu}` : mainSeries;
  }
  
  return clean;
}

async function searchProducts(query, sites, maxResults, apiKeys) {
  const max = Math.min(maxResults || 5, 10);
  
  // 1. Orijinal Sorgu İle Arama Yap
  let searchResult = await executeSearchEngines(query, sites, max, apiKeys);
  
  // 2. Sonuç Bulunamadıysa veya Fiyat Yoksa Sorguyu Sadeleştir ve Tekrar Ara
  if (!searchResult || searchResult.results.length === 0 || !searchResult.results.some(r => r.price !== null)) {
    const relaxedQuery = relaxSearchQuery(query);
    if (relaxedQuery && relaxedQuery.toLowerCase() !== query.toLowerCase()) {
      console.log(`⚠️ Arama sonucu veya fiyat bulunamadı. Sorgu sadeleştirilip tekrar aranıyor: "${relaxedQuery}"`);
      const relaxedResult = await executeSearchEngines(relaxedQuery, sites, max, apiKeys);
      if (relaxedResult && relaxedResult.results.length > 0) {
        searchResult = relaxedResult;
      }
    }
  }
  
  if (searchResult) {
    return searchResult;
  }
  
  // 3. Son Çare: Demo veriler
  console.log("⚠️ Arama motorları meşgul veya engelledi. Demo veriler yükleniyor...");
  return getMockResults(query, sites, max);
}

// ===== DEMO MOCK VERİLER =====

function getSearchUrlForSite(site, query) {
  const q = encodeURIComponent(query);
  if (site.includes('trendyol.com')) {
    return `https://www.trendyol.com/sr?q=${q}`;
  }
  if (site.includes('hepsiburada.com')) {
    return `https://www.hepsiburada.com/ara?q=${q}`;
  }
  if (site.includes('akakce.com')) {
    return `https://www.akakce.com/arama/?q=${q}`;
  }
  if (site.includes('cimri.com')) {
    return `https://www.cimri.com/arama?q=${q}`;
  }
  if (site.includes('pazarama.com')) {
    return `https://www.pazarama.com/arama?q=${q}`;
  }
  return `https://www.${site}/search?q=${q}`;
}

function cleanProductLink(link, site, query) {
  if (!link) return '';
  
  let decoded = link;
  try {
    decoded = decodeURIComponent(link);
  } catch (e) {}
  
  // Bozuk percent-encoding ve karakter kontrolleri (Örn: %E2%82%AC ya da €)
  if (link.includes('%E2%82%AC') || link.includes('€20') || decoded.includes('€')) {
    console.log(`⚠️ Link bozuk karakter içeriyor, temiz arama URL'ine dönüştürülüyor: ${link}`);
    return getSearchUrlForSite(site, query);
  }
  
  // Eğer link bir ürün sayfası değil de filtre/kategori sayfasıysa ve çok uzunsa güvenli arama URL'ine çevir
  // Hepsiburada ürün sayfaları genellikle "-p-" veya "-pm-" içerir.
  // Trendyol ürün sayfaları "-p-" içerir.
  const isProductPage = link.includes('-p-') || link.includes('-pm-') || link.includes('/p/');
  if (!isProductPage && link.includes('?')) {
    console.log(`⚠️ Link bir kategori/filtre sayfası, arama URL'ine dönüştürülüyor: ${link}`);
    return getSearchUrlForSite(site, query);
  }
  
  return link;
}

function getDeterministicMockPrice(query) {
  const q = query.toLowerCase();
  
  // Popüler ürünler için nokta atışı gerçek piyasa fiyatları
  if (q.includes("iphone 15 pro max")) {
    return 79799.99;
  }
  if (q.includes("iphone 15") && !q.includes("pro max")) {
    return 54999.00;
  }
  if (q.includes("kaan 260") || q.includes("çapa makinesi")) {
    return 24500.00;
  }
  if (q.includes("daire testere") || q.includes("testere bıçağı")) {
    return 2450.00;
  }
  if (q.includes("airpods pro")) {
    return 7499.00;
  }
  if (q.includes("playstation 5") || q.includes("ps5")) {
    return 22000.00;
  }
  
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = query.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);

  let minPrice = 300;
  let maxPrice = 2500;

  // Ultra Premium Elektronik / Ağır Aletler (Bilgisayarlar, Laptops, RTX/GTX Cihazlar, Core/Ryzen İşlemcili Aletler, Çapa Makinesi)
  if (
    q.includes("pro max") || q.includes("macbook") || q.includes("laptop") || 
    q.includes("bilgisayar") || q.includes("notebook") || q.includes("dizüstü") || 
    q.includes("rtx") || q.includes("gtx") || q.includes("radeon") || q.includes("intel") || 
    q.includes("ryzen") || q.includes("amd") || q.includes("core") || q.includes("gaming") || 
    q.includes("tuf") || q.includes("freedos") || q.includes("monster") || 
    q.includes("excalibur") || q.includes("çapa makinesi") || q.includes("procore akü") || 
    q.includes("televizyon") || q.includes("tiller") || q.includes("m1") || q.includes("m2") || 
    q.includes("m3") || q.includes("i5") || q.includes("i7") || q.includes("i9")
  ) {
    minPrice = 16000;
    maxPrice = 75000;
  }
  // Yüksek Seviye Elektronik / Ev Aletleri (iPhone, Galaxy, Dyson, PlayStation, Matkap)
  else if (q.includes("iphone") || q.includes("samsung") || q.includes("galaxy") || q.includes("dyson") || q.includes("playstation") || q.includes("süpürge") || q.includes("matkap") || q.includes("daire testere") || q.includes("l-box") || q.includes("caddy")) {
    minPrice = 8000;
    maxPrice = 45000;
  }
  // Orta Seviye Ev/Elektronik (Airfryer, Kulaklık, Vidalama, Akü, Perfume, Kahve Makinesi)
  else if (q.includes("airfryer") || q.includes("kulaklık") || q.includes("buds") || q.includes("soundcore") || q.includes("akü") || q.includes("vidalama") || q.includes("parfüm") || q.includes("kahve makinesi") || q.includes("router") || q.includes("klavye") || q.includes("mouse")) {
    minPrice = 2500;
    maxPrice = 12000;
  }
  // Giyim / Aksesuar / Ayakkabı / Spor (Termos, Şort, Mont, Gömlek, Bot, Sneaker, Nike, Adidas)
  else if (q.includes("termos") || q.includes("matara") || q.includes("gömlek") || q.includes("şort") || q.includes("mont") || q.includes("bot") || q.includes("ayakkabı") || q.includes("pantolon") || q.includes("sneaker") || q.includes("nike") || q.includes("adidas") || q.includes("puma") || q.includes("samba")) {
    minPrice = 1200;
    maxPrice = 5500;
  }
  // Kitap / Kırtasiye / Küçük Mutfak Gereçleri / Tişört (T-shirt, Kitap, Bardak, Kahve)
  else if (q.includes("kitap") || q.includes("t-shirt") || q.includes("tişört") || q.includes("kupa") || q.includes("roman") || q.includes("defter")) {
    minPrice = 150;
    maxPrice = 850;
  }

  const price = minPrice + (seed % (maxPrice - minPrice));
  return Math.round(price);
}

function getMockResults(query, sites, maxResults) {
  const cleanQuery = query.trim();
  const basePrice = getDeterministicMockPrice(cleanQuery);
  
  // Kullanıcının aradığı gerçek ürün ismiyle dinamik demo ürün listesi oluştur
  let mockProducts = [
    { title: `${cleanQuery}`, price: Math.round(basePrice * 1.00), site: "trendyol.com" },
    { title: `${cleanQuery}`, price: Math.round(basePrice * 1.03), site: "hepsiburada.com" },
    { title: `${cleanQuery}`, price: Math.round(basePrice * 0.97), site: "akakce.com" },
    { title: `${cleanQuery}`, price: Math.round(basePrice * 0.99), site: "pazarama.com" },
    { title: `${cleanQuery}`, price: Math.round(basePrice * 0.95), site: "cimri.com" }
  ];
  
  const activeSites = (sites && sites.length > 0) ? sites : ['akakce', 'cimri'];
  const allowedDomains = activeSites.map(s => SUPPORTED_SITES[s.toLowerCase()]).filter(Boolean);
  if (allowedDomains.length > 0) {
    mockProducts = mockProducts.filter(p => allowedDomains.includes(p.site));
  }
  
  const limitedProducts = mockProducts.slice(0, maxResults);
  const results = limitedProducts.map((product, index) => ({
    rank: index + 1,
    title: product.title,
    link: getSearchUrlForSite(product.site, cleanQuery),
    snippet: `${product.title} - ${formatPrice(product.price)} fiyatıyla ${product.site} üzerinde satışta.`,
    displayLink: `www.${product.site}`,
    site: product.site,
    price: product.price,
    priceFormatted: formatPrice(product.price),
    hasPrice: true
  }));
  
  return {
    success: true, query: cleanQuery, totalResults: results.length, resultCount: results.length, results,
    source: "PazarPusulası Fiyat Motoru (Tahmini)",
    isDemo: true, searchedSites: sites || Object.keys(SUPPORTED_SITES),
    note: "⚠️ Arama limitleri nedeniyle tahmini referans fiyatları kullanılmaktadır."
  };
}

module.exports = { searchProducts, extractPrice, formatPrice, getDeterministicMockPrice, cleanProductLink };
