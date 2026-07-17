/**
 * HausPort AI - Araç Tanımları (Tool Definitions)
 * 
 * OpenAI uyumlu format - LLM'in çağırabileceği araçlar
 * OpenRouter tool calling desteği için kullanılır
 */

// Tüm araç tanımları - OpenAI function calling formatında
const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Türk e-ticaret sitelerinde ürün ara. Hepsiburada, Trendyol, Cimri, Akakçe ve Pazarama üzerinde arama yapar. Sonuçlar başlık, fiyat, link ve site bilgisi içerir.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Aranacak ürün adı veya anahtar kelimeler. Örn: 'kışlık mont erkek', 'samsung galaxy s24', 'nike air force 1'"
          },
          sites: {
            type: "array",
            items: { type: "string" },
            description: "Arama yapılacak siteler. Geçerli değerler: 'hepsiburada', 'trendyol', 'cimri', 'akakce', 'pazarama'. Boş bırakılırsa tüm sitelerde aranır."
          },
          max_results: {
            type: "number",
            description: "Döndürülecek maksimum sonuç sayısı. Varsayılan: 5, Maksimum: 10"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_prices",
      description: "Bir ürünün farklı e-ticaret sitelerindeki fiyatlarını karşılaştır. Tüm büyük Türk e-ticaret sitelerini tarar ve fiyata göre sıralar.",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Fiyatı karşılaştırılacak ürün adı. Mümkün olduğunca spesifik olun. Örn: 'Apple iPhone 15 128GB', 'Dyson V15 Detect'"
          }
        },
        required: ["product_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_cheapest",
      description: "Aynı kalitede en ucuz 2 ürünü bul. Kalite anahtar kelimelerine göre filtreleme yapar ve en uygun fiyatlı iki seçeneği döndürür.",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Aranacak ürün adı. Örn: 'kablosuz kulaklık', 'erkek kışlık bot'"
          },
          quality_keywords: {
            type: "string",
            description: "Kalite/özellik filtre kelimeleri, virgülle ayrılmış. Örn: 'su geçirmez, deri, hakiki', 'bluetooth 5.0, gürültü engelleme'"
          }
        },
        required: ["product_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Bir Türk şehrinin güncel hava durumunu al. Sıcaklık, nem, rüzgar ve hava koşullarını döndürür. Giyim önerisi de içerir. Kullanıcının şehrine göre kıyafet önerisi yapmak için kullan.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "Hava durumu sorgulanacak şehir adı. Türkçe yazılmalı. Örn: 'İstanbul', 'Ankara', 'İzmir', 'Antalya'"
          }
        },
        required: ["city"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_trends",
      description: "Moda ve sezonluk trendleri getir. Türkiye'deki güncel moda trendleri, popüler renkler, stiller ve öneriler hakkında bilgi verir. Bölgeye göre özelleştirilmiş öneriler sunar.",
      parameters: {
        type: "object",
        properties: {
          season: {
            type: "string",
            enum: ["ilkbahar", "yaz", "sonbahar", "kış"],
            description: "Trend bilgisi istenilen mevsim"
          },
          category: {
            type: "string",
            enum: ["giyim", "ayakkabı", "aksesuar", "elektronik", "ev"],
            description: "Trend kategorisi"
          },
          region: {
            type: "string",
            description: "Türkiye bölgesi. Örn: 'Ege', 'Marmara', 'Karadeniz', 'İç Anadolu', 'Akdeniz', 'Doğu Anadolu', 'Güneydoğu Anadolu'"
          }
        },
        required: ["season", "category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "process_xlsx_upload",
      description: "Yüklenen XLSX dosyasını işle. Dosyadaki ürün listesini okur ve belirtilen e-ticaret sitesinde her ürünü arayarak linkler ve fiyat bilgileri ekler.",
      parameters: {
        type: "object",
        properties: {
          file_id: {
            type: "string",
            description: "Yüklenen dosyanın benzersiz kimliği (upload API'sinden döner)"
          },
          target_site: {
            type: "string",
            description: "Ürünlerin aranacağı hedef site. Geçerli değerler: 'trendyol', 'hepsiburada', 'cimri', 'akakce', 'pazarama'"
          }
        },
        required: ["file_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Kullanıcının kayıtlı profil bilgilerini getir. Şehir, beden, stil tercihleri, favori markalar gibi bilgileri içerir. Kişiselleştirilmiş öneriler için kullan.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_user_profile",
      description: "Kullanıcının profil bilgisini güncelle. Konuşma sırasında öğrenilen tercihleri (şehir, beden, stil, favori marka vb.) kaydetmek için kullan.",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            description: "Güncellenecek profil alanı. Geçerli değerler: 'city', 'size', 'style', 'favorite_brands', 'budget', 'gender', 'interests', 'name', 'age'"
          },
          value: {
            type: "string",
            description: "Alanın yeni değeri"
          }
        },
        required: ["field", "value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_trendyol",
      description: "Trendyol üzerinde doğrudan ürün arar. Ürünlerin gerçek zamanlı fiyat, başlık ve link bilgilerine 100% doğru ulaşmak için kullan.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Aranacak ürün adı. Örn: 'Mavi keten gömlek'" },
          max_results: { type: "number", description: "Maksimum sonuç sayısı (varsayılan 5)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_hepsiburada",
      description: "Hepsiburada üzerinde doğrudan ürün arar. Ürünlerin gerçek zamanlı fiyat, başlık ve link bilgilerine 100% doğru ulaşmak için kullan.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Aranacak ürün adı. Örn: 'Bosch çapa makinesi'" },
          max_results: { type: "number", description: "Maksimum sonuç sayısı (varsayılan 5)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_pazarama",
      description: "Pazarama üzerinde doğrudan ürün arar. Ürünlerin gerçek zamanlı fiyat, başlık ve link bilgilerine 100% doğru ulaşmak için kullan.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Aranacak ürün adı. Örn: 'Kaan çapa makinesi'" },
          max_results: { type: "number", description: "Maksimum sonuç sayısı (varsayılan 5)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_akakce",
      description: "Akakçe üzerinde doğrudan ürün arar. Ürünlerin fiyat ve karşılaştırma linklerine 100% doğru ulaşmak için kullan.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Aranacak ürün adı. Örn: 'iPhone 15'" },
          max_results: { type: "number", description: "Maksimum sonuç sayısı (varsayılan 5)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_cimri",
      description: "Cimri üzerinde doğrudan ürün arar. Ürünlerin fiyat ve karşılaştırma linklerine 100% doğru ulaşmak için kullan.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Aranacak ürün adı. Örn: 'Dyson süpürge'" },
          max_results: { type: "number", description: "Maksimum sonuç sayısı (varsayılan 5)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_langchain_seasonal_trends",
      description: "LangChain/Agentik tabanlı mevsimlik trend aracı. Belirtilen mevsim için popüler 10 giyim ve 10 teknoloji/alet-edevat ürünü olmak üzere toplam 20 popüler ürünü Trendyol, Hepsiburada, Pazarama ve Akakçe arama adresleriyle birlikte listeler.",
      parameters: {
        type: "object",
        properties: {
          season: {
            type: "string",
            description: "Trendleri istenecek mevsim. Geçerli değerler: 'ilkbahar', 'yaz', 'sonbahar', 'kış'. Boş bırakılırsa güncel mevsime göre döner."
          },
          gender: {
            type: "string",
            description: "Kullanıcının cinsiyeti ('erkek' veya 'kadın'). Trend giyim listesini kişiselleştirmek için kullanılır."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_price_history_graph",
      description: "Bir ürünün son 3 aylık fiyat geçmişi grafik verilerini, ASCII grafik çizimini ve trend analizini getirir. Fiyat dalgalanmalarını ve alım tavsiyelerini yorumlar.",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Fiyat grafiği analiz edilecek ürün adı. Örn: 'Bosch çapa makinesi', 'iPhone 15 Pro Max'"
          },
          site: {
            type: "string",
            description: "Arama yapılacak özel site (isteğe bağlı). Örn: 'trendyol', 'hepsiburada', 'akakce'"
          }
        },
        required: ["product_name"]
      }
    }
  }
];

module.exports = { toolDefinitions };
