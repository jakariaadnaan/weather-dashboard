const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const locationName = document.getElementById("locationName");
const locationTime = document.getElementById("locationTime");
const currentTemp = document.getElementById("currentTemp");
const weatherCondition = document.getElementById("weatherCondition");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const updateTime = document.getElementById("updateTime");
const weatherIcon = document.getElementById("weatherIcon");
const saveBtn = document.getElementById("saveBtn");
const hourlyList = document.getElementById("hourlyList");
const dailyList = document.getElementById("dailyList");
const favoritesList = document.getElementById("favoritesList");
const emptyState = document.getElementById("emptyState");

const hourlyTemplate = document.getElementById("hourlyTemplate");
const dailyTemplate = document.getElementById("dailyTemplate");
const favoriteTemplate = document.getElementById("favoriteTemplate");

const STORAGE_KEY = "weatherhub_favorites";
const DEFAULT_CITY = "Dhaka";
let currentCity = DEFAULT_CITY;
let currentWeatherData = null;

const weatherCodeMap = {
  0: {
    label: "Clear Sky",
    svg: `
      <svg viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
      </svg>
    `
  },
  1: {
    label: "Mostly Clear",
    svg: `
      <svg viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M6 16h12"></path>
        <path d="M4 18h16"></path>
      </svg>
    `
  },
  2: {
    label: "Partly Cloudy",
    svg: `
      <svg viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <circle cx="8" cy="12" r="3"></circle>
        <path d="M7 17h10a3 3 0 0 0 0-6 5 5 0 0 0-9.5-1.5A3.5 3.5 0 0 0 7 17z"></path>
      </svg>
    `
  },
  3: {
    label: "Cloudy",
    svg: `
      <svg viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <path d="M7 17h10a3 3 0 0 0 0-6 5 5 0 0 0-9.5-1.5A3.5 3.5 0 0 0 7 17z"></path>
      </svg>
    `
  },
  45: {
    label: "Fog",
    svg: `
      <svg viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <path d="M4 14h16M4 10h16M4 18h16"></path>
      </svg>
    `
  },
  61: {
    label: "Rain",
    svg: `
      <svg viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <path d="M7 17h10a3 3 0 0 0 0-6 5 5 0 0 0-9.5-1.5A3.5 3.5 0 0 0 7 17z"></path>
        <path d="M9 19l-1 3M15 19l-1 3"></path>
      </svg>
    `
  },
  71: {
    label: "Snow",
    svg: `
      <svg viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <path d="M7 17h10a3 3 0 0 0 0-6 5 5 0 0 0-9.5-1.5A3.5 3.5 0 0 0 7 17z"></path>
        <path d="M12 18v3M9 19h6M8 15l4 4 4-4"></path>
      </svg>
    `
  },
  95: {
    label: "Thunderstorm",
    svg: `
      <svg viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <path d="M7 17h10a3 3 0 0 0 0-6 5 5 0 0 0-9.5-1.5A3.5 3.5 0 0 0 7 17z"></path>
        <path d="M12 15l-2 4h4l-2 4"></path>
      </svg>
    `
  }
};

function getWeatherSvg(code) {
  return weatherCodeMap[code]?.svg || weatherCodeMap[3].svg;
}

function getWeatherLabel(code) {
  return weatherCodeMap[code]?.label || "Cloudy";
}

function formatHour(value) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric" });
}

function formatDay(value) {
  return new Date(value).toLocaleDateString([], { weekday: "short" });
}

function roundValue(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return Math.round(value);
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderFavorites() {
  const favorites = getFavorites();
  favoritesList.innerHTML = "";
  emptyState.style.display = favorites.length ? "none" : "block";

  favorites.forEach((item) => {
    const fragment = favoriteTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".favorite-btn");
    const name = fragment.querySelector(".favorite-name");
    const temp = fragment.querySelector(".favorite-temp");

    button.dataset.city = item.name;
    name.textContent = item.name;
    temp.textContent = `${item.temp}°`;
    button.addEventListener("click", () => fetchWeather(item.name));
    favoritesList.appendChild(fragment);
  });
}

function updateSaveButtonState() {
  const favorites = getFavorites();
  const isSaved = favorites.some((item) => item.name === currentCity);
  saveBtn.classList.toggle("saved", isSaved);
}

function toggleFavorite() {
  const favorites = getFavorites();
  const isSaved = favorites.some((item) => item.name === currentCity);

  if (isSaved) {
    const next = favorites.filter((item) => item.name !== currentCity);
    saveFavorites(next);
  } else {
    const next = [...favorites, {
      name: currentCity,
      temp: roundValue(currentWeatherData?.current?.temperature_2m)
    }];
    saveFavorites(next);
  }

  renderFavorites();
  updateSaveButtonState();
}

function renderHourly(data) {
  hourlyList.innerHTML = "";
  data.slice(0, 24).forEach((entry) => {
    const fragment = hourlyTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".hourly-item");
    const time = fragment.querySelector(".hourly-time");
    const icon = fragment.querySelector(".hourly-icon");
    const temp = fragment.querySelector(".hourly-temp");

    time.textContent = formatHour(entry.time);
    icon.innerHTML = getWeatherSvg(entry.weather_code);
    temp.textContent = `${roundValue(entry.temperature_2m)}°`;
    hourlyList.appendChild(item);
  });
}

function renderDaily(data) {
  dailyList.innerHTML = "";
  data.forEach((entry) => {
    const fragment = dailyTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".daily-item");
    const date = fragment.querySelector(".daily-date");
    const iconBox = fragment.querySelector(".daily-icon-small");
    const condition = fragment.querySelector(".daily-condition");
    const high = fragment.querySelector(".daily-high");
    const low = fragment.querySelector(".daily-low");

    date.textContent = formatDay(entry.date);
    iconBox.innerHTML = getWeatherSvg(entry.weather_code);
    condition.textContent = getWeatherLabel(entry.weather_code);
    high.textContent = `${roundValue(entry.temperature_2m_max)}°`;
    low.textContent = `${roundValue(entry.temperature_2m_min)}°`;
    dailyList.appendChild(item);
  });
}

function updateCurrentWeather(data, cityInfo) {
  const current = data.current;
  currentCity = cityInfo.name;

  locationName.textContent = `${cityInfo.name}, ${cityInfo.country || cityInfo.admin1 || ""}`.trim();
  locationTime.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  currentTemp.textContent = `${roundValue(current.temperature_2m)}°`;
  weatherCondition.textContent = getWeatherLabel(current.weather_code);
  feelsLike.textContent = `Feels like ${roundValue(current.apparent_temperature)}°`;
  humidity.textContent = `${roundValue(current.relative_humidity_2m)}%`;
  wind.textContent = `${roundValue(current.wind_speed_10m)} km/h`;
  pressure.textContent = `${roundValue(current.pressure_msl)} mb`;
  visibility.textContent = `${roundValue(current.visibility / 1000)} km`;
  updateTime.textContent = new Date(current.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  weatherIcon.innerHTML = getWeatherSvg(current.weather_code);
  updateSaveButtonState();
}

async function fetchWeather(cityName) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
    );

    if (!geoRes.ok) throw new Error("Location failed");

    const geoData = await geoRes.json();
    const city = geoData.results?.[0];

    if (!city) throw new Error("City not found");

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,visibility,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_min,temperature_2m_max&timezone=auto&forecast_days=7`
    );

    if (!forecastRes.ok) throw new Error("Forecast failed");

    const weatherData = await forecastRes.json();
    currentWeatherData = weatherData;

    updateCurrentWeather(weatherData, city);
    renderHourly(weatherData.hourly.time.map((time, index) => ({
      time,
      weather_code: weatherData.hourly.weather_code[index],
      temperature_2m: weatherData.hourly.temperature_2m[index]
    })));

    renderDaily(weatherData.daily.time.map((date, index) => ({
      date,
      weather_code: weatherData.daily.weather_code[index],
      temperature_2m_min: weatherData.daily.temperature_2m_min[index],
      temperature_2m_max: weatherData.daily.temperature_2m_max[index]
    })));

    searchInput.value = city.name;
    renderFavorites();
    updateSaveButtonState();
  } catch (error) {
    console.error(error);
    alert("Unable to load weather for that location. Please try another city.");
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = searchInput.value.trim();
  if (!city) return;
  fetchWeather(city);
});

saveBtn.addEventListener("click", toggleFavorite);
fetchWeather(DEFAULT_CITY);
