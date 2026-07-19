# 📊 PazarPusulası AI - Proje Akış Diyagramı (Mermaid Kodu & Açıklaması)

Bu dosyayı açarak akış şemasını kopyalayabilir veya görsel olarak indirebilirsiniz.

---

## 🎨 Diyagramı Resim (PNG / SVG) Olarak İndirme
Aşağıdaki kutuda bulunan **Mermaid kodunu** tamamen kopyalayıp [Mermaid Live Editor](https://mermaid.live/) sitesine yapıştırarak şemayı anında **PNG, SVG veya PDF** olarak bilgisayarınıza indirebilir, staj raporunuza doğrudan resim olarak ekleyebilirsiniz.

---

## 💻 Kopyalanabilir Mermaid Diyagram Kodu

```mermaid
flowchart TD
    User([Kullanıcı Girişi / Arayüz]) -->|1a. Sohbet Mesajı Gönderir| ChatAPI[POST /api/chat]
    User -->|1b. Excel Dosyası Yükler| UploadAPI[POST /api/upload]

    %% Sohbet Akışı
    subgraph ChatFlow [Sohbet & Grafik Analiz Akışı]
        ChatAPI --> LLM[LLM Engine: llm-engine.js]
        LLM -->|Karar Verme: Tool / Function Calling| ToolCall{Araç Çağrısı Gerekli mi?}
        
        ToolCall -->|Evet: get_price_history_graph| SearchTool[Arama Aracı: product-search.js]
        SearchTool -->|Sorgu Sadeleştirme: relaxSearchQuery| Relax[Arama Motorları: DDG/Bing/Yahoo]
        Relax -->|Cimri / Akakçe Ürün Linki Bulma| ScrapeTool[Playwright Scraper: price-graph-analyzer.js]
        
        ScrapeTool -->|Headless Tarayıcı & Cloudflare Aşma| Playwright[Playwright Browser Sandbox]
        Playwright -->|JSON-LD Şeması & Sayfa Metni Analizi| DataExtract[Canlı Fiyat, Min/Max/Ortalama Çekimi]
        DataExtract -->|Fiyat Geçmişi & ASCII Grafik Hesaplama| GraphGen[ASCII Grafik & Trend Analizi]
        
        GraphGen --> LLM
        ToolCall -->|Hayır: Yanıt Hazır| OutputGen[Yanıt Sentezleme & Arayüze İletim]
    end

    %% Excel Akışı
    subgraph ExcelFlow [Excel Zenginleştirme Akışı]
        UploadAPI --> FileSave[Dosya Kaydı: UUID.xlsx Koruması]
        FileSave --> ExcelProc[Excel İşlemci: xlsx-processor.js]
        ExcelProc -->|Satır Satır Ürün Döngüsü| Loop[Ürün Arama & Analiz Aşaması]
        Loop --> ScrapeTool
        DataExtract -->|Fiyat, Link & Analiz Eklenmesi| Enrich[Excel Tablosunun Güncellenmesi]
        Enrich --> Download[POST /api/download]
        Download -->|Bellek İçi Akış: In-Memory Buffer| ExcelFile([Zenginleştirilmiş Rapor İndirme])
    end

    OutputGen --> User
    ExcelFile --> User

    %% Stil Renklendirmeleri
    style User fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    style ChatAPI fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
    style UploadAPI fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
    style LLM fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
    style Playwright fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
    style ExcelFile fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
```

---

## 🔍 Proje Çalışma Mantığı Açıklaması

### 1. Sohbet ve Canlı Fiyat Analiz Döngüsü (ChatFlow)
1. **Mesaj Alımı:** Kullanıcı bir ürünün fiyatını veya grafiğini istediğinde istemci Express.js'teki `/api/chat` endpoint'ine istek atar.
2. **LLM Niyet Analizi:** `llm-engine.js`, kullanıcının amacını belirler. Eğer ürün fiyatı isteniyorsa otonom olarak `get_price_history_graph` aracını tetikler.
3. **Ürün Arama & Sadeleştirme:** `product-search.js` üründeki gereksiz kelimeleri filtreler, arama motorlarında arar ve Cimri veya Akakçe karşılaştırma sayfa linkini bulur.
4. **Playwright ile Kazıma:** Bulunan link Playwright tarayıcı motoruna gönderilir. Arka planda açılan tarayıcı, Cloudflare engelini aşar. Sayfadaki yapısal JSON-LD verilerini ve metinleri tarar; canlı fiyatı, en düşük, en yüksek ve ortalama fiyatı çeker.
5. **Grafik & Yorumlama:** Alınan veriler `calculatePriceHistory` fonksiyonuna beslenir. Burada 90 günlük dalgalanma grafiği oluşturulur ve ASCII grafik çizilir. LLM bu grafiği yorumlayarak kullanıcıya nihai analizi sunar.

### 2. Excel Zenginleştirme Döngüsü (ExcelFlow)
1. **Yükleme:** Kullanıcı Excel ürün listesini `/api/upload` rotasına gönderir.
2. **Güvenli Saklama:** Sunucu, dosya adını UUIDv4 ile değiştirerek diske güvenli şekilde yazar.
3. **Satır Satır İşleme:** `xlsx-processor.js` Excel'i okur. Her satırdaki ürün için yukarıdaki Arama ve Playwright kazıma süreçlerini çalıştırır.
4. **Zenginleştirme ve İndirme:** Ürünlerin yanına yeni kolonlar (Güncel Fiyat, Min Fiyat, Max Fiyat, Link, Analiz Yorumu) eklenir. Güncellenmiş Excel tablosu, diskte kalıcı dosya yaratılmadan bellek içi akış (`In-Memory Buffer`) aracılığıyla doğrudan kullanıcıya indirilir.
