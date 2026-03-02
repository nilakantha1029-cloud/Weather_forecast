# ⛅ SkyPulse — Live Weather App

A sleek, feature-rich weather web app that delivers real-time weather data for any city worldwide using the **OpenWeatherMap API**. Supports dynamic weather animations, dark/light themes, and persists user preferences locally in the browser.

---

## 📁 Project Structure

```
Weather Forecast/
├── index.html    # Main HTML markup & layout
├── style.css     # All styles, animations, themes (1520 lines)
└── script.js     # App logic, API calls, rendering (741 lines)
```

---

## ✨ Features

- **City Search** — Search any city worldwide with a simple text input
- **Geolocation** — Use your device's GPS to auto-detect your current location
- **Current Weather** — Displays temperature, feels-like, high/low, visibility, dew point, and weather condition
- **Hourly Forecast** — Scrollable hourly forecast strip for the day ahead
- **5-Day Forecast** — Daily forecast cards for the next 5 days
- **Weather Stats Grid** — Tiles for Humidity, Wind Speed, Atmospheric Pressure, and Cloudiness with animated progress bars
- **Wind Details Panel** — Animated compass needle, wind speed, gusts, direction, and Beaufort scale classification
- **UV Index & Sun Panel** — UV index gauge with risk level, sunrise, sunset, golden hour, and day length
- **Location Map** — Embedded map showing the searched city's location
- **Weather Animations** — Dynamic background animations for rain, snow, stars, and thunderstorms based on current conditions
- **°C / °F Toggle** — Switch between Celsius and Fahrenheit at any time
- **Dark / Light Theme** — Toggle between dark and light modes
- **Recent Searches** — Quick-access bar for recently searched cities with individual remove buttons
- **Live Clock** — Displays the local time at the searched city's timezone
- **Last Updated Timestamp** — Shows when the data was last refreshed
- **Auto Refresh** — Manual refresh button to pull fresh data
- **Toast Notifications** — Non-intrusive feedback messages for user actions
- **Error Handling** — Dismissible error card for invalid searches or API issues

---

## 🚀 Getting Started

### 1. Get a Free API Key

Sign up at [openweathermap.org](https://openweathermap.org/api) to get a free API key. Activation takes ~2 minutes.

### 2. Open the App

Open `index.html` in any modern web browser — no build step or server required.

### 3. Enter Your API Key

On first launch, an API key banner will appear at the top. Paste your OpenWeatherMap key and click **Save Key**. The key is stored in your browser's `localStorage` and never sent anywhere other than OpenWeatherMap.

### 4. Search a City

Type any city name in the search bar (e.g., `London`, `Tokyo`, `Cairo`) and press **Search** or hit `Enter`.

---

## 🔑 API Usage

This app uses the following OpenWeatherMap endpoints:

| Endpoint                 | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `GET /geo/1.0/direct`    | Convert city name to coordinates              |
| `GET /data/2.5/weather`  | Current weather data                          |
| `GET /data/2.5/forecast` | 5-day / 3-hour forecast                       |
| `GET /data/3.0/onecall`  | UV index (requires One Call API subscription) |

> **Note:** The current weather and 5-day forecast endpoints are available on the free tier. The UV index requires the **One Call API 3.0** subscription (also has a free tier with limited calls/day).

---

## 💾 Local Storage Keys

| Key                  | Description                                    |
| -------------------- | ---------------------------------------------- |
| `skypulse_api_key`   | Your saved OpenWeatherMap API key              |
| `skypulse_last_city` | Last searched city (auto-loaded on next visit) |
| `skypulse_recent`    | Array of recently searched cities              |
| `skypulse_unit`      | Temperature unit preference (`C` or `F`)       |
| `skypulse_theme`     | UI theme preference (`dark` or `light`)        |

---

## 🌦️ Weather Condition Mapping

The app maps OpenWeatherMap condition codes to emojis and animation types:

| Code Range | Condition          | Animation              |
| ---------- | ------------------ | ---------------------- |
| 200–299    | Thunderstorm       | Thunder overlay + rain |
| 300–599    | Rain / Drizzle     | Rain animation         |
| 600–699    | Snow               | Snow animation         |
| 700–799    | Mist / Fog         | Mist styling           |
| 800 / 801  | Clear / Few Clouds | Stars (night)          |
| 802–804    | Cloudy             | Cloudy background      |

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, keyframe animations, responsive grid/flexbox layout
- **Vanilla JavaScript (ES6+)** — Async/await, Fetch API, DOM manipulation
- **OpenWeatherMap API** — Weather data provider
- **Google Fonts** — `Outfit` and `JetBrains Mono` typefaces

No frameworks, no dependencies, no build tools required.

---

## 📱 Responsive Design

The layout adapts to all screen sizes using CSS Grid and Flexbox, making it fully usable on mobile, tablet, and desktop.

---

## 🔒 Privacy

Your API key is stored **only in your own browser's localStorage**. No data is collected or transmitted to any third party other than OpenWeatherMap for weather lookups.

---

## Author

Your Name — Y Nilakantha

GitHub: https://github.com/nilakantha1029-cloud

## 📄 License

This project is open source. Feel free to use, modify, and distribute it for personal or commercial projects.
