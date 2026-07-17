/**
 * PazarPusulası AI - Haftalık Trend Üretici & Önbellek Sistemi
 * 
 * Haftada 1 kez çalışarak mevsime uygun en popüler 25 ürünü (resim, fiyat, link) 
 * Trendyol üzerinden scrape eder ve server/data/weekly-trends.json dosyasına kaydeder.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { scrapeTrendyol } = require('./platform-scrapers');

const DATA_DIR = path.join(__dirname, '../data');
const TRENDS_FILE = path.join(DATA_DIR, 'weekly-trends.json');

// Her mevsim için arama yapılacak 25 popüler trend ürün sorgusu (12 Giyim, 13 Elektronik/Alet)
const SEASONAL_QUERIES = {
  yaz: [
    // Giyim (12 adet)
    { query: "Erkek keten gömlek", category: "Giyim" },
    { query: "Erkek kargo cepli şort", category: "Giyim" },
    { query: "Erkek basic tişört", category: "Giyim" },
    { query: "Erkek keten pantolon bej", category: "Giyim" },
    { query: "Polarize güneş gözlüğü", category: "Giyim" },
    { query: "Erkek deniz şortu hızlı kuruyan", category: "Giyim" },
    { query: "Mantar taban sandalet", category: "Giyim" },
    { query: "Kadın yazlık askılı bluz", category: "Giyim" },
    { query: "Kadın keten pantolon", category: "Giyim" },
    { query: "Hasır plaj çantası", category: "Giyim" },
    { query: "Yazlık askılı keten elbise", category: "Giyim" },
    { query: "Hasır şapka plaj", category: "Giyim" },
    // Elektronik & Alet Edevat (13 adet)
    { query: "Dyson Supersonic saç kurutma", category: "Elektronik & Alet" },
    { query: "Apple AirPods Pro 2", category: "Elektronik & Alet" },
    { query: "Philips Airfryer XXL", category: "Elektronik & Alet" },
    { query: "JBL Charge 5 hoparlör", category: "Elektronik & Alet" },
    { query: "Xiaomi Mi Band 8", category: "Elektronik & Alet" },
    { query: "Roborock S8 robot süpürge", category: "Elektronik & Alet" },
    { query: "iPhone 15 Pro Max", category: "Elektronik & Alet" },
    { query: "GoPro Hero 12 kamera", category: "Elektronik & Alet" },
    { query: "Delonghi otomatik kahve makinesi", category: "Elektronik & Alet" },
    { query: "Stanley termos 1L", category: "Elektronik & Alet" },
    { query: "Dyson V15 dikey süpürge", category: "Elektronik & Alet" },
    { query: "HP Victus laptop", category: "Elektronik & Alet" },
    { query: "Xiaomi powerbank 20000", category: "Elektronik & Alet" }
  ],
  sonbahar: [
    // Giyim (12 adet)
    { query: "Erkek kapüşonlu sweatshirt", category: "Giyim" },
    { query: "Deri Chelsea bot erkek", category: "Giyim" },
    { query: "Erkek oduncu gömlek", category: "Giyim" },
    { query: "Kapüşonlu yağmurluk", category: "Giyim" },
    { query: "Süet bot kadın", category: "Giyim" },
    { query: "Kadın örgü hırka", category: "Giyim" },
    { query: "Trençkot klasik bej", category: "Giyim" },
    { query: "Kadın deri ceket blazer", category: "Giyim" },
    { query: "Triko elbise kadın", category: "Giyim" },
    { query: "Örme şal atkı", category: "Giyim" },
    { query: "Kargo pantolon haki", category: "Giyim" },
    { query: "Loafer ayakkabı kadın", category: "Giyim" },
    // Elektronik & Alet Edevat (13 adet)
    { query: "Xiaomi Air Purifier 4", category: "Elektronik & Alet" },
    { query: "Kindle Paperwhite", category: "Elektronik & Alet" },
    { query: "Sony WH-1000XM5 kulaklık", category: "Elektronik & Alet" },
    { query: "Nescafe Gold Barista makinesi", category: "Elektronik & Alet" },
    { query: "Philips dikey buharlı ütü", category: "Elektronik & Alet" },
    { query: "iPad Air M1", category: "Elektronik & Alet" },
    { query: "Logitech MX Master 3S mouse", category: "Elektronik & Alet" },
    { query: "Tefal akıllı düdüklü tencere", category: "Elektronik & Alet" },
    { query: "Asus Rog Ally konsol", category: "Elektronik & Alet" },
    { query: "Canon EOS R50 kamera", category: "Elektronik & Alet" },
    { query: "Bosch akülü matkap", category: "Elektronik & Alet" },
    { query: "Philips Sonicare diş fırçası", category: "Elektronik & Alet" },
    { query: "Xiaomi akıllı lazer metre", category: "Elektronik & Alet" }
  ],
  kis: [
    // Giyim (12 adet)
    { query: "Şişme mont su geçirmez erkek", category: "Giyim" },
    { query: "Kaşmir palto kaban kadın", category: "Giyim" },
    { query: "Termal içlik takım unisex", category: "Giyim" },
    { query: "Yarım fermuarlı polar sweatshirt", category: "Giyim" },
    { query: "Deri eldiven dokunmatik", category: "Giyim" },
    { query: "Yünlü bere", category: "Giyim" },
    { query: "Kar botu su geçirmez", category: "Giyim" },
    { query: "Triko elbise boğazlı kadn", category: "Giyim" },
    { query: "Kadife pantolon siyah", category: "Giyim" },
    { query: "Stanley termos 1L", category: "Giyim" },
    { query: "Yünlü kaşe kaban erkek", category: "Giyim" },
    { query: "Kar çorabı termal", category: "Giyim" },
    // Elektronik & Alet Edevat (13 adet)
    { query: "Xiaomi akıllı ısıtıcı konvektör", category: "Elektronik & Alet" },
    { query: "Delonghi yağlı radyatör", category: "Elektronik & Alet" },
    { query: "Philips katı meyve sıkacağı", category: "Elektronik & Alet" },
    { query: "Philips Hue akıllı aydınlatma", category: "Elektronik & Alet" },
    { query: "iPhone 15 Pro", category: "Elektronik & Alet" },
    { query: "PlayStation 5 Slim", category: "Elektronik & Alet" },
    { query: "Philips Lumea IPL epilasyon", category: "Elektronik & Alet" },
    { query: "JBL Bar 500 soundbar", category: "Elektronik & Alet" },
    { query: "Dyson V15 dikey süpürge", category: "Elektronik & Alet" },
    { query: "Bosch el aletleri çantası", category: "Elektronik & Alet" },
    { query: "Xiaomi akıllı hava nemlendirici", category: "Elektronik & Alet" },
    { query: "Kumtel infrared ısıtıcı", category: "Elektronik & Alet" },
    { query: "Sinbo elektrikli battaniye", category: "Elektronik & Alet" }
  ],
  ilkbahar: [
    // Giyim (12 adet)
    { query: "İnce blazer ceket erkek", category: "Giyim" },
    { query: "Jean ceket klasik mavi", category: "Giyim" },
    { query: "Kanvas pantolon bej erkek", category: "Giyim" },
    { query: "Çizgili poplin gömlek kadın", category: "Giyim" },
    { query: "Beyaz spor sneaker deri", category: "Giyim" },
    { query: "İnce rüzgarlık yağmurluk", category: "Giyim" },
    { query: "Pamuklu desenli şal", category: "Giyim" },
    { query: "Klasik loafer deri ayakkabı", category: "Giyim" },
    { query: "Pileli midi etek kadın", category: "Giyim" },
    { query: "Pamuklu sweatshirt bisiklet yaka", category: "Giyim" },
    { query: "Chino şort bej erkek", category: "Giyim" },
    { query: "Kanvas postacı omuz çantası", category: "Giyim" },
    // Elektronik & Alet Edevat (13 adet)
    { query: "DJI Mini 4 Pro drone", category: "Elektronik & Alet" },
    { query: "Apple Watch Series 9", category: "Elektronik & Alet" },
    { query: "Philips Sonicare diş fırçası", category: "Elektronik & Alet" },
    { query: "Xiaomi akıllı lazer metre", category: "Elektronik & Alet" },
    { query: "Tefal Easy Fry Grill & Steam", category: "Elektronik & Alet" },
    { query: "MacBook Air M3", category: "Elektronik & Alet" },
    { query: "Seagate 2TB taşınabilir disk", category: "Elektronik & Alet" },
    { query: "Anker Nebula Capsule projeksiyon", category: "Elektronik & Alet" },
    { query: "Bosch akülü vidalama matkap", category: "Elektronik & Alet" },
    { query: "Cosori akıllı airfryer", category: "Elektronik & Alet" },
    { query: "Anker Soundcore Space Q45", category: "Elektronik & Alet" },
    { query: "Logitech MX Keys klavye", category: "Elektronik & Alet" },
    { query: "TP-Link deco mesh wifi", category: "Elektronik & Alet" }
  ]
};

/**
 * Güncel mevsime göre mevsim anahtarını al
 */
function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'ilkbahar';
  if (month >= 5 && month <= 7) return 'yaz';
  if (month >= 8 && month <= 10) return 'sonbahar';
  return 'kis';
}

const PRODUCT_IMAGES = {
  // Yaz Giyim
  "Erkek keten gömlek": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop",
  "Erkek kargo cepli şort": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&auto=format&fit=crop",
  "Erkek basic tişört": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop",
  "Erkek keten pantolon bej": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop",
  "Polarize güneş gözlüğü": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop",
  "Erkek deniz şortu hızlı kuruyan": "https://images.unsplash.com/photo-1501290836517-b22a21c522a4?w=500&auto=format&fit=crop",
  "Mantar taban sandalet": "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=500&auto=format&fit=crop",
  "Kadın yazlık askılı bluz": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop",
  "Kadın keten pantolon": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop",
  "Hasır plaj çantası": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop",
  "Yazlık askılı keten elbise": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop",
  "Hasır şapka plaj": "https://images.unsplash.com/photo-1533481480093-f10f1e429f4f?w=500&auto=format&fit=crop",
  
  // Yaz Elektronik
  "Dyson Supersonic saç kurutma": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop",
  "Apple AirPods Pro 2": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop",
  "Philips Airfryer XXL": "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop",
  "JBL Charge 5 hoparlör": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop",
  "Xiaomi Mi Band 8": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop",
  "Roborock S8 robot süpürge": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&auto=format&fit=crop",
  "iPhone 15 Pro Max": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop",
  "GoPro Hero 12 kamera": "https://images.unsplash.com/photo-1565849906661-09d665e573fc?w=500&auto=format&fit=crop",
  "Delonghi otomatik kahve makinesi": "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=500&auto=format&fit=crop",
  "Stanley termos 1L": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop",
  "Dyson V15 dikey süpürge": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&auto=format&fit=crop",
  "HP Victus laptop": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop",
  "Xiaomi powerbank 20000": "https://images.unsplash.com/photo-1609592424109-dd7736630456?w=500&auto=format&fit=crop",

  // Sonbahar Giyim
  "Erkek kapüşonlu sweatshirt": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop",
  "Deri Chelsea bot erkek": "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500&auto=format&fit=crop",
  "Erkek oduncu gömlek": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop",
  "Kapüşonlu yağmurluk": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&auto=format&fit=crop",
  "Süet bot kadın": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop",
  "Kadın örgü hırka": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop",
  "Trençkot klasik bej": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop",
  "Kadın deri ceket blazer": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop",
  "Triko elbise kadın": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop",
  "Örme şal atkı": "https://images.unsplash.com/photo-1520635360276-79f3dbd809f6?w=500&auto=format&fit=crop",
  "Kargo pantolon haki": "https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=500&auto=format&fit=crop",
  "Loafer ayakkabı kadın": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&auto=format&fit=crop",

  // Kış Giyim
  "Şişme mont su geçirmez erkek": "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=500&auto=format&fit=crop",
  "Kaşmir palto kaban kadın": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop",
  "Termal içlik takım unisex": "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=500&auto=format&fit=crop",
  "Yarım fermuarlı polar sweatshirt": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop",
  "Deri eldiven dokunmatik": "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=500&auto=format&fit=crop",
  "Yünlü bere": "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&auto=format&fit=crop",
  "Kar botu su geçirmez": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop",
  "Triko elbise boğazlı kadn": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop",
  "Kadife pantolon siyah": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop",
  "Yünlü kaşe kaban erkek": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop",
  "Kar çorabı termal": "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=500&auto=format&fit=crop",

  // İlkbahar Giyim
  "İnce blazer ceket erkek": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop",
  "Jean ceket klasik mavi": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop",
  "Kanvas pantolon bej erkek": "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=500&auto=format&fit=crop",
  "Çizgili poplin gömlek kadın": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop",
  "Beyaz spor sneaker deri": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop",
  "İnce rüzgarlık yağmurluk": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&auto=format&fit=crop",
  "Pamuklu desenli şal": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop",
  "Klasik loafer deri ayakkabı": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&auto=format&fit=crop",
  "Pileli midi etek kadın": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop",
  "Pamuklu sweatshirt bisiklet yaka": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop",
  "Chino şort bej erkek": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&auto=format&fit=crop",
  "Kanvas postacı omuz çantası": "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=500&auto=format&fit=crop"
};

function getProductImageUrl(query, category) {
  if (PRODUCT_IMAGES[query]) {
    return PRODUCT_IMAGES[query];
  }
  if (category === "Giyim") {
    return "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop";
}

function extractProductsFromMoria(scriptText) {
  const match = scriptText.match(/"products"\s*:\s*\[/);
  if (!match) return [];
  
  const startIdx = match.index + match[0].length - 1;
  let braceCount = 0;
  let endIdx = -1;
  
  for (let j = startIdx; j < scriptText.length; j++) {
    if (scriptText[j] === '[') braceCount++;
    else if (scriptText[j] === ']') {
      braceCount--;
      if (braceCount === 0) {
        endIdx = j;
        break;
      }
    }
  }
  
  if (endIdx !== -1) {
    try {
      const jsonStr = scriptText.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Moria products JSON segmentini ayıklama hatası:", e.message);
    }
  }
  return [];
}

async function scrapeHepsiburadaLive(query) {
  const url = `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const scriptText = $('#reduxStore').text();
    if (!scriptText) return null;
    
    const data = JSON.parse(scriptText);
    let plHtml = null;
    if (data.voltranState && data.voltranState.fragmentsMap) {
      for (const key of Object.keys(data.voltranState.fragmentsMap)) {
        if (data.voltranState.fragmentsMap[key].ProductList) {
          plHtml = data.voltranState.fragmentsMap[key].ProductList.html;
          break;
        }
      }
    }
    let products = [];
    
    if (plHtml) {
      const $pl = cheerio.load(plHtml);
      $pl('script').each((i, el) => {
        const text = $pl(el).text();
        if (text.includes('window.MORIA.PRODUCTLIST') || text.includes('MORIA.PRODUCTLIST')) {
          products = extractProductsFromMoria(text);
        }
      });
    }
    
    if (products.length === 0) return null;
    
    return products.map(p => {
      const variant = p.variantList?.[0] || {};
      const imgTemplate = p.images?.[0]?.link || variant.images?.[0]?.link || "";
      const imgUrl = imgTemplate.replace('{size}', '500');
      const price = variant.listing?.priceInfo?.price || 0;
      return {
        title: variant.name || p.name || `${p.brand || ''} ${p.name || ''}`.trim(),
        link: variant.url ? `https://www.hepsiburada.com${variant.url}` : "",
        price: price,
        priceFormatted: price ? `${price.toLocaleString('tr-TR')} TL` : "Fiyat bilgisi yok",
        image: imgUrl
      };
    });
    
  } catch (error) {
    console.error("Hepsiburada canlı arama hatası:", error.message);
    return null;
  }
}

async function scrapeProductImageFromDetailUrl(url) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      'Referer': 'https://www.google.com/'
    };
    
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let imgUrl = $('meta[property="og:image"]').attr('content') ||
                 $('meta[property="og:image:secure_url"]').attr('content') ||
                 $('link[rel="image_src"]').attr('href') ||
                 $('meta[name="twitter:image"]').attr('content');
                 
    if (imgUrl && imgUrl.startsWith('http')) {
      return imgUrl;
    }
    return null;
  } catch (error) {
    console.error(`Canlı görsel çekme hatası (${url}):`, error.message);
    return null;
  }
}

/**
 * Bekleme süresi ekler
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Canlı verilerle 25 trend ürünü scrape et ve kaydet
 */
async function generateAndSaveWeeklyTrends() {
  console.log("⏱️ Haftalık Trend Listesi güncelleniyor, lütfen bekleyin...");
  const season = getCurrentSeason();
  const queries = SEASONAL_QUERIES[season];
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  const trendingProducts = [];
  
  for (let i = 0; i < queries.length; i++) {
    const item = queries[i];
    console.log(`[${i+1}/25] Tarama yapılıyor: ${item.query} (${item.category})`);
    
    let imageUrl = getProductImageUrl(item.query, item.category);
    let title = item.query;
    let price = 0;
    let priceFormatted = "Fiyat bilgisi yok";
    let hbLink = `https://www.hepsiburada.com/ara?q=${encodeURIComponent(item.query)}`;
    let tyLink = `https://www.trendyol.com/sr?q=${encodeURIComponent(item.query)}`;
    let pzLink = `https://www.pazarama.com/arama?q=${encodeURIComponent(item.query)}`;
    
    try {
      console.log(`🔍 Hepsiburada üzerinden veri ve görsel aranıyor: ${item.query}`);
      const hbResults = await scrapeHepsiburadaLive(item.query);
      
      if (hbResults && hbResults.length > 0) {
        const product = hbResults[0];
        title = product.title;
        price = product.price || 0;
        priceFormatted = product.priceFormatted;
        hbLink = product.link || hbLink;
        if (product.image && product.image.startsWith('http')) {
          imageUrl = product.image;
          console.log(`✅ Gerçek ürün görseli Hepsiburada'dan alındı: ${imageUrl}`);
        }
      } else {
        console.log(`⚠️ Hepsiburada sonucu boş döndü, Trendyol fallback devreye giriyor...`);
        const results = await scrapeTrendyol(item.query, 1);
        
        if (results && results.length > 0) {
          const product = results[0];
          title = product.title || title;
          price = product.price || price;
          priceFormatted = product.priceFormatted || priceFormatted;
          tyLink = product.link || tyLink;
          
          if (product.link && product.link.startsWith('http')) {
            console.log(`🔍 Detay sayfasından gerçek görsel çekiliyor: ${product.link}`);
            const liveImg = await scrapeProductImageFromDetailUrl(product.link);
            if (liveImg) {
              imageUrl = liveImg;
              console.log(`✅ Gerçek ürün görseli detay sayfasından alındı: ${imageUrl}`);
            }
          }
        }
      }
      
      trendingProducts.push({
        rank: i + 1,
        title: title,
        category: item.category,
        price: price,
        priceFormatted: priceFormatted,
        image: imageUrl,
        links: {
          trendyol: tyLink,
          hepsiburada: hbLink,
          pazarama: pzLink
        }
      });
      
      await sleep(1000);
      
    } catch (error) {
      console.error(`Tarama hatası (${item.query}):`, error.message);
      trendingProducts.push({
        rank: i + 1,
        title: title,
        category: item.category,
        price: price,
        priceFormatted: priceFormatted,
        image: imageUrl,
        links: {
          trendyol: tyLink,
          hepsiburada: hbLink,
          pazarama: pzLink
        }
      });
    }
  }
  
  const outputData = {
    updatedAt: new Date().toISOString(),
    season: season,
    totalProducts: trendingProducts.length,
    products: trendingProducts
  };
  
  fs.writeFileSync(TRENDS_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`✅ Haftalık Trend Listesi başarıyla oluşturuldu ve kaydedildi! (${TRENDS_FILE})`);
  return outputData;
}

/**
 * Önbellekteki trend verilerini yükle. Önbellek yoksa veya 7 günden eskiyse otomatik güncelle.
 */
async function getOrUpdateWeeklyTrends() {
  try {
    if (fs.existsSync(TRENDS_FILE)) {
      const stats = fs.statSync(TRENDS_FILE);
      const fileAgeMs = Date.now() - stats.mtimeMs;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      
      if (fileAgeMs < sevenDaysMs) {
        console.log("📦 Haftalık Trendler önbellekten yükleniyor...");
        const fileContent = fs.readFileSync(TRENDS_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    }
    
    // Önbellek yoksa veya eskiyse arka planda güncelle
    return await generateAndSaveWeeklyTrends();
  } catch (error) {
    console.error("Önbellekten trend okuma hatası, sıfırdan üretiliyor...", error.message);
    return await generateAndSaveWeeklyTrends();
  }
}

module.exports = {
  getOrUpdateWeeklyTrends,
  generateAndSaveWeeklyTrends
};
