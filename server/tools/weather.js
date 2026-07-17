/**
 * HausPort AI - Hava Durumu Servisi
 * 
 * Open-Meteo API kullanır (ÜCRETSİZ, API key gerekmez!)
 * WMO hava durumu kodlarını Türkçe açıklamalara çevirir
 * Sıcaklığa göre giyim önerisi verir
 */

// WMO hava durumu kodları → Türkçe açıklamalar
const WMO_CODES = {
  0: "Açık ☀️",
  1: "Çoğunlukla açık 🌤️",
  2: "Parçalı bulutlu ⛅",
  3: "Kapalı ☁️",
  45: "Sisli 🌫️",
  48: "Kırağılı sis 🌫️",
  51: "Hafif çisenti 🌦️",
  53: "Orta şiddetli çisenti 🌦️",
  55: "Yoğun çisenti 🌧️",
  56: "Dondurucu hafif çisenti 🌧️❄️",
  57: "Dondurucu yoğun çisenti 🌧️❄️",
  61: "Hafif yağmur 🌧️",
  63: "Orta şiddetli yağmur 🌧️",
  65: "Şiddetli yağmur 🌧️",
  66: "Dondurucu hafif yağmur 🌧️❄️",
  67: "Dondurucu şiddetli yağmur 🌧️❄️",
  71: "Hafif kar yağışı ❄️",
  73: "Orta şiddetli kar yağışı ❄️",
  75: "Yoğun kar yağışı ❄️",
  77: "Kar taneleri 🌨️",
  80: "Hafif sağanak 🌦️",
  81: "Orta sağanak 🌧️",
  82: "Şiddetli sağanak ⛈️",
  85: "Hafif kar sağanağı 🌨️",
  86: "Şiddetli kar sağanağı 🌨️",
  95: "Gök gürültülü fırtına ⛈️",
  96: "Dolu ile gök gürültülü fırtına ⛈️🧊",
  99: "Şiddetli dolu ile fırtına ⛈️🧊"
};

/**
 * WMO kodundan Türkçe hava durumu açıklaması döndürür
 */
function getWeatherDescription(code) {
  return WMO_CODES[code] || "Bilinmiyor 🤷";
}

/**
 * Sıcaklığa göre giyim önerisi üretir
 */
function getClothingRecommendation(temp, weatherCode) {
  const isRainy = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
  const isSnowy = (weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86);
  const isStormy = weatherCode >= 95;

  let recommendation = "";

  // Sıcaklığa göre temel öneri
  if (temp <= 0) {
    recommendation = "🧥 Kalın kaban, mont veya parka giyin. Atkı, bere ve eldiven şart! Termal içlik çok iyi olur. Kışlık bot tercih edin.";
  } else if (temp <= 5) {
    recommendation = "🧥 Kalın mont veya kaban giyin. Atkı ve bere önerilir. Kazak veya polar üst iyi olur. Kışlık ayakkabı tercih edin.";
  } else if (temp <= 10) {
    recommendation = "🧶 Kazak veya sweatshirt üzerine hafif mont/ceket giyin. Kalın pantolon tercih edin. Kapalı ayakkabı iyi olur.";
  } else if (temp <= 15) {
    recommendation = "🧥 Hafif ceket veya hırka yeterli olur. Uzun kollu tişört veya ince kazak tercih edin.";
  } else if (temp <= 20) {
    recommendation = "👕 Uzun kollu tişört veya ince gömlek giyin. Yanınıza hafif bir ceket alın, akşam serin olabilir.";
  } else if (temp <= 25) {
    recommendation = "👕 Tişört veya gömlek rahat olur. Hafif kumaş pantolon veya etek tercih edin. Güneş gözlüğü unutmayın!";
  } else if (temp <= 30) {
    recommendation = "🩳 Kısa kollu tişört, şort veya yazlık elbise giyin. Pamuklu kumaşlar tercih edin. Bol su için! ☀️";
  } else if (temp <= 35) {
    recommendation = "🩳 Çok hafif ve açık renkli kıyafetler giyin. Şapka ve güneş kremi şart! Bol su için. Sandalet veya hafif ayakkabı tercih edin.";
  } else {
    recommendation = "🥵 Aşırı sıcak! Mümkünse dışarı çıkmayın. Çok hafif, açık renkli, pamuklu kıyafetler giyin. Güneş kremi, şapka zorunlu. Bol bol su için!";
  }

  // Yağış durumuna göre ek öneri
  if (isRainy) {
    recommendation += "\n☔ Yağmur var! Yağmurluk veya şemsiye almayı unutmayın. Su geçirmez ayakkabı tercih edin.";
  }
  if (isSnowy) {
    recommendation += "\n❄️ Kar yağışı var! Kaymayan tabanlı kışlık bot giyin. Kalın çorap ve su geçirmez kıyafet önerilir.";
  }
  if (isStormy) {
    recommendation += "\n⛈️ Fırtına bekleniyor! Mümkünse dışarı çıkmayın. Çıkacaksanız rüzgar geçirmez ceket giyin.";
  }

  return recommendation;
}

/**
 * Şehir adından koordinat bul (Open-Meteo Geocoding API)
 */
async function geocodeCity(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=tr`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Geocoding API hatası: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    throw new Error(`"${cityName}" şehri bulunamadı. Lütfen geçerli bir Türk şehri adı girin.`);
  }
  
  const result = data.results[0];
  return {
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    admin1: result.admin1 || "" // İl/bölge bilgisi
  };
}

/**
 * Koordinatlardan hava durumu bilgisi al (Open-Meteo Forecast API)
 */
async function fetchWeatherData(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Europe/Istanbul&forecast_days=1`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Hava durumu API hatası: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Ana fonksiyon: Şehir adıyla hava durumu sorgula
 * @param {string} city - Şehir adı (Türkçe)
 * @returns {Object} Hava durumu bilgileri ve giyim önerisi
 */
async function getWeather(city) {
  try {
    // 1. Adım: Şehri geocode et
    const location = await geocodeCity(city);
    
    // 2. Adım: Hava durumu verisini al
    const weatherData = await fetchWeatherData(location.latitude, location.longitude);
    
    const current = weatherData.current;
    const daily = weatherData.daily;
    
    const weatherCode = current.weather_code;
    const temperature = current.temperature_2m;
    
    // Sonuç objesi oluştur
    const result = {
      city: location.name,
      region: location.admin1,
      country: location.country,
      temperature: temperature,
      temperatureUnit: "°C",
      humidity: current.relative_humidity_2m,
      humidityUnit: "%",
      windSpeed: current.wind_speed_10m,
      windSpeedUnit: "km/sa",
      condition: getWeatherDescription(weatherCode),
      weatherCode: weatherCode,
      daily: {
        maxTemp: daily.temperature_2m_max?.[0],
        minTemp: daily.temperature_2m_min?.[0]
      },
      recommendation: getClothingRecommendation(temperature, weatherCode),
      summary: `📍 ${location.name}${location.admin1 ? ' (' + location.admin1 + ')' : ''}: ${temperature}°C, ${getWeatherDescription(weatherCode)}. Nem: %${current.relative_humidity_2m}, Rüzgar: ${current.wind_speed_10m} km/sa.`
    };
    
    return result;
  } catch (error) {
    console.error("Hava durumu hatası:", error.message);
    return {
      error: true,
      message: `Hava durumu alınamadı: ${error.message}`,
      city: city,
      suggestion: "Lütfen geçerli bir şehir adı girin. Örn: İstanbul, Ankara, İzmir, Antalya"
    };
  }
}

module.exports = { getWeather };
