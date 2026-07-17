/**
 * HausPort AI - Trend Danışmanı
 * 
 * 2025-2026 Türkiye moda ve trend veritabanı
 * Mevsim, kategori ve bölgeye göre özelleştirilmiş öneriler sunar
 */

// 2025-2026 Trend Veritabanı
const trendDatabase = {
  // ===== İLKBAHAR TRENDLERİ =====
  ilkbahar: {
    giyim: {
      trends: [
        {
          name: "Pastel Tonlar",
          description: "Lavanta, bebek mavisi, soft pembe ve mint yeşili bu sezon çok popüler 🌸",
          items: ["Pastel blazer ceket", "Oversize gömlek", "Wide-leg pantolon", "Midi etek"]
        },
        {
          name: "Denim Kombinleri",
          description: "Denim on denim, farklı yıkama tonlarıyla kombinlenen jean'ler trend 👖",
          items: ["Boyfriend jean", "Denim ceket", "Jean gömlek", "Denim etek"]
        },
        {
          name: "Trençkot Şıklığı",
          description: "Klasik trençkotlar modern kesimlerle geri döndü 🧥",
          items: ["Oversize trençkot", "Kemer detaylı trençkot", "Renkli trençkot"]
        },
        {
          name: "Katmanlı Giyim",
          description: "Hırka + tişört + yelek kombinleri ilkbaharın vazgeçilmezi",
          items: ["Örme hırka", "Yelek", "İnce kazak", "Crop hırka"]
        }
      ],
      colors: ["Lavanta 💜", "Bebek mavisi 💙", "Mint yeşili 💚", "Soft pembe 🩷", "Krem", "Bej"],
      styles: ["Smart Casual", "Effortless Chic", "Minimalist", "Romantik"]
    },
    ayakkabı: {
      trends: [
        {
          name: "Loafer Tutkusu",
          description: "Platform ve klasik loafer'lar her kombinle uyumlu 👞",
          items: ["Zincir detaylı loafer", "Platform loafer", "Süet loafer"]
        },
        {
          name: "Sneaker Konforu",
          description: "Chunky sneaker'lar ve retro modeller popüler 👟",
          items: ["New Balance 530", "Adidas Samba", "Nike Air Force 1", "Veja Campo"]
        },
        {
          name: "Mary Jane Geri Döndü",
          description: "Kalın tabanlı Mary Jane'ler tüm yaş gruplarında trend",
          items: ["Platform Mary Jane", "Kadife Mary Jane", "Parlak deri Mary Jane"]
        }
      ],
      colors: ["Beyaz", "Bej", "Açık kahve", "Pastel tonlar"],
      styles: ["Retro", "Minimalist", "Preppy"]
    },
    aksesuar: {
      trends: [
        {
          name: "Statement Çantalar",
          description: "Büyük, dikkat çekici çantalar bu sezon çok moda 👜",
          items: ["Tote çanta", "Hasır çanta", "Zincir askılı çanta"]
        },
        {
          name: "Altın Takılar",
          description: "Katmanlı altın kolyeler ve büyük küpeler trend 💍",
          items: ["Katmanlı kolye", "Hoop küpe", "Chunky bilezik"]
        }
      ],
      colors: ["Altın", "Gümüş", "Doğal tonlar"],
      styles: ["Boho", "Elegant", "Minimalist"]
    },
    elektronik: {
      trends: [
        {
          name: "Akıllı Saat Furyası",
          description: "Sağlık takibi ve stil bir arada 📱⌚",
          items: ["Apple Watch Ultra 2", "Samsung Galaxy Watch 6", "Xiaomi Watch S3"]
        },
        {
          name: "Kablosuz Kulaklık",
          description: "ANC özellikli kulaklıklar vazgeçilmez 🎧",
          items: ["AirPods Pro 2", "Sony WH-1000XM5", "Samsung Galaxy Buds3 Pro"]
        }
      ],
      colors: ["Gece mavisi", "Grafit", "Yıldız beyazı"],
      styles: ["Premium", "Sporcu", "Günlük"]
    },
    ev: {
      trends: [
        {
          name: "Japandi Stili",
          description: "Japon minimalizmi ve İskandinav sıcaklığının birleşimi 🏠",
          items: ["Doğal ahşap mobilya", "Seramik vazo", "Keten perde", "Bambu aksesuarlar"]
        },
        {
          name: "Bahar Çiçekleri",
          description: "Ev dekorasyonunda doğal çiçek ve bitki kullanımı 🌿",
          items: ["Teraryum", "Saksı bitkileri", "Yapay çiçek aranjman", "Çiçek desenli yastık"]
        }
      ],
      colors: ["Krem", "Doğal ahşap", "Yeşil tonları", "Toprak tonları"],
      styles: ["Japandi", "Boho", "Minimalist"]
    }
  },

  // ===== YAZ TRENDLERİ =====
  yaz: {
    giyim: {
      trends: [
        {
          name: "Crochet & Örgü",
          description: "El örgüsü toplar, elbiseler ve bikiniler yaz hitlerinden 🧶",
          items: ["Crochet top", "Örgü plaj elbisesi", "Crochet çanta", "Örgü bikini"]
        },
        {
          name: "Tropikal Desenler",
          description: "Palmiye yaprakları, çiçek desenleri ve canlı renkler 🌺",
          items: ["Hawaii gömlek", "Çiçekli elbise", "Desenli şort", "Tropikal kimono"]
        },
        {
          name: "Keten Serinliği",
          description: "Doğal keten kumaşlar yazın en rahat tercihi 🌿",
          items: ["Keten pantolon", "Keten gömlek", "Keten elbise", "Keten şort"]
        },
        {
          name: "Cut-Out Detaylar",
          description: "Stratejik kesimli elbiseler ve toplar cesur bir yaz stili sunuyor ✂️",
          items: ["Cut-out elbise", "Asymmetrik top", "Tek omuz bluz"]
        }
      ],
      colors: ["Mercan 🧡", "Turkuaz 💎", "Limon sarısı 💛", "Beyaz", "Fuşya", "Deniz mavisi"],
      styles: ["Boho Chic", "Resort", "Coastal Grandmother", "Y2K"]
    },
    ayakkabı: {
      trends: [
        {
          name: "Platform Sandalet",
          description: "Rahat ve şık platform sandaletler plajdan şehre her yere 🩴",
          items: ["Espadril sandalet", "Platform parmak arası", "Dolgu topuk sandalet"]
        },
        {
          name: "Slider Terlik",
          description: "Rahat ve şık slider'lar günlük kullanımın yıldızı",
          items: ["Birkenstock Arizona", "Nike Slide", "Deri slider"]
        }
      ],
      colors: ["Beyaz", "Altın", "Taba", "Neon tonlar"],
      styles: ["Plaj", "Günlük", "Boho"]
    },
    aksesuar: {
      trends: [
        {
          name: "Oversize Güneş Gözlüğü",
          description: "70'ler esintili büyük çerçeveler geri döndü 🕶️",
          items: ["Cat-eye güneş gözlüğü", "Aviator", "Shield gözlük"]
        },
        {
          name: "Deniz Kabuğu Takılar",
          description: "Doğal deniz kabuğu ve boncuk takılar plaj modası 🐚",
          items: ["Deniz kabuğu kolye", "Boncuk bilezik", "Halhal"]
        }
      ],
      colors: ["Altın", "Turkuaz", "Mercan", "Beyaz"],
      styles: ["Boho", "Resort", "Denizci"]
    },
    elektronik: {
      trends: [
        {
          name: "Taşınabilir Hoparlör",
          description: "Su geçirmez Bluetooth hoparlörler yaz eğlencesinin olmazsa olmazı 🔊",
          items: ["JBL Flip 6", "Marshall Emberton II", "Sony SRS-XB100"]
        },
        {
          name: "Aksiyon Kamera",
          description: "Tatil anılarınızı ölümsüzleştirin 📸",
          items: ["GoPro Hero 13", "DJI Osmo Action 4", "Insta360 X4"]
        }
      ],
      colors: ["Siyah", "Mavi", "Kırmızı"],
      styles: ["Outdoor", "Sporcu", "Maceraperest"]
    },
    ev: {
      trends: [
        {
          name: "Dış Mekan Dekorasyonu",
          description: "Balkon ve bahçe düzenlemesi yazın en popüler trendi 🌻",
          items: ["Dış mekan yastıkları", "LED aydınlatma", "Hamak", "Bahçe mobilyası"]
        },
        {
          name: "Deniz Esintisi",
          description: "Mavi-beyaz tonlarda deniz temalı dekorasyon 🌊",
          items: ["Deniz temalı yastık", "Halat aksesuarlar", "Cam vazo", "Çizgili havlu"]
        }
      ],
      colors: ["Mavi tonları", "Beyaz", "Kum rengi", "Yeşil"],
      styles: ["Coastal", "Boho", "Mediterranean"]
    }
  },

  // ===== SONBAHAR TRENDLERİ =====
  sonbahar: {
    giyim: {
      trends: [
        {
          name: "Karamel & Toprak Tonları",
          description: "Sıcak toprak tonları sonbaharın renk paleti 🍂",
          items: ["Karamel palto", "Kahverengi deri ceket", "Bordo kazak", "Hardal hırka"]
        },
        {
          name: "Deri & Suni Deri",
          description: "Deri ceketler ve pantolonlar güçlü bir sonbahar stili yaratıyor 🖤",
          items: ["Biker ceket", "Deri pantolon", "Deri etek", "Shacket (gömlek ceket)"]
        },
        {
          name: "Örgü & Trikotaj",
          description: "Kalın örgü kazaklar ve hırkalar sonbaharın sıcacık trendi 🧶",
          items: ["Oversize kazak", "Boğazlı triko", "Örgü yelek", "Triko elbise"]
        },
        {
          name: "Ekose Desen",
          description: "Klasik ekose desenler ceket, etek ve şallarda 🔳",
          items: ["Ekose blazer", "Ekose etek", "Ekose atkı", "Ekose gömlek"]
        }
      ],
      colors: ["Karamel 🧡", "Bordo 🍷", "Hardal 💛", "Zeytin yeşili 🫒", "Kahverengi", "Tarçın"],
      styles: ["Dark Academia", "Quiet Luxury", "Old Money", "Preppy"]
    },
    ayakkabı: {
      trends: [
        {
          name: "Chelsea Bot",
          description: "Kalın tabanlı Chelsea botlar sonbaharın favori ayakkabısı 🥾",
          items: ["Dr. Martens Chelsea", "Platform Chelsea bot", "Süet Chelsea bot"]
        },
        {
          name: "Uzun Çizme",
          description: "Diz üstü ve diz altı çizmeler geri döndü 👢",
          items: ["Deri uzun çizme", "Süet çizme", "Kovboy çizme"]
        }
      ],
      colors: ["Siyah", "Kahverengi", "Bordo", "Haki"],
      styles: ["Grunge", "Klasik", "Western"]
    },
    aksesuar: {
      trends: [
        {
          name: "Şal & Atkı",
          description: "Büyük, yumuşak şallar ve atkılar sonbaharın olmazsa olmazı 🧣",
          items: ["Yün atkı", "Kaşmir şal", "Battaniye şal"]
        },
        {
          name: "Bere & Şapka",
          description: "Fransız esintili bereler ve fötr şapkalar trend 🎩",
          items: ["Yün bere", "Fötr şapka", "Baker boy şapka"]
        }
      ],
      colors: ["Bordo", "Karamel", "Gri", "Lacivert"],
      styles: ["Parisian Chic", "Dark Academia", "Preppy"]
    },
    elektronik: {
      trends: [
        {
          name: "E-Kitap Okuyucu",
          description: "Sonbahar akşamları için mükemmel okuma arkadaşı 📚",
          items: ["Kindle Paperwhite", "Kobo Libra 2", "Onyx Boox"]
        },
        {
          name: "Akıllı Ev Sistemleri",
          description: "Evde konfor artık akıllı cihazlarla 🏠",
          items: ["Akıllı termostat", "Robot süpürge", "Akıllı aydınlatma"]
        }
      ],
      colors: ["Siyah", "Gümüş", "Beyaz"],
      styles: ["Minimalist", "Teknoloji", "Akıllı Ev"]
    },
    ev: {
      trends: [
        {
          name: "Hygge Konsepti",
          description: "Danimarka'dan gelen sıcacık ev konsepti 🕯️",
          items: ["Tüylü battaniye", "Aromaterapi mum", "Peluş yastık", "Ahşap tepsi"]
        },
        {
          name: "Sonbahar Renkleri",
          description: "Turuncu, bordo ve altın tonlarıyla ev dekorasyonu 🍁",
          items: ["Kadife yastık", "Sonbahar çelenk", "Seramik mug", "Örgü battaniye"]
        }
      ],
      colors: ["Bordo", "Turuncu", "Altın", "Koyu yeşil"],
      styles: ["Hygge", "Rustic", "Vintage"]
    }
  },

  // ===== KIŞ TRENDLERİ =====
  kış: {
    giyim: {
      trends: [
        {
          name: "Puffer Jacket",
          description: "Oversize şişme montlar kışın hem sıcak hem şık 🧥",
          items: ["Oversize puffer", "Crop puffer", "Uzun şişme mont", "Parlak puffer"]
        },
        {
          name: "Monokrom Kombinler",
          description: "Tek renk tonlarında head-to-toe kombinler çok şık 🖤",
          items: ["Siyah total look", "Gri tonları", "Beyaz kış kombini", "Kahverengi monokrom"]
        },
        {
          name: "Kadife & Velvet",
          description: "Kadife kumaşlar kışın lüks dokunuşu ✨",
          items: ["Kadife blazer", "Kadife pantolon", "Velvet elbise", "Kadife gömlek"]
        },
        {
          name: "Teddy Coat",
          description: "Yumuşacık peluş montlar kışın en sevilen trendi 🧸",
          items: ["Oversize teddy coat", "Teddy ceket", "Teddy yelek"]
        }
      ],
      colors: ["Siyah 🖤", "Beyaz ❄️", "Gri", "Lacivert", "Bordo 🍷", "Koyu yeşil 🌲"],
      styles: ["Quiet Luxury", "Monokrom", "Sporty Chic", "Old Money"]
    },
    ayakkabı: {
      trends: [
        {
          name: "Kışlık Bot",
          description: "Su geçirmez, sıcak tutan botlar kışın vazgeçilmezi 🥾",
          items: ["Timberland 6-inch", "UGG Classic", "Dr. Martens 1460", "Kar botu"]
        },
        {
          name: "Topuklu Bot",
          description: "Kalın topuklu ve sivri burunlu botlar şık tercihlerin başında 👠",
          items: ["Block heel bot", "Pointed toe bot", "Sock boot"]
        }
      ],
      colors: ["Siyah", "Kahverengi", "Krem", "Beyaz"],
      styles: ["Klasik", "Şık", "Günlük"]
    },
    aksesuar: {
      trends: [
        {
          name: "Bere & Eldiven Setleri",
          description: "Uyumlu bere-atkı-eldiven setleri kışın şık detayı 🧤",
          items: ["Kaşmir set", "Yün bere-atkı seti", "Deri eldiven"]
        },
        {
          name: "Statement Kolyeler",
          description: "Kalın zincir kolyeler ve büyük pandantifler kışlık kombini tamamlıyor 📿",
          items: ["Chunky zincir kolye", "Büyük pandantif", "Katmanlı kolye"]
        }
      ],
      colors: ["Siyah", "Gümüş", "Altın", "Bordo"],
      styles: ["Lüks", "Minimalist", "Gotik"]
    },
    elektronik: {
      trends: [
        {
          name: "Gaming Dünyası",
          description: "Kış aylarının en sevilen aktivitesi: gaming 🎮",
          items: ["PlayStation 5 Pro", "Nintendo Switch 2", "Gaming kulaklık", "Gaming klavye"]
        },
        {
          name: "Isıtıcı Teknoloji",
          description: "Akıllı ısıtma çözümleri kışın konfor sağlıyor 🔥",
          items: ["Akıllı termostat", "Elektrikli battaniye", "Ayak ısıtıcı", "Seramik ısıtıcı"]
        }
      ],
      colors: ["Siyah", "Beyaz", "RGB 🌈"],
      styles: ["Gamer", "Teknoloji", "Ev Konforu"]
    },
    ev: {
      trends: [
        {
          name: "Kış Sıcaklığı",
          description: "Kalın battaniyeler, mumlar ve sıcak tonlarla kışa hazırlık 🕯️",
          items: ["Kürk battaniye", "Aromaterapi mum seti", "Peluş halı", "Sıcak çikolata seti"]
        },
        {
          name: "Yılbaşı Dekorasyonu",
          description: "Yılbaşı ağacı süslemeleri ve led ışıklar ✨🎄",
          items: ["LED çam ağacı", "Dekoratif ışık zinciri", "Yılbaşı süs seti", "Adventskranz"]
        }
      ],
      colors: ["Kırmızı", "Altın", "Yeşil", "Beyaz"],
      styles: ["Festive", "Hygge", "Rustic Chic"]
    }
  }
};

// Bölgeye özel ek öneriler
const regionalTips = {
  "Ege": {
    general: "Ege bölgesinin ılıman iklimi sayesinde daha hafif katmanlar tercih edebilirsiniz.",
    ilkbahar: "Ege'de ilkbahar erken gelir! Hafif kumaşlara geçiş yapabilirsiniz. Zeytinyağı festivalleri için rahat kıyafetler tercih edin.",
    yaz: "Ege sahilleri için mayo, pareo ve rahat plaj kıyafetleri şart! Bodrum, Çeşme ve Alaçatı'da boho stili çok popüler.",
    sonbahar: "Zeytinyağı hasadı zamanı! Rahat ve şık outdoor kıyafetler tercih edin. Hafif ceket yeterli olur.",
    kış: "Ege kışları ılımandır. Kalın mont yerine orta kalınlıkta ceket yeterli. Yağmura karşı su geçirmez bir ceket bulundurun."
  },
  "Marmara": {
    general: "İstanbul modası Türkiye'nin trendlerini belirler! Şık ve fonksiyonel kombinler tercih edin.",
    ilkbahar: "İstanbul'da ilkbahar değişken olur. Katmanlı giyinin ve yanınızda şemsiye bulundurun.",
    yaz: "Bosphorus'ta akşam yemekleri için smart casual kıyafetler hazır bulundurun. Adalar için rahat ayakkabı şart!",
    sonbahar: "İstanbul sonbaharı muhteşemdir. Dark academia stili bu şehre çok yakışır. Ekose ve toprak tonları tercih edin.",
    kış: "İstanbul kışları soğuk ve rüzgarlı olabilir. Rüzgar geçirmez kalın mont, atkı ve bere şart!"
  },
  "Karadeniz": {
    general: "Karadeniz'in yağışlı iklimi için su geçirmez kıyafetler vazgeçilmez!",
    ilkbahar: "Yayla yürüyüşleri için outdoor kıyafetler tercih edin. Yağmurluk her zaman yanınızda olsun.",
    yaz: "Karadeniz yazları bile serin olabilir. İnce polar veya hırka bulundurun. Doğa sporları için fonksiyonel kıyafetler tercih edin.",
    sonbahar: "Çay hasadı zamanı! Su geçirmez bot ve yağmurluk şart. Katmanlı giyim en iyisi.",
    kış: "Karadeniz kışları bol karlı! Kalın kışlık mont, kar botu ve termal giysiler tercih edin."
  },
  "İç Anadolu": {
    general: "Ankara ve çevresinin karasal iklimi için hem sıcak hem soğuk havalara hazırlıklı olun.",
    ilkbahar: "Gece-gündüz sıcaklık farkı büyük! Katmanlı giyim şart. Sabah ceket, öğlen tişört gerekebilir.",
    yaz: "Bozkır sıcağı kurutucudur. Açık renkli, pamuklu kıyafetler tercih edin. Güneş koruma şart!",
    sonbahar: "Erken soğuklar başlar. Kalın kazak ve mont hazır olsun. Kapadokya gezisi için rahat outdoor kıyafetler tercih edin.",
    kış: "Çok soğuk kışlar! -10°C'yi görebilir. Kalın mont, termal içlik, bere-atkı-eldiven seti şart!"
  },
  "Akdeniz": {
    general: "Akdeniz'in sıcak iklimi için hafif ve nefes alan kumaşlar tercih edin.",
    ilkbahar: "Antalya'da ilkbahar yazdan farksızdır! Hafif kıyafetler ve güneş koruma yeterli.",
    yaz: "Deniz, kum, güneş! Mayo, şort ve hafif elbiseler en çok ihtiyacınız olan parçalar. Güneş kremi SPF50+ şart!",
    sonbahar: "Akdeniz'de sonbahar bile sıcak geçer. Denize girebilirsiniz! Hafif kıyafetler yeterli.",
    kış: "Akdeniz kışları ılıman. İnce ceket veya hırka yeterli. Narenciye bahçeleri için rahat kıyafetler tercih edin."
  },
  "Doğu Anadolu": {
    general: "Doğu'nun sert kışları için kaliteli, sıcak tutan kıyafetler şart!",
    ilkbahar: "Karlar yeni eriyor! Hâlâ soğuk olabilir. Kalın ceket ve su geçirmez ayakkabı tercih edin.",
    yaz: "Yaylalar için outdoor kıyafetler tercih edin. Gece serin olabilir, yanınıza polar alın.",
    sonbahar: "Erken kış başlar! Kasım'da kar yağabilir. Kışlık hazırlıklarınızı erken yapın.",
    kış: "Türkiye'nin en soğuk bölgesi! -20°C ve altı görülebilir. En kalın mont, termal kıyafetler, kar botu ve tam kışlık set şart!"
  },
  "Güneydoğu Anadolu": {
    general: "Güneydoğu'nun sıcak yazları ve soğuk kışları için mevsime göre hazırlıklı olun.",
    ilkbahar: "Ilıman havalar başlar. Pamuklu ve hafif kıyafetler rahat olur. Kültür turları için rahat ayakkabı tercih edin.",
    yaz: "Çok sıcak! 40°C'yi görebilir. Açık renkli, bol, pamuklu kıyafetler şart. Bol su için!",
    sonbahar: "Hâlâ sıcak günler olabilir. Hafif ceket akşamları yeterli. Antep fıstığı hasadı zamanı! 🥜",
    kış: "Soğuk ama Doğu kadar sert değil. Orta kalınlıkta mont ve kazak yeterli."
  }
};

/**
 * Geçerli mevsimi otomatik belirle
 */
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return "ilkbahar";
  if (month >= 6 && month <= 8) return "yaz";
  if (month >= 9 && month <= 11) return "sonbahar";
  return "kış";
}

/**
 * Trend bilgisi getir
 * @param {string} season - Mevsim (ilkbahar, yaz, sonbahar, kış)
 * @param {string} category - Kategori (giyim, ayakkabı, aksesuar, elektronik, ev)
 * @param {string} region - Bölge (opsiyonel)
 * @returns {Object} Trend bilgileri
 */
async function getTrends(season, category, region) {
  try {
    // Mevsim belirtilmemişse otomatik belirle
    const targetSeason = season || getCurrentSeason();
    const targetCategory = category || "giyim";
    
    // Geçerli mevsim kontrolü
    const validSeasons = ["ilkbahar", "yaz", "sonbahar", "kış"];
    if (!validSeasons.includes(targetSeason)) {
      return {
        error: true,
        message: `Geçersiz mevsim: "${targetSeason}". Geçerli değerler: ${validSeasons.join(", ")}`
      };
    }
    
    // Geçerli kategori kontrolü
    const validCategories = ["giyim", "ayakkabı", "aksesuar", "elektronik", "ev"];
    if (!validCategories.includes(targetCategory)) {
      return {
        error: true,
        message: `Geçersiz kategori: "${targetCategory}". Geçerli değerler: ${validCategories.join(", ")}`
      };
    }
    
    // Trend verisini al
    const seasonData = trendDatabase[targetSeason];
    const categoryData = seasonData[targetCategory];
    
    // Sonuç objesi oluştur
    const result = {
      season: targetSeason,
      seasonEmoji: { ilkbahar: "🌸", yaz: "☀️", sonbahar: "🍂", kış: "❄️" }[targetSeason],
      category: targetCategory,
      year: "2025-2026",
      trends: categoryData.trends,
      trendingColors: categoryData.colors,
      popularStyles: categoryData.styles,
      totalTrends: categoryData.trends.length
    };
    
    // Bölge bilgisi varsa ekle
    if (region) {
      // Bölge eşleştirme (esnek arama)
      const regionKey = Object.keys(regionalTips).find(
        key => key.toLowerCase() === region.toLowerCase() ||
               region.toLowerCase().includes(key.toLowerCase()) ||
               key.toLowerCase().includes(region.toLowerCase())
      );
      
      if (regionKey) {
        const tips = regionalTips[regionKey];
        result.regionalTip = {
          region: regionKey,
          generalAdvice: tips.general,
          seasonalAdvice: tips[targetSeason] || "Bu mevsim için bölgeye özel önerimiz mevcut değil."
        };
      } else {
        result.regionalTip = {
          region: region,
          generalAdvice: "Bu bölge için özel bir önerimiz yok, ancak genel trendler geçerli!",
          seasonalAdvice: null
        };
      }
    }
    
    // Özet oluştur
    const trendNames = categoryData.trends.map(t => t.name).join(", ");
    result.summary = `${result.seasonEmoji} ${targetSeason.charAt(0).toUpperCase() + targetSeason.slice(1)} 2025-2026 ${targetCategory} trendleri: ${trendNames}. Popüler renkler: ${categoryData.colors.slice(0, 3).join(", ")}.`;
    
    return result;
  } catch (error) {
    console.error("Trend bilgisi hatası:", error.message);
    return {
      error: true,
      message: `Trend bilgisi alınamadı: ${error.message}`
    };
  }
}

const seasonalProductsData = {
  yaz: {
    giyim: [
      // Erkek / Unisex
      { name: "Keten Gömlek Erkek", category: "Giyim", gender: "erkek" },
      { name: "Kargo Cepli Şort Erkek", category: "Giyim", gender: "erkek" },
      { name: "Oversize Unisex Tişört", category: "Giyim", gender: "unisex" },
      { name: "Mantar Sandalet Unisex", category: "Giyim", gender: "unisex" },
      { name: "Polarize Spor Güneş Gözlüğü", category: "Giyim", gender: "unisex" },
      { name: "Hızlı Kuruyan Deniz Plaj Şortu Erkek", category: "Giyim", gender: "erkek" },
      { name: "Pike Polo Yaka Gömlek Erkek", category: "Giyim", gender: "erkek" },
      { name: "Keten Pantolon Erkek Bej", category: "Giyim", gender: "erkek" },
      { name: "İnce Keten Blazer Ceket Erkek", category: "Giyim", gender: "erkek" },
      { name: "Basic Bisiklet Yaka Beyaz Tişört", category: "Giyim", gender: "unisex" },
      { name: "Canvas Spor Sırt Çantası", category: "Giyim", gender: "unisex" },
      // Kadın
      { name: "Yazlık Askılı Bluz Kadın", category: "Giyim", gender: "kadın" },
      { name: "Keten Pantolon Kadın Siyah", category: "Giyim", gender: "kadın" },
      { name: "Hasır Plaj Çantası Büyük", category: "Giyim", gender: "kadın" },
      { name: "İnce Keten Blazer Ceket Kadın", category: "Giyim", gender: "kadın" },
      { name: "Hasır Şapka Kadın Plaj", category: "Giyim", gender: "kadın" },
      { name: "Yazlık Askılı Elbise Desenli", category: "Giyim", gender: "kadın" },
      { name: "Keten Şort Yüksek Bel Kadın", category: "Giyim", gender: "kadın" },
      { name: "Cat-Eye Kadın Güneş Gözlüğü", category: "Giyim", gender: "kadın" },
      { name: "Mantar Taban Terlik Kadın", category: "Giyim", gender: "kadın" },
      { name: "Örme Crop Top Askılı Kadın", category: "Giyim", gender: "kadın" }
    ],
    elektronik: [
      { name: "Dyson Supersonic Saç Kurutma Makinesi", category: "Alet Edevat & Teknoloji" },
      { name: "Apple AirPods Pro 2. Nesil USB-C", category: "Alet Edevat & Teknoloji" },
      { name: "Philips Airfryer XXL Fritöz", category: "Alet Edevat & Teknoloji" },
      { name: "JBL Charge 5 Taşınabilir Hoparlör", category: "Alet Edevat & Teknoloji" },
      { name: "Xiaomi Mi Band 8 Akıllı Bileklik", category: "Alet Edevat & Teknoloji" },
      { name: "Roborock S8 Robot Süpürge", category: "Alet Edevat & Teknoloji" },
      { name: "Apple iPhone 15 Pro Max 256GB", category: "Alet Edevat & Teknoloji" },
      { name: "GoPro Hero 12 Aksiyon Kamerası", category: "Alet Edevat & Teknoloji" },
      { name: "Delonghi Magnifica Tam Otomatik Kahve Makinesi", category: "Alet Edevat & Teknoloji" },
      { name: "HP Victus Intel Core i5 Oyuncu Bilgisayarı", category: "Alet Edevat & Teknoloji" }
    ]
  },
  sonbahar: {
    giyim: [
      // Erkek / Unisex
      { name: "Oversize Kapüşonlu Sweatshirt", category: "Giyim", gender: "unisex" },
      { name: "Deri Chelsea Bot Erkek", category: "Giyim", gender: "erkek" },
      { name: "Triko Kazak V Yaka Erkek", category: "Giyim", gender: "erkek" },
      { name: "Kargo Pantolon Haki Erkek", category: "Giyim", gender: "erkek" },
      { name: "Su Geçirmez Kapüşonlu Yağmurluk", category: "Giyim", gender: "unisex" },
      { name: "Örme Bere ve Atkı Seti", category: "Giyim", gender: "unisex" },
      { name: "Süet Biker Ceket Erkek", category: "Giyim", gender: "erkek" },
      { name: "Oduncu Gömlek Ekose Erkek", category: "Giyim", gender: "erkek" },
      { name: "Klasik Gabardin Pantolon Erkek", category: "Giyim", gender: "erkek" },
      { name: "Retro Deri Sneaker Ayakkabı", category: "Giyim", gender: "unisex" },
      // Kadın
      { name: "Oversize Örme Hırka Kadın", category: "Giyim", gender: "kadın" },
      { name: "Deri Ceket Blazer Kadın", category: "Giyim", gender: "kadın" },
      { name: "Süet Kovboy Bot Kadın", category: "Giyim", gender: "kadın" },
      { name: "Triko Elbise Boğazlı Kadın", category: "Giyim", gender: "kadın" },
      { name: "Oversize Trençkot Bej Klasik", category: "Giyim", gender: "kadın" },
      { name: "Ekose Desenli Şal Eşarp Kadın", category: "Giyim", gender: "kadın" },
      { name: "Deri Tayt Kadın Yüksek Bel", category: "Giyim", gender: "kadın" },
      { name: "Loafer Platform Ayakkabı Kadın", category: "Giyim", gender: "kadın" },
      { name: "İnce Triko Bluz Fitilli Kadın", category: "Giyim", gender: "kadın" },
      { name: "Süet Sırt Çantası Kadın", category: "Giyim", gender: "kadın" }
    ],
    elektronik: [
      { name: "Xiaomi Smart Air Purifier 4 Hava Temizleyici", category: "Alet Edevat & Teknoloji" },
      { name: "Kindle Paperwhite E-Kitap Okuyucu 16GB", category: "Alet Edevat & Teknoloji" },
      { name: "Sony WH-1000XM5 Kablosuz Kulaklık", category: "Alet Edevat & Teknoloji" },
      { name: "Nescafe Gold Barista Kahve Makinesi", category: "Alet Edevat & Teknoloji" },
      { name: "Philips Buharlı Düzleştirici Dikey Ütü", category: "Alet Edevat & Teknoloji" },
      { name: "Apple iPad Air M1 64GB WiFi", category: "Alet Edevat & Teknoloji" },
      { name: "Logitech MX Master 3S Kablosuz Mouse", category: "Alet Edevat & Teknoloji" },
      { name: "Tefal Akıllı Düdüklü Tencere", category: "Alet Edevat & Teknoloji" },
      { name: "Asus Rog Ally Z1 Extreme El Konsolu", category: "Alet Edevat & Teknoloji" },
      { name: "Canon EOS R50 Vlog Kamerası", category: "Alet Edevat & Teknoloji" }
    ]
  },
  kis: {
    giyim: [
      // Erkek / Unisex
      { name: "Şişme Mont Su Geçirmez Puffer Erkek", category: "Giyim", gender: "erkek" },
      { name: "Termal İçlik Takım Seti Unisex", category: "Giyim", gender: "unisex" },
      { name: "Yarım Fermuarlı Polar Sweatshirt", category: "Giyim", gender: "unisex" },
      { name: "Deri Eldiven Dokunmatik Uyumlu", category: "Giyim", gender: "unisex" },
      { name: "Yünlü Astarlı Bere Erkek", category: "Giyim", gender: "erkek" },
      { name: "Kar Botu Su Geçirmez Erkek", category: "Giyim", gender: "erkek" },
      { name: "Yün Kaşe Palto Kaban Erkek", category: "Giyim", gender: "erkek" },
      { name: "Kalın Selanik Örgü Kazak Erkek", category: "Giyim", gender: "erkek" },
      { name: "Kadife Pantolon Kahverengi Erkek", category: "Giyim", gender: "erkek" },
      { name: "Stanley Classic Vakumlu Termos 1L", category: "Giyim", gender: "unisex" },
      // Kadın
      { name: "Kaşmir Palto Kaban Kadın", category: "Giyim", gender: "kadın" },
      { name: "Kar Botu Su Geçirmez Kadın", category: "Giyim", gender: "kadın" },
      { name: "Triko Elbise Boğazlı Kadın", category: "Giyim", gender: "kadın" },
      { name: "Yünlü Kaşmir Atkı Şal Kadın", category: "Giyim", gender: "kadın" },
      { name: "Kadife Pantolon Siyah Kadın", category: "Giyim", gender: "kadın" },
      { name: "Suni Kürk Detaylı Mont Kadın", category: "Giyim", gender: "kadın" },
      { name: "Peluş Sweatshirt Kadın Kapüşonlu", category: "Giyim", gender: "kadın" },
      { name: "Deri Bot Kalın Taban Kadın", category: "Giyim", gender: "kadın" },
      { name: "Yünlü Bere Ponponlu Kadın", category: "Giyim", gender: "kadın" },
      { name: "Örgü Triko Hırka Kadın Uzun", category: "Giyim", gender: "kadın" }
    ],
    elektronik: [
      { name: "Xiaomi Akıllı Akışkan Isıtıcı Heater", category: "Alet Edevat & Teknoloji" },
      { name: "Delonghi Yağlı Radyatör Isıtıcı", category: "Alet Edevat & Teknoloji" },
      { name: "Rowenta Katı Meyve Sıkacağı", category: "Alet Edevat & Teknoloji" },
      { name: "Philips Hue Akıllı Aydınlatma Başlangıç Seti", category: "Alet Edevat & Teknoloji" },
      { name: "Apple iPhone 15 Pro 128GB", category: "Alet Edevat & Teknoloji" },
      { name: "Sony PlayStation 5 Slim 1TB Konsol", category: "Alet Edevat & Teknoloji" },
      { name: "Stanley Classic Vakumlu Termos 1 Litre", category: "Alet Edevat & Teknoloji" },
      { name: "Philips Lumea Prestige IPL Epilasyon Cihazı", category: "Alet Edevat & Teknoloji" },
      { name: "JBL Bar 500 Dolby Atmos Soundbar", category: "Alet Edevat & Teknoloji" },
      { name: "Dyson V15 Detect Kablosuz Dikey Süpürge", category: "Alet Edevat & Teknoloji" }
    ]
  },
  ilkbahar: {
    giyim: [
      // Erkek / Unisex
      { name: "İnce Blazer Ceket Erkek", category: "Giyim", gender: "erkek" },
      { name: "Jean Ceket Klasik Mavi Erkek", category: "Giyim", gender: "erkek" },
      { name: "Kanvas Pantolon Bej Erkek", category: "Giyim", gender: "erkek" },
      { name: "Beyaz Sneaker Deri Spor Ayakkabı", category: "Giyim", gender: "unisex" },
      { name: "İnce Parka Yağmurluk Rüzgarlık", category: "Giyim", gender: "unisex" },
      { name: "Klasik Loafer Deri Ayakkabı Erkek", category: "Giyim", gender: "erkek" },
      { name: "Pamuklu Sweatshirt Bisiklet Yaka", category: "Giyim", gender: "unisex" },
      { name: "Poplin Çizgili Gömlek Erkek", category: "Giyim", gender: "erkek" },
      { name: "Kanvas Omuz Çantası Unisex", category: "Giyim", gender: "unisex" },
      { name: "Chino Şort Erkek Bej", category: "Giyim", gender: "erkek" },
      // Kadın
      { name: "Çizgili Poplin Gömlek Kadın", category: "Giyim", gender: "kadın" },
      { name: "Pileli Midi Etek Pastel Kadın", category: "Giyim", gender: "kadın" },
      { name: "Loafer Süet Ayakkabı Kadın", category: "Giyim", gender: "kadın" },
      { name: "İnce Parka Trençkot Kadın", category: "Giyim", gender: "kadın" },
      { name: "Pamuklu Desenli Şal Eşarp Kadın", category: "Giyim", gender: "kadın" },
      { name: "Jean Ceket Oversize Kadın", category: "Giyim", gender: "kadın" },
      { name: "Babet Deri Ayakkabı Kadın", category: "Giyim", gender: "kadın" },
      { name: "Denim Etek Midi Boy Kadın", category: "Giyim", gender: "kadın" },
      { name: "Keten Hırka İnce Kadın", category: "Giyim", gender: "kadın" },
      { name: "Omuz Askılı Deri Çanta Kadın", category: "Giyim", gender: "kadın" }
    ],
    elektronik: [
      { name: "DJI Mini 4 Pro Drone Fly More Combo", category: "Alet Edevat & Teknoloji" },
      { name: "Apple Watch Series 9 GPS 45mm", category: "Alet Edevat & Teknoloji" },
      { name: "Philips Sonicare Akıllı Şarjlı Diş Fırçası", category: "Alet Edevat & Teknoloji" },
      { name: "Xiaomi Akıllı Lazer Metre Mesafe Ölçer", category: "Alet Edevat & Teknoloji" },
      { name: "Tefal Easy Fry Grill & Steam Airfryer", category: "Alet Edevat & Teknoloji" },
      { name: "Apple MacBook Air M3 8GB 256GB SSD", category: "Alet Edevat & Teknoloji" },
      { name: "Seagate Expansion 2TB Taşınabilir Disk", category: "Alet Edevat & Teknoloji" },
      { name: "Anker Nebula Capsule Taşınabilir Projeksiyon", category: "Alet Edevat & Teknoloji" },
      { name: "Bosch Expert Gsb 18V Akülü Matkap", category: "Alet Edevat & Teknoloji" },
      { name: "Cosori Akıllı Airfryer Fritöz", category: "Alet Edevat & Teknoloji" }
    ]
  }
};

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
  // Eğer tam eşleşme bulamazsa sorgu kelimeleri içerisinden kısmi eşleşme dene
  const matchedKey = Object.keys(PRODUCT_IMAGES).find(key => 
    query.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(query.toLowerCase())
  );
  
  if (matchedKey) {
    return PRODUCT_IMAGES[matchedKey];
  }
  if (category === "Giyim") {
    return "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop";
}

async function getLangchainSeasonalTrends(season, gender) {
  let targetSeason = (season || '').toLowerCase();
  
  if (!targetSeason || !['ilkbahar', 'yaz', 'sonbahar', 'kış'].includes(targetSeason)) {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) targetSeason = 'ilkbahar';
    else if (month >= 5 && month <= 7) targetSeason = 'yaz';
    else if (month >= 8 && month <= 10) targetSeason = 'sonbahar';
    else targetSeason = 'kış';
  }
  
  const seasonData = seasonalProductsData[targetSeason];
  if (!seasonData) {
    return {
      error: true,
      message: `Geçersiz mevsim: ${targetSeason}`
    };
  }
  
  // Aşamalı cinsiyet filtreleme
  let giyimItems = seasonData.giyim;
  if (gender) {
    const cleanGender = gender.toLowerCase();
    if (cleanGender === 'erkek' || cleanGender === 'male') {
      giyimItems = giyimItems.filter(item => item.gender === 'erkek' || item.gender === 'unisex');
    } else if (cleanGender === 'kadın' || cleanGender === 'kız' || cleanGender === 'female' || cleanGender === 'kadin') {
      giyimItems = giyimItems.filter(item => item.gender === 'kadın' || item.gender === 'unisex');
    }
  }
  
  // Maksimum 10 giyim ve 10 elektronik ürünü sınırla (Toplam 20 ürün)
  const filteredGiyim = giyimItems.slice(0, 10);
  const filteredElektronik = seasonData.elektronik.slice(0, 10);
  
  const allItems = [...filteredGiyim, ...filteredElektronik];
  
  const enrichedItems = allItems.map((item, index) => {
    const query = item.name;
    const imageUrl = getProductImageUrl(query, item.category);
    return {
      rank: index + 1,
      name: item.name,
      title: item.name,
      category: item.category,
      image: imageUrl,
      price: null,
      links: {
        trendyol: `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`,
        hepsiburada: `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`,
        pazarama: `https://www.pazarama.com/arama?q=${encodeURIComponent(query)}`,
        akakce: `https://www.akakce.com/arama/?q=${encodeURIComponent(query)}`,
        cimri: `https://www.cimri.com/arama?q=${encodeURIComponent(query)}`
      }
    };
  });
  
  return {
    success: true,
    season: targetSeason,
    gender: gender || 'unisex',
    totalProducts: enrichedItems.length,
    products: enrichedItems,
    note: "🔗 Her ürün için doğrudan Trendyol, Hepsiburada, Pazarama, Akakçe ve Cimri arama bağlantıları eklenmiştir."
  };
}

module.exports = { getTrends, getLangchainSeasonalTrends };
