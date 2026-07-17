/**
 * HausPort AI - LLM Motor Modülü
 * 
 * OpenRouter API üzerinden LLM entegrasyonu
 * Tool calling döngüsü: mesaj gönder → tool çağrıları → çalıştır → sonuçları geri gönder → tekrarla
 * Varsayılan model: google/gemma-3-27b-it:free (ücretsiz, tool calling destekli)
 */

const { toolDefinitions } = require('./tools/tool-definitions');
const { executeTool } = require('./utils/tool-executor');

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Varsayılan model - ücretsiz ve tool calling destekli
const DEFAULT_MODEL = "google/gemma-3-27b-it:free";

// Maksimum tool calling döngüsü (sonsuz döngüyü önlemek için)
const MAX_TOOL_ITERATIONS = 8;

/**
 * PazarPusulası AI sistem prompt'u - Türkçe, samimi ve yardımsever
 */
const SYSTEM_PROMPT = `Sen "PazarPusulası AI" adlı akıllı bir e-ticaret asistanısın. 🛍️

## Kişiliğin:
- Samimi, sıcak ve yardımsever bir Türk asistansın
- Emoji kullanmayı seviyorsun ama abartmıyorsun
- Kullanıcıyla sohbet eder gibi konuşuyorsun, resmi değilsin
- Türk e-ticaret dünyasını iyi biliyorsun (Trendyol, Hepsiburada, Cimri, Akakçe, Pazarama)
- Moda, teknoloji ve ev ürünleri konusunda güncel trendleri takip ediyorsun
- Türkiye'nin farklı bölgelerinin iklim ve stil farklarını biliyorsun

## Yapabileceklerin:
1. **Ürün Arama**: Türk e-ticaret sitelerinde ürün arayabilirsin (search_products)
2. **Fiyat Karşılaştırma**: Aynı ürünün farklı sitelerdeki fiyatlarını karşılaştırabilirsin (compare_prices)
3. **En Ucuz Ürün Bulma**: Aynı kalitede en uygun fiyatlı 2 ürünü bulabilirsin (find_cheapest)
4. **Hava Durumu**: Şehirlerin hava durumunu sorgulayıp giyim önerisi verebilirsin (get_weather)
5. **Trend Bilgisi**: Güncel moda ve sezonluk trendleri biliyorsun (get_trends)
6. **Excel İşleme**: XLSX dosyaları okuyup ürün linklerini ekleyebilirsin (process_xlsx_upload)
7. **Kullanıcı Profili**: Kullanıcının tercihlerini hatırlayıp kişisel öneriler verebilirsin (get_user_profile, update_user_profile)
8. **Mevsimsel Trend Listesi**: Mevsime ait popüler 20 ürünü (10 giyim, 10 alet edevat/elektronik) tüm e-ticaret sitelerinin arama linkleriyle birlikte listeler (\`get_langchain_seasonal_trends\`)
9. **Fiyat Grafiği ve Geçmiş Analizi**: Ürünlerin son 3 aylık fiyat geçmişini, ASCII grafik görselleştirmesini ve eğilim analizlerini sorgulayabilirsin (\`get_price_history_graph\`)

## Önemli Kurallar:
- Her zaman Türkçe konuş.
- **LangChain/Agentik Mevsimsel Trend Önerisi (Kritik)**: Kullanıcı mevsime ait trendleri, popüler giyim veya alet edevat ürünlerini görmek istediğinde **daima \`get_langchain_seasonal_trends\` aracını kullan**. Bu araçtan dönen 20 popüler ürünü (10 giyim, 10 alet-edevat) kullanıcıya **şık bir markdown tablosunda** listele. Tabloda her ürün için Trendyol, Hepsiburada ve Pazarama arama linklerini tıklanabilir bağlantılar şeklinde ver (Örn: \`[Trendyol](link)\`). Arayüzdeki gelişmiş link çözücü ve tablo render edici bu linkleri doğrudan tıklanabilir butonlara dönüştürecektir.
- **Aşamalı Profil ve Karşılama Akışı (Kritik)**:
  - Kullanıcı welcome screen kartlarına tıkladığında (kartlar: Ürün Ara, Fiyat Karşılaştır, Trend Önerileri, Excel İşle) ve henüz bir kullanıcı profili oluşturulmadığında:
    1. Öncelikle tıklanan bölümün amacını genel olarak kısaca tanıt. Kesinlikle başlangıçta kendi kafandan "iPhone 15 Pro Max fiyatlarını karşılaştıracağım" gibi bir ürün adı veya "kulaklık arayacağım" gibi bir kategori UYDURMA! Hangi ürünün aranacağını profil aşamasından sonra kullanıcının kendisi yazacak.
       - Örnek tanıtım (Fiyat Karşılaştır için): "Fiyat Karşılaştırma modülümüze hoş geldin! Bu bölümde senin için tüm popüler e-ticaret sitelerinden anlık fiyatları toplayıp en avantajlı seçenekleri listeliyorum. 🛍️"
       - Örnek tanıtım (Ürün Ara için): "Ürün Arama bölümüne hoş geldin! Aradığın ürünü en popüler Türk e-ticaret sitelerinde buluyorum. 🔍"
    2. Ardından, sana en uygun önerileri sunabilmek için kullanıcının adını, yaşını ve cinsiyetini sor.
    3. Son olarak, "Bilgilerini kaydettiğin anda aramak veya karşılaştırmak istediğin ürünün ne olduğunu soracağım! 😊" diyerek belirt.
  - Kullanıcı profil bilgilerini girdiğinde (örneğin "Ahmet, 21, erkek" şeklinde cevap verdiğinde):
    1. Önce \`update_user_profile\` aracı ile bu bilgileri (name, age, gender) hemen kaydet.
    2. Bilgileri kaydettiğin için teşekkür et ve sohbet geçmişindeki kullanıcının tıkladığı asıl modüle/isteğe göre devam et:
       - **Fiyat Karşılaştır** modülüyse: "Şimdi karşılaştırmak istediğin ürünün adını yazar mısın? 🛍️" de ve ürünü sor.
       - **Ürün Ara** modülüyse: "Şimdi senin için aramamı istediğin ürünün adını yazar mısın? 🔍" de ve ürünü sor.
       - **Trend Önerileri** modülüyse: "Şimdi ne tür trend önerileri istersin? (Örn: giyim, ayakkabı, aksesuar)" de.
       - **Excel İşle** modülüyse: "Şimdi Excel dosyanı buraya sürükleyip bırakabilirsin! 📄" de.
    3. Eğer kullanıcı profilini oluşturmadan hemen önce zaten spesifik bir ürün ismi yazmışsa (Örn: "iPhone 15 fiyatlarını karşılaştır" yazıp ardından profilini doldurmuşsa), bu durumda ürünü tekrar sorma; direkt o ürün için ilgili arama/karşılaştırma aracını çağır!
- **Giyim/Kombin Önerisi Öncesi Cinsiyet ve Yaş Sorgulama (Kritik)**:
  - Kullanıcı herhangi bir giyim veya kombin önerisi istediğinde (veya hava durumuna göre ne giyebileceğini sorduğunda), eğer profilinde \`gender\` (cinsiyet) veya \`age\` (yaş) bilgisi eksikse, **öneri yapmadan önce mutlaka** kullanıcıdan yaşını ve cinsiyetini nazikçe sor.
  - Örnek: "Sana en uygun tarz ve model önerilerini hazırlayabilmem için yaşını ve cinsiyetini paylaşır mısın? 😊"
  - Kullanıcı bu bilgileri verdiğinde hemen \`update_user_profile\` aracını kullanarak \`gender\` ve \`age\` alanlarını kaydet ve ardından hava durumu/kombin önerisine geç.
- **Şehir, İklim ve Detaylı Kombin Önerisi (Kritik)**: Kullanıcının yaşadığı şehre ait hava durumunu (\`get_weather\`) sorgula. Hava durumuna göre yapacağın giyim önerisi **son derece detaylı ve tarz odaklı** olmalıdır. Kesinlikle sadece "ceket giy" veya "kazak giy" gibi kısa/genel önerilerle yetinme! Kullanıcıya **"Bu tarz ve bu model kıyafet giyeceksin"** diyerek tam bir kombin sun:
    1. **Stil ve Tarz**: Önerdiğin kombin hangi tarza uygun (casual, smart-casual, sokak modası, vintage vb.)? Bunu açıkla.
    2. **Kıyafet Modelleri ve Kesimleri**: Üst giyim, alt giyim, dış giyim ve ayakkabı modellerini tek tek detaylı belirt (örn: oversize bej keten gömlek, slim-fit keten pantolon, hafif su geçirmez trençkot, süet loafer ayakkabı vb.).
    3. **Arama ve Satın Alma Linkleri (Çok Önemli)**: Önerdiğin her bir giysi, ayakkabı ve aksesuar modelinin yanına parantez içinde doğrudan e-ticaret sitelerinin arama linklerini ekle. Link formatı şu şekilde olmalıdır: \`([Trendyol](https://www.trendyol.com/sr?q=aranacak_kelime) | [Hepsiburada](https://www.hepsiburada.com/ara?q=aranacak_kelime))\`. 
       - Örneğin: "Oversize bej keten gömlek ([Trendyol](https://www.trendyol.com/sr?q=erkek+oversize+bej+keten+gomlek) | [Hepsiburada](https://www.hepsiburada.com/ara?q=erkek+oversize+bej+keten+gomlek))"
       - Arama kelimelerini cinsiyete ve tarza göre detaylandır (örn: "kadın+su+gecirmez+siyah+bot" veya "erkek+bej+keten+pantolon").
    4. **Ürün Arama Aracı Çağrısı**: Kombindeki ana giyim/ayakkabı ürünleri için arka planda \`search_products\` (veya \`search_trendyol\`, \`search_hepsiburada\`) aracını da çağırarak kullanıcının mesajın altında gerçek ürün kartlarını görmesini sağla.
- **Arama Kalitesi (Kritik)**: Arama yaparken kesinlikle genel kategori kelimeleri (örneğin "şort modelleri", "bluz fiyatları", "erkek tişört") araması YAPMA! Kategori sayfalarında fiyat bilgisi doğru çekilemez. Bunun yerine, yaş grubuna ve cinsiyete uygun marka ve spesifik ürün aramaları yap. Örneğin: "Defacto kadın yazlık bluz", "Mavi erkek keten şort", "Koton genç kız bluz", "Ltb oversize t-shirt". Böylece doğrudan ürün sayfaları gelir ve gerçek fiyatlar doğru okunur.
- **Excel/XLSX Dosya İşleme (Kritik)**:
  - Kullanıcı yüklediği bir Excel dosyası için işlem yapılmasını istediğinde (örneğin "akakçe için yap", "hepsiburada için de yap"), **DAİMA \`process_xlsx_upload\` aracını en son yüklenen \`file_id\` (dosya adı/ID'si) ile çağır**.
  - Sistem artık Akakçe veya Cimri aramalarında bot korumasından (403) dolayı fiyat çekilemediğinde otomatik olarak Trendyol/Hepsiburada/Pazarama verilerini referans alıp fiyatı doldurur ve her ürün için özel bir **"Fiyat Grafiği Analizi & Yorumu"** sütunu (\`_fiyat_grafik_yorumu\`) ekler.
  - Dosyayı işledikten sonra, kullanıcıya ürünü bulduğunu, fiyata ulaştığını ve Excel tablosunda artık **fiyat grafik yorumlarının da** bulunduğunu belirt ve indirme butonunu göster.
- **Fiyat Grafiği Analizi & Yorumu (Kritik)**:
  - Fiyat grafikleri ve tarihsel fiyat geçmişi **yalnızca Cimri ve Akakçe üzerinden sorgulanmalıdır**. Çünkü net fiyat grafiği ve karşılaştırma geçmişi yalnızca bu platformlarda bulunmaktadır.
  - Kullanıcı bir ürünün fiyat grafiğini, fiyat geçmişini, son dönemdeki fiyat hareketlerini veya fiyat analizini sorduğunda **daima \`get_price_history_graph\` aracını çağır**.
  - Bu araçtan dönen sonuçlardaki \`asciiChart\` metnini (grafiği) yanıtında aynen kod bloğu formatında (\`\`\`\n[asciiChart]\n\`\`\`) göstererek görsel bir grafik sun.
  - Ayrıca dönen \`trendType\`, \`analysis\` ve \`statistics\` (en yüksek, en düşük, ortalama fiyatlar) bilgilerini kullanarak kullanıcıya son derece profesyonel, anlaşılır bir grafik yorumlama raporu yaz.
- **Net Olmayan Ürün İsimleri Kontrolü (Kritik)**:
  - Kullanıcı fiyat grafiği analizi veya ürün arama istediğinde, eğer ürün adı çok genel, belirsiz veya net değilse (örneğin sadece "telefon", "bilgisayar", "kulaklık", "mont", "ayakkabı", "çapa makinesi" gibi markası, modeli veya özellikleri belli olmayan tek kelimelik kelimeler girdiyse):
  - **Kesinlikle arama veya grafik araçlarını çağırma!**
  - Kullanıcıya ürün adının net olmadığını belirt, aradığı ürün türüne göre nazikçe tam model/marka girmesini iste ve ona seçebileceği popüler marka/model seçenekleri (örneğin telefon için "iPhone 15 mi, Samsung S24 Ultra mı?", çapa makinesi için "Kaan 260 S mi, Taral mı?", airfryer için "Philips Airfryer XXL mi, Xiaomi mi?") sunarak seçenekli yönlendirme yap.
- **Fiyat Belirleme ve Analiz Raporu (Kritik)**:
  - Fiyatların e-ticaret sitelerinden anlık olarak arama motorları vasıtasıyla çekildiğini kullanıcılara belirt.
  - Sadece fiyat listelemekle yetinme; fiyatlar geldikten sonra **kalite/fiyat dengesi analizi sun** ve kullanıcıya net bir öneride bulun. Örneğin: "Genel kalite ve güvenilirlik dengesine göre X sitesindeki ürünü tercih etmenizi öneririm. Çünkü Y sitesiyle aralarında sadece 50 TL fark var ama X sitesinde resmi satıcı satıyor." veya "En ucuz seçenek Cimri'de görünse de, ürünün güncel yorumları ve kargo avantajı göz önüne alındığında Trendyol seçeneği daha avantajlı duruyor." gibi somut, akıl yürütmeye dayalı öneriler yap.
- Fiyatları Türk Lirası (TL/₺) cinsinden göster.
- Ürün önerisi yaparken daima link ve fiyat bilgisi ver.
- Karşılaştırma yaparken en ucuz seçeneği vurgula.
- Kullanıcı bir ürün sorduğunda uygun tool'u kullan, kafadan cevap verme.
- Kullanıcının beden, stil, yaş, cinsiyet ve bütçe tercihlerini öğrendiğinde profili hemen güncelle.
- Hata olduğunda nazikçe özür dile ve alternatif öner.
- Ürün linkleri verirken her zaman kullanıcının linke tıklayabileceği şekilde ver.
- Güncel tarih: ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## Konuşma Stili Örnekleri:
- "Merhaba! 👋 Ben PazarPusulası AI, e-ticaret asistanın! Bugün sana nasıl yardımcı olabilirim? Sana en iyi önerileri yapabilmem için ismini, yaşını ve cinsiyetini benimle paylaşır mısın? 😊"
- "Harika bir seçim! 🎉 Senin yaşına ve tarzına çok uygun bir kombin hazırladım. Şimdi senin için en uygun fiyatı bulayım..."
- "Bütçene en uygun seçenekleri sıraladım, buyur 💰"

Kullanıcıyla ilk kez konuşuyorsan kendini tanıt ve profilini oluşturmak için nazikçe yaşını, cinsiyetini ve varsa stil tercihlerini sor.`;

const PROVIDERS = {
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "google/gemma-3-27b-it:free",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://pazarpusulasi.ai",
      "X-Title": "PazarPusulası AI E-Ticaret Asistanı"
    })
  },
  openai: {
    endpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    })
  },
  gemini: {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-1.5-flash",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    })
  },
  groq: {
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    })
  }
};

/**
 * API anahtarına göre sağlayıcı ve modeli tespit et
 */
function resolveLLMProvider(apiKeys) {
  // 1. Doğrudan sağlayıcı tanımlamaları
  const orKey = apiKeys?.openRouterKey || process.env.OPENROUTER_API_KEY;
  const oaKey = apiKeys?.openAiKey || process.env.OPENAI_API_KEY;
  const gemKey = apiKeys?.geminiKey || process.env.GEMINI_API_KEY;
  const groqKey = apiKeys?.groqKey || process.env.GROQ_API_KEY;
  
  // Generic key (frontend ayarlarından gelebilir)
  const genericKey = apiKeys?.apiKey;

  if (orKey) {
    return { provider: 'openrouter', apiKey: orKey, ...PROVIDERS.openrouter };
  }
  if (oaKey) {
    return { provider: 'openai', apiKey: oaKey, ...PROVIDERS.openai };
  }
  if (gemKey) {
    return { provider: 'gemini', apiKey: gemKey, ...PROVIDERS.gemini };
  }
  if (groqKey) {
    return { provider: 'groq', apiKey: groqKey, ...PROVIDERS.groq };
  }
  
  // 2. Generic key tespiti (Önek analizi)
  if (genericKey) {
    if (genericKey.startsWith('sk-or-')) {
      return { provider: 'openrouter', apiKey: genericKey, ...PROVIDERS.openrouter };
    }
    if (genericKey.startsWith('sk-')) {
      return { provider: 'openai', apiKey: genericKey, ...PROVIDERS.openai };
    }
    if (genericKey.startsWith('AIzaSy')) {
      return { provider: 'gemini', apiKey: genericKey, ...PROVIDERS.gemini };
    }
    if (genericKey.startsWith('gsk_')) {
      return { provider: 'groq', apiKey: genericKey, ...PROVIDERS.groq };
    }
    // Varsayılan olarak OpenRouter kabul et
    return { provider: 'openrouter', apiKey: genericKey, ...PROVIDERS.openrouter };
  }
  
  return null;
}

/**
 * Mesaj geçmişini OpenAI formatına dönüştür
 * @param {Array} history - Konuşma geçmişi
 * @returns {Array} OpenAI format mesajlar
 */
function formatHistory(history) {
  if (!Array.isArray(history)) return [];
  
  return history
    .filter(msg => msg && msg.role && msg.content)
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: String(msg.content)
    }));
}

/**
 * Kullanıcı profil bilgisini sistem prompt'a ekle
 */
function buildSystemPromptWithProfile(userProfile) {
  let prompt = SYSTEM_PROMPT;
  
  if (userProfile && Object.keys(userProfile).length > 0) {
    prompt += "\n\n## Kullanıcı Profili (Hatırlaman Gerekenler):";
    
    const fieldLabels = {
      name: "İsim",
      city: "Şehir",
      size: "Beden",
      style: "Stil Tercihi",
      favorite_brands: "Favori Markalar",
      budget: "Bütçe",
      gender: "Cinsiyet",
      interests: "İlgi Alanları"
    };
    
    for (const [key, value] of Object.entries(userProfile)) {
      const label = fieldLabels[key] || key;
      prompt += `\n- ${label}: ${value}`;
    }
    
    prompt += "\n\nBu bilgileri kullanarak kişiselleştirilmiş öneriler ver.";
  }
  
  return prompt;
}

/**
 * LLM API'ye istek gönder
 */
async function callLLM(messages, llm) {
  const { endpoint, apiKey, defaultModel, headers } = llm;
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({
      model: defaultModel,
      messages: messages,
      tools: toolDefinitions,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.9
    })
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`LLM API hatası (${llm.provider}):`, response.status, errorBody);
    throw new Error(`LLM API hatası (${llm.provider} - ${response.status}): ${errorBody}`);
  }
  
  return await response.json();
}

/**
 * Ana chat işleme fonksiyonu
 * Tool calling döngüsü ile tam bir konuşma turu gerçekleştirir
 * 
 * @param {string} message - Kullanıcı mesajı
 * @param {Array} history - Konuşma geçmişi
 * @param {Object} userProfile - Kullanıcı profili
 * @param {Object} apiKeys - API anahtarları
 * @returns {Object} { reply, updatedProfile, toolCalls }
 */
async function processChat(message, history, userProfile, apiKeys) {
  const llm = resolveLLMProvider(apiKeys);
  
  // API key yoksa demo modda çalış
  if (!llm) {
    console.log("⚠️ Herhangi bir API anahtarı bulunamadı. Demo modda çalışılıyor...");
    return getDemoResponse(message, userProfile);
  }
  
  try {
    // Mesaj dizisini oluştur
    const systemPrompt = buildSystemPromptWithProfile(userProfile || {});
    const formattedHistory = formatHistory(history);
    
    let messages = [
      { role: "system", content: systemPrompt },
      ...formattedHistory,
      { role: "user", content: message }
    ];
    
    // Tool calling döngüsü konteksti
    const context = {
      apiKeys: apiKeys || {},
      uploadedFiles: apiKeys?.uploadedFiles || {},
      userProfile: userProfile || {}
    };
    
    let toolCallsLog = []; // Tüm tool çağrılarını kaydet
    let iteration = 0;
    
    // Tool calling döngüsü
    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;
      console.log(`\n🔄 LLM Döngü #${iteration} (${llm.provider})`);
      
      // LLM'e istek gönder
      const response = await callLLM(messages, llm);
      
      const choice = response.choices?.[0];
      if (!choice) {
        throw new Error("LLM'den geçersiz yanıt alındı.");
      }
      
      const assistantMessage = choice.message;
      
      // Tool çağrısı var mı kontrol et
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`🔧 ${assistantMessage.tool_calls.length} araç çağrısı algılandı`);
        
        // Assistant mesajını geçmişe ekle (tool_calls dahil)
        messages.push({
          role: "assistant",
          content: assistantMessage.content || null,
          tool_calls: assistantMessage.tool_calls
        });
        
        // Her tool çağrısını çalıştır
        for (const toolCall of assistantMessage.tool_calls) {
          const funcName = toolCall.function?.name;
          let funcArgs = {};
          
          try {
            funcArgs = JSON.parse(toolCall.function?.arguments || '{}');
          } catch (e) {
            console.error(`Araç argüman parse hatası (${funcName}):`, e.message);
            funcArgs = {};
          }
          
          console.log(`  → ${funcName}(${JSON.stringify(funcArgs)})`);
          
          // Aracı çalıştır
          const toolResult = await executeTool(funcName, funcArgs, context);
          
          // Tool sonucunu kaydet
          toolCallsLog.push({
            tool: funcName,
            args: funcArgs,
            result: JSON.parse(toolResult)
          });
          
          // Tool sonucunu mesaj dizisine ekle
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult
          });
        }
        
        // Döngüye devam et (LLM'in tool sonuçlarını işlemesi için)
        continue;
        
      } else {
        // Tool çağrısı yok, son metin yanıtı alındı
        console.log("✅ LLM son yanıtı verdi");
        
        return {
          reply: assistantMessage.content || "Hmm, bir şeyler ters gitti. Tekrar dener misin? 🤔",
          updatedProfile: context.userProfile,
          toolCalls: toolCallsLog,
          model: response.model || llm.defaultModel,
          usage: response.usage || null
        };
      }
    }
    
    // Maksimum iterasyona ulaşıldı
    console.warn("⚠️ Maksimum tool calling döngüsüne ulaşıldı!");
    
    // Son bir düz yanıt iste
    messages.push({
      role: "user",
      content: "Lütfen şimdiye kadar topladığın bilgilerle bir özet yanıt ver."
    });
    
    const finalResponse = await callLLM(
      messages.map(m => {
        // Tool ilgili alanları temizle
        const clean = { role: m.role, content: m.content || "" };
        return clean;
      }).filter(m => m.role !== 'tool'),
      llm
    );
    
    return {
      reply: finalResponse.choices?.[0]?.message?.content || "Çok fazla araştırma yaptım ama sonuçları derleyemedim. Tekrar sorar mısın? 😅",
      updatedProfile: context.userProfile,
      toolCalls: toolCallsLog,
      model: finalResponse.model || llm.defaultModel,
      usage: finalResponse.usage || null
    };
    
  } catch (error) {
    console.error("❌ Chat işleme hatası:", error.message);
    
    // Kullanıcı dostu hata mesajı
    let userMessage = "Üzgünüm, bir hata oluştu 😔 ";
    
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      userMessage += "API anahtarı geçersiz görünüyor. Lütfen Ayarlar'dan OpenRouter API anahtarınızı kontrol edin. 🔑";
    } else if (error.message.includes("429") || error.message.includes("rate")) {
      userMessage += "Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin. ⏳";
    } else if (error.message.includes("402") || error.message.includes("insufficient")) {
      userMessage += "API kredisi yetersiz. Ücretsiz bir model kullanmayı deneyin veya OpenRouter hesabınıza kredi ekleyin. 💳";
    } else if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("ENOTFOUND")) {
      userMessage += "İnternet bağlantısı sorunu var gibi görünüyor. Bağlantınızı kontrol edip tekrar deneyin. 🌐";
    } else {
      userMessage += `Teknik detay: ${error.message}. Biraz sonra tekrar deneyin.`;
    }
    
    return {
      reply: userMessage,
      updatedProfile: userProfile,
      toolCalls: [],
      error: true,
      errorDetail: error.message
    };
  }
}

/**
 * Demo modu yanıtı (API key yokken)
 * Temel fonksiyonelliği göstermek için mock yanıtlar döndürür
 */
function getDemoResponse(message, userProfile) {
  const msgLower = message.toLowerCase();
  
  let reply;
  
  if (msgLower.includes("merhaba") || msgLower.includes("selam") || msgLower.includes("hey")) {
    reply = `Merhaba! 👋 Ben PazarPusulası AI, senin akıllı e-ticaret asistanın! 🛍️

Sana şu konularda yardımcı olabilirim:

🔍 **Ürün Arama** - Türk e-ticaret sitelerinde ürün arayabilirim
💰 **Fiyat Karşılaştırma** - Aynı ürünün farklı sitelerdeki fiyatlarını karşılaştırabilirim
🏷️ **En Ucuz Ürün** - Kaliteli ve uygun fiyatlı alternatifleri bulabilirim
🌤️ **Hava Durumu** - Hava durumuna göre giyim önerisi verebilirim
👗 **Trend Bilgisi** - Güncel moda trendlerini paylaşabilirim
📊 **Excel İşleme** - XLSX dosyalarını okuyup ürün linkleri ekleyebilirim

⚠️ **Not:** Şu an demo modda çalışıyorum. Tam özellikler için Ayarlar'dan OpenRouter API anahtarınızı girin.

Nasıl yardımcı olabilirim? 😊`;
  } else if (msgLower.includes("hava") || msgLower.includes("weather")) {
    reply = `🌤️ Hava durumu sorgulama özelliğim var! Ama şu an demo moddayım.

Tam özellikler için Ayarlar panelinden **OpenRouter API anahtarınızı** girin. API anahtarı girildikten sonra şehrinizi söylemeniz yeterli, size hava durumuna göre giyim önerisi de veririm! 

Örnek: "İstanbul'da hava nasıl?" veya "Ankara için ne giysem?"

🔑 API anahtarı almak için: [openrouter.ai/keys](https://openrouter.ai/keys)`;
  } else if (msgLower.includes("fiyat") || msgLower.includes("karşılaştır") || msgLower.includes("ucuz")) {
    reply = `💰 Fiyat karşılaştırma özelliğim var! Demo modda basit örnekler gösterebilirim.

Tam çalışması için Ayarlar'dan **OpenRouter API anahtarınızı** girin. Sonra bana bir ürün söyleyin, tüm büyük Türk e-ticaret sitelerinde fiyatları karşılaştırayım!

Desteklenen siteler: Trendyol, Hepsiburada, Cimri, Akakçe, Pazarama

🔑 API anahtarı: [openrouter.ai/keys](https://openrouter.ai/keys)`;
  } else if (msgLower.includes("trend") || msgLower.includes("moda")) {
    reply = `👗 2025-2026 moda trendlerini biliyorum!

Demo modda kısa bir özet verebilirim:
- 🌸 **İlkbahar**: Pastel tonlar, denim kombinler, trençkot şıklığı
- ☀️ **Yaz**: Crochet & örgü, tropikal desenler, keten kumaşlar
- 🍂 **Sonbahar**: Toprak tonları, deri ceketler, ekose desenler
- ❄️ **Kış**: Puffer jacket, monokrom kombinler, kadife kumaşlar

Tam detaylar ve kişiselleştirilmiş öneriler için Ayarlar'dan API anahtarınızı girin! 🔑`;
  } else {
    reply = `Teşekkürler mesajın için! 😊 

Şu an **demo modda** çalışıyorum. Tam özellikli yanıtlar için Ayarlar panelinden **OpenRouter API anahtarınızı** girmeniz gerekiyor.

🔑 Ücretsiz API anahtarı almak için: [openrouter.ai/keys](https://openrouter.ai/keys)

API anahtarı girildikten sonra:
- Ürün araması yapabilirim 🔍
- Fiyat karşılaştırması yapabilirim 💰
- Hava durumuna göre öneri verebilirim 🌤️
- Moda trendlerini paylaşabilirim 👗
- Excel dosyalarını işleyebilirim 📊

Yardımcı olmaya hazırım! 💪`;
  }
  
  return {
    reply: reply,
    updatedProfile: userProfile || {},
    toolCalls: [],
    model: "demo-mode",
    isDemo: true,
    note: "Demo modda çalışılıyor. Tam özellikler için OpenRouter API anahtarı gerekli."
  };
}

module.exports = { processChat };
