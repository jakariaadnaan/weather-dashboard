const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const locationName = document.getElementById('location-name');
const lastUpdated = document.getElementById('last-updated');
const weatherEmoji = document.getElementById('weather-emoji');
const currentTemp = document.getElementById('current-temp');
const weatherDesc = document.getElementById('weather-desc');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const precipitation = document.getElementById('precipitation');
const hourlyForecast = document.getElementById('hourly-forecast');
const dailyForecast = document.getElementById('daily-forecast');

const hourlyTemplate = document.getElementById('hourly-item-template');
const dailyTemplate = document.getElementById('daily-item-template');

const defaultCity = 'Dhaka';

function getWeatherEmoji(code) {
  const map = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌦️',
    53: '🌦️',
    55: '🌧️',
    56: '🌧️',
    57: '🌧️',
    61: '🌦️',
    63: '🌧️',
    65: '🌧️',
    66: '🌧️',
    67: '🌧️',
    71: '🌨️',
    73: '🌨️',
    75: '🌨️',
    77: '🌨️',
    80: '🌦️',
    81: '🌧️',
    82: '🌧️',
    85: '🌨️',
    86: '🌨️',
    95: '⛈️',
    96: '⛈️',
    99: '⛈️'
  };

  return map[code] || '☀️';
}

function getWeatherLabel(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Cloudy',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Heavy showers',
    82: 'Violent showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm'
  };

  return map[code] || 'Clear';
}

function formatHourLabel(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric' });
}

function formatDayLabel(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { weekday: 'short' });
}

function renderHourly(data) {
  hourlyForecast.innerHTML = '';

  const hours = data.slice(0, 12);

  hours.forEach((item) => {
    const fragment = hourlyTemplate.content.cloneNode(true);
    const time = fragment.querySelector('.hour-time');
    const icon = fragment.querySelector('.hour-icon');
    const temp = fragment.querySelector('.hour-temp');

    time.textContent = formatHourLabel(item.time);
    icon.textContent = getWeatherEmoji(item.weather_code);
    temp.textContent = `${Math.round(item.temperature_2m)}°`;

    hourlyForecast.appendChild(fragment);
  });
}

function renderDaily(data) {
  dailyForecast.innerHTML = '';

  data.forEach((item) => {
    const fragment = dailyTemplate.content.cloneNode(true);
    const dayName = fragment.querySelector('.day-name');
    const icon = fragment.querySelector('.day-icon');
    const temps = fragment.querySelector('.day-temp-range');

    dayName.textContent = formatDayLabel(item.date);
    icon.textContent = getWeatherEmoji(item.weather_code);
    temps.textContent = `${Math.round(item.temperature_2m_min)}° / ${Math.round(item.temperature_2m_max)}°`;

    dailyForecast.appendChild(fragment);
  });
}

function updateWeatherCard(data, city) {
  const current = data.current;
  const location = `${city.name}, ${city.country || city.admin1 || ''}`.trim();

  locationName.textContent = location || city.name;
  lastUpdated.textContent = `Updated ${new Date(current.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
  weatherEmoji.textContent = getWeatherEmoji(current.weather_code);
  weatherDesc.textContent = getWeatherLabel(current.weather_code);
  currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°`;
  humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  precipitation.textContent = `${Math.round(current.precipitation)} mm`;
}

async function fetchWeather(cityName) {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      throw new Error('Location lookup failed');
    }

    const geoData = await geoResponse.json();
    const city = geoData.results?.[0];

    if (!city) {
      throw new Error('City not found');
    }

    const forecastResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_min,temperature_2m_max&timezone=auto&forecast_days=7`
    );

    if (!forecastResponse.ok) {
      throw new Error('Weather data fetch failed');
    }

    const forecastData = await forecastResponse.json();
    updateWeatherCard(forecastData, city);
    renderHourly(forecastData.hourly.temperature_2m.map((temp, index) => ({
      time: forecastData.hourly.time[index],
      temperature_2m: temp,
      weather_code: forecastData.hourly.weather_code[index]
    })));
    renderDaily(forecastData.daily.time.map((date, index) => ({
      date,
      weather_code: forecastData.daily.weather_code[index],
      temperature_2m_min: forecastData.daily.temperature_2m_min[index],
      temperature_2m_max: forecastData.daily.temperature_2m_max[index]
    })));
  } catch (error) {
    alert(`Unable to load weather for "${cityName}". Please try another city.`);
    console.error(error);
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();

  if (!query) {
    cityInput.focus();
    return;
  }

  fetchWeather(query);
});

cityInput.value = defaultCity;
fetchWeather(defaultCity);
