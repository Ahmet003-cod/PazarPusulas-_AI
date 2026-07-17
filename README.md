# 🛍️ PazarPusulası AI - Akıllı E-Ticaret Asistanı Chatbot

PazarPusulası AI; e-ticaret sitelerinden anlık fiyat karşılaştırmaları yapan, fiyat geçmişi analizlerini ASCII grafiklerle görselleştiren ve Excel tabanlı ürün listelerinizi otomatik olarak zenginleştiren yapay zeka destekli bir e-ticaret ve fiyat takip asistanıdır.

---

## ✨ Öne Çıkan Özellikler

- 🔍 **Hedefli Karşılaştırmalı Arama:** Fiyat geçmişi ve grafiklerin doğruluğu için sorguları otomatik olarak yalnızca **Akakçe** ve **Cimri** karşılaştırma sayfaları üzerinden gerçekleştirir.
- 🌐 **Otonom Tarayıcı Scraping (Playwright):** Cloudflare bot engellerini (403 Forbidden hatalarını) aşmak için arka planda headless (görünmez) tarayıcı açarak JSON-LD yapısal şemalarını ve sayfa metinlerini tarar, %100 gerçek fiyatları ve geçmiş istatistiklerini çeker.
- 📊 **Fiyat Geçmişi Analizi & ASCII Grafikler:** Ürünün son 90 günlük en düşük, en yüksek ve ortalama fiyat noktalarını hesaplar ve yapay zeka desteğiyle alım fırsatı (dip seviyede, yükseliş eğilimi vb.) yorum raporu hazırlar.
- 📂 **Excel/XLSX Dosya İşleme:** Yüklediğiniz ürün Excel tablolarını okuyarak her ürün için **canlı fiyat, ürün bağlantısı, satıcı platformu ve yapay zeka grafik analiz yorumu** ekler ve güncellenmiş tabloyu indirmenizi sağlar.
- 💬 **Rehberli Akıllı LLM:** Kullanıcı belirsiz veya genel bir isim girdiğinde (Örn: *"Telefon"*, *"Bilgisayar"*), yapay zeka arama motorlarını boşa yormadan önce kullanıcıya popüler marka/model seçenekleri sunarak detaylı bilgi ister.

---

## 🛠️ Kullanılan Teknolojiler

- **Sunucu & API:** Node.js, Express.js
- **Bot Aşma & Kazıma:** Playwright (Chromium), Cheerio
- **Yapay Zeka Motoru:** OpenRouter / OpenAI API
- **Dosya Yönetimi:** XLSX (SheetJS), Multer (Excel yükleme/indirme için)
- **Arayüz (Frontend):** Modern HTML5, Vanilla CSS (Glassmorphism & Micro-animations), Responsive Vanilla JS

---

## 📂 Proje Yapısı

```text
├── server/
│   ├── server.js               # Express sunucu ve API endpoint'leri
│   ├── llm-engine.js           # LLM (Yapay Zeka) prompt ve araç çalıştırma mantığı
│   └── tools/
│       ├── product-search.js   # Arama motoru sorgu motoru & sorgu basitleştirici (relaxation)
│       ├── price-graph-analyzer.js # Playwright scraper & ASCII grafik motoru
│       └── xlsx-processor.js   # Excel dosyalarını okuma, yazma ve analiz etme aracı
├── public/
│   ├── css/
│   │   └── style.css           # Chatbot arayüz stilleri
│   ├── js/
│   │   └── chat.js             # Chatbot UI kontrolör ve WebSocket/Fetch mantığı
│   └── index.html              # Ana sohbet arayüzü
├── .env.example                # Örnek çevre değişkenleri dosyası
├── .gitignore                  # Git dışı bırakılacak dosyalar (Gizlilik için)
├── package.json                # Proje bağımlılıkları ve scriptler
└── README.md                   # Proje dokümantasyonu
```

---

## 🚀 Kurulum ve Çalıştırma

### 📋 Gereksinimler
- Bilgisayarınızda **Node.js** (v18 veya daha yeni bir sürüm) kurulu olmalıdır.

### ⚙️ Adım Adım Kurulum

1. **Projeyi indirin ve dizine geçin:**
   ```bash
   cd "projenin-klasor-yolu"
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Playwright Chromium tarayıcısını kurun:**
   Playwright'ın arka planda sayfa taraması yapabilmesi için Chromium çekirdeğini indirmesi gerekir:
   ```bash
   npx playwright install chromium
   ```

4. **Çevre Değişkenlerini Ayarlayın (`.env`):**
   - Klasördeki `.env.example` dosyasının adını `.env` olarak değiştirin (veya kopyasını oluşturun).
   - Dosyayı açarak kendi API anahtarlarınızı girin:
     ```env
     # OpenRouter API Key (Yapay Zeka için)
     OPENROUTER_API_KEY=your_openrouter_api_key_here

     # Sunucu Çalışma Portu
     PORT=3000
     ```

5. **Projeyi Başlatın:**
   ```bash
   npm start
   ```

6. **Tarayıcıda test edin:**
   Adres çubuğuna `http://localhost:3000` yazarak chatbot ekranına ulaşabilirsiniz.

---

## 🔒 Güvenlik Modeli ve Tasarım İlkeleri

PazarPusulası AI, geliştirme ve üretim aşamalarında veri güvenliğini korumak amacıyla **"Security by Design" (Tasarım Gereği Güvenlik)** prensiplerine göre tasarlanmıştır:

### 1. Dosya Yükleme ve Yol Geçişi (Path Traversal) Koruması
- **Multer Konfigürasyonu:** Yüklenen Excel dosyaları sunucuya yazılırken kullanıcının gönderdiği orijinal dosya adı tamamen yok sayılır. Yerine sunucu tarafında benzersiz bir **UUIDv4** (`3f5b9d...`) atanarak kaydedilir.
- Bu yapı, kötü niyetli kullanıcıların dosya adlarına `../` gibi ifadeler ekleyerek sunucunun kritik sistem dizinlerine sızmasını veya mevcut dosyaları ezmesini (Path Traversal) tamamen engeller.
- **Uzantı Doğrulama:** Yalnızca `.xlsx` ve `.xls` formatındaki e-tablo dosyalarına izin verilir; çalıştırılabilir zararlı scriptler (`.js`, `.exe`, `.php` vb.) sisteme yüklenemez.

### 2. Bellek İçi Güvenli İndirme (In-Memory Export Stream)
- Excel indirme API'si (`/api/download`), sunucu üzerinde geçici olarak bile dosya oluşturmaz. 
- JSON verileri doğrudan RAM üzerinde binary (ikili) tampon belleğe (`Buffer`) dönüştürülür ve doğrudan HTTP yanıtı olarak istemciye akıtılır. Bu sayede sunucu diskinde atık dosya birikmez ve veri sızıntısı riski sıfıra indirilir.

### 3. API Anahtarlarının İzole Edilmesi
- Sunucu ve LLM entegrasyonu, hassas API anahtarlarını kodun içine sabit olarak gömmek (hardcode) yerine tamamen `.env` çevre değişkenleri üzerinden yönetir.
- Tarayıcı üzerinden chatbot'u kullanan her istemci, kendi API anahtarlarını HTTP başlığı (`Header`) üzerinden güvenle iletebilir. Sunucu bu anahtarları hiçbir veritabanına kaydetmez veya üçüncü taraflarla paylaşmaz.

### 4. Komut Enjeksiyonu (Command Injection) Koruması
- Cimri ve Akakçe sayfalarını tararken kullanılan Playwright tarayıcı motoru, hiçbir kabuk/terminal (shell) komutu tetiklemez. Sayfalar doğrudan NodeJS kütüphane çağrılarıyla, izole bir tarayıcı sanal alanında (sandbox) açılır.

---

## 🚀 GitHub ve Gizlilik Uyarısı

> [!WARNING]
> **API anahtarlarınızın çalınmaması için `.env` dosyanızı kesinlikle GitHub'a push etmeyin!**
>
> Projedeki `.gitignore` dosyası, `.env` dosyasının ve `node_modules` klasörünün GitHub'a yüklenmesini otomatik olarak engellemek üzere yapılandırılmıştır. Reponuzu herkese açık (public) yapmadan önce `.gitignore` dosyasının dizinde olduğundan emin olun.

