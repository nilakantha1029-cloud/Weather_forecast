const OWM_BASE = "https://api.openweathermap.org/data/2.5";
const OWM_BASE3 = "https://api.openweathermap.org/data/3.0";
const GEO_BASE = "https://api.openweathermap.org/geo/1.0";
const LS_KEY_KEY = "skypulse_api_key";
const LS_CITY_KEY = "skypulse_last_city";
const LS_RECENT = "skypulse_recent";
const LS_UNIT = "skypulse_unit";
const LS_THEME = "skypulse_theme";

let API_KEY = "285ef76e9e959017dfa94f08f7bf02a1";
let isCel = localStorage.getItem(LS_UNIT) !== "F";
let cTimer = null;
let curLat = null;
let curLon = null;
let curData = null;
let toastTmr = null;
let thunderTmr = null;

(() => {
  const w = document.getElementById("stars");
  for (let i = 0; i < 100; i++) {
    const s = document.createElement("div");
    s.className = "str";
    const z = Math.random() < 0.25 ? 3 : 2;
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${z}px;height:${z}px;--d:${2 + Math.random() * 4}s;--dl:${Math.random() * 5}s;--op:${0.4 + Math.random() * 0.5}`;
    w.appendChild(s);
  }
})();
(() => {
  const w = document.getElementById("rain");
  for (let i = 0; i < 90; i++) {
    const d = document.createElement("div");
    d.className = "rd";
    const h = 12 + Math.random() * 18;
    d.style.cssText = `left:${Math.random() * 100}%;height:${h}px;opacity:${0.25 + Math.random() * 0.45};--d:${0.5 + Math.random() * 0.6}s;--dl:${Math.random() * 2}s`;
    w.appendChild(d);
  }
})();
(() => {
  const w = document.getElementById("snow");
  for (let i = 0; i < 55; i++) {
    const d = document.createElement("div");
    d.className = "sf";
    const sz = 2 + Math.random() * 5;
    d.style.cssText = `left:${Math.random() * 100}%;width:${sz}px;height:${sz}px;opacity:${0.5 + Math.random() * 0.5};--d:${3 + Math.random() * 5}s;--dl:${Math.random() * 6}s`;
    w.appendChild(d);
  }
})();

const toF = (c) => Math.round((c * 9) / 5 + 32);
const fmt = (c) => (isCel ? `${Math.round(c)}°C` : `${toF(Math.round(c))}°F`);
const fmts = (c) => (isCel ? `${Math.round(c)}°` : `${toF(Math.round(c))}°`);
const kmhToMph = (k) => Math.round(k * 0.621);
const mToKm = (m) => (m / 1000).toFixed(1);
const pad2 = (n) => String(n).padStart(2, "0");

function unixToTime(unix, tz, use12 = true) {
  try {
    return new Date(unix * 1000).toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: use12,
    });
  } catch (e) {
    return new Date(unix * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function degToCompass(deg) {
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[Math.round(deg / 22.5) % 16];
}

function beaufort(kmh) {
  const bf = Math.min(Math.floor(kmh / 7), 12);
  const names = [
    "Calm",
    "Light Air",
    "Light Breeze",
    "Gentle Breeze",
    "Moderate Breeze",
    "Fresh Breeze",
    "Strong Breeze",
    "Near Gale",
    "Gale",
    "Strong Gale",
    "Storm",
    "Violent Storm",
    "Hurricane",
  ];
  return { bf, name: names[bf] };
}

function owmToIcon(id, isDay = true) {
  if (id >= 200 && id < 300) return "⛈️";
  if (id >= 300 && id < 400) return "🌧️";
  if (id >= 500 && id < 510) return isDay ? "🌦️" : "🌧️";
  if (id === 511) return "🌨️";
  if (id >= 520 && id < 600) return "🌧️";
  if (id >= 600 && id < 620) return "❄️";
  if (id >= 620 && id < 700) return "🌨️";
  if (id >= 700 && id < 800) return "🌫️";
  if (id === 800) return isDay ? "☀️" : "🌙";
  if (id === 801) return isDay ? "🌤️" : "🌙";
  if (id === 802) return "⛅";
  if (id >= 803) return "☁️";
  return "🌡️";
}

function owmToType(id) {
  if (id >= 200 && id < 300) return "thunder";
  if (id >= 300 && id < 600) return "rainy";
  if (id >= 600 && id < 700) return "snowy";
  if (id >= 700 && id < 800) return "mist";
  if (id === 800 || id === 801) return "sunny";
  return "cloudy";
}

function toast(msg, isErr = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast on" + (isErr ? " err" : "");
  clearTimeout(toastTmr);
  toastTmr = setTimeout(() => t.classList.remove("on"), isErr ? 4000 : 2800);
}

function showError(msg) {
  document.getElementById("error-msg").textContent = msg;
  document.getElementById("error-card").classList.add("show");
}
function hideError() {
  document.getElementById("error-card").classList.remove("show");
}
document.getElementById("error-close").onclick = hideError;



function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(LS_RECENT) || "[]");
  } catch (e) {
    return [];
  }
}
function addRecent(city) {
  let r = getRecent().filter((c) => c.toLowerCase() !== city.toLowerCase());
  r.unshift(city);
  if (r.length > 6) r = r.slice(0, 6);
  localStorage.setItem(LS_RECENT, JSON.stringify(r));
  renderRecent();
}
function removeRecent(city) {
  let r = getRecent().filter((c) => c.toLowerCase() !== city.toLowerCase());
  localStorage.setItem(LS_RECENT, JSON.stringify(r));
  renderRecent();
}
function renderRecent() {
  const bar = document.getElementById("recent-bar");
  const r = getRecent();
  if (!r.length) {
    bar.innerHTML = "";
    return;
  }
  bar.innerHTML = `<span class="recent-label">Recent:</span>`;
  r.forEach((city) => {
    const chip = document.createElement("span");
    chip.className = "rchip";
    chip.innerHTML = `${city}<span class="rc-del" data-city="${city}">✕</span>`;
    chip.addEventListener("click", (e) => {
      if (e.target.classList.contains("rc-del")) {
        removeRecent(e.target.dataset.city);
        return;
      }
      fetchByCity(city);
    });
    bar.appendChild(chip);
  });
  const clr = document.createElement("span");
  clr.className = "clear-recent";
  clr.textContent = "Clear all";
  clr.onclick = () => {
    localStorage.removeItem(LS_RECENT);
    renderRecent();
  };
  bar.appendChild(clr);
}

function startClock(tz) {
  clearInterval(cTimer);
  const el = document.getElementById("clock");
  const tick = () => {
    try {
      el.textContent = new Date().toLocaleTimeString("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      el.textContent = new Date().toLocaleTimeString();
    }
  };
  tick();
  cTimer = setInterval(tick, 1000);
}

function startThunder(active) {
  clearInterval(thunderTmr);
  const el = document.getElementById("thunder-overlay");
  if (!active) {
    el.style.opacity = 0;
    return;
  }
  thunderTmr = setInterval(() => {
    if (Math.random() > 0.65) {
      el.style.opacity = 0.4;
      setTimeout(() => {
        el.style.opacity = 0;
        setTimeout(() => {
          if (Math.random() > 0.5) {
            el.style.opacity = 0.25;
            setTimeout(() => (el.style.opacity = 0), 80);
          }
        }, 120);
      }, 80);
    }
  }, 2500);
}

function render(d) {
  curData = d;
  const { current: c, forecast: fc, hourly: h, tz, lat, lon } = d;
  curLat = lat;
  curLon = lon;

  const type = owmToType(c.weather[0].id);
  document.body.className = "t-" + type;
  document.getElementById("rain").classList.toggle("on", type === "rainy");
  document.getElementById("snow").classList.toggle("on", type === "snowy");
  startThunder(type === "thunder");

  const nowTs = Math.floor(Date.now() / 1000);
  const isDay = nowTs >= c.sys.sunrise && nowTs <= c.sys.sunset;
  const icon = owmToIcon(c.weather[0].id, isDay);

  document.getElementById("cname").textContent = `${c.name}`;
  document.getElementById("ccountry").textContent = c.sys.country;
  document.getElementById("tval").textContent = isCel
    ? Math.round(c.main.temp)
    : toF(Math.round(c.main.temp));
  document.getElementById("tunit").textContent = isCel ? "°C" : "°F";
  document.getElementById("cbadge").textContent =
    icon + " " + c.weather[0].description;
  document.getElementById("bicon").textContent = icon;

  const srTime = unixToTime(c.sys.sunrise, tz);
  const ssTime = unixToTime(c.sys.sunset, tz);
  document.getElementById("sr").textContent = srTime.replace(/ [AP]M/, "");
  document.getElementById("ss").textContent = ssTime.replace(/ [AP]M/, "");

  document.getElementById("pfeels").textContent = fmt(c.main.feels_like);
  document.getElementById("phi").textContent = fmt(c.main.temp_max);
  document.getElementById("plo").textContent = fmt(c.main.temp_min);
  document.getElementById("pvis").textContent =
    mToKm(c.visibility || 10000) + " km";
  document.getElementById("pdew").textContent = fmt(
    c.main.temp - (100 - c.main.humidity) / 5,
  );

  const now = new Date();
  document.getElementById("last-updated").textContent =
    `Updated ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  document.getElementById("thum").innerHTML =
    `${c.main.humidity}<span>%</span>`;
  document.getElementById("bhum").style.width = c.main.humidity + "%";
  document.getElementById("shum").textContent =
    c.main.humidity > 80
      ? "Very humid"
      : c.main.humidity > 60
        ? "Moderately humid"
        : "Comfortable";

  const windKmh = Math.round(c.wind.speed * 3.6);
  const gustKmh = c.wind.gust ? Math.round(c.wind.gust * 3.6) : windKmh + 5;
  const wu = isCel ? "km/h" : "mph";
  const ws = isCel ? windKmh : kmhToMph(windKmh);
  const wg = isCel ? gustKmh : kmhToMph(gustKmh);
  document.getElementById("twin").innerHTML = `${ws}<span> ${wu}</span>`;
  document.getElementById("bwin").style.width =
    Math.min(windKmh * 1.8, 100) + "%";
  document.getElementById("swin").textContent =
    degToCompass(c.wind.deg || 0) +
    " — " +
    (windKmh < 20 ? "Light breeze" : windKmh < 40 ? "Moderate" : "Strong");

  document.getElementById("tpres").innerHTML =
    `${c.main.pressure}<span> hPa</span>`;
  document.getElementById("bpres").style.width =
    Math.min(((c.main.pressure - 970) / 60) * 100, 100) + "%";
  document.getElementById("spres").textContent =
    c.main.pressure > 1013 ? "High pressure" : "Low pressure";

  const clouds = c.clouds.all;
  document.getElementById("tcld").innerHTML = `${clouds}<span>%</span>`;
  document.getElementById("bcld").style.width = clouds + "%";
  document.getElementById("scld").textContent =
    clouds < 20
      ? "Clear sky"
      : clouds < 50
        ? "Partly cloudy"
        : clouds < 80
          ? "Mostly cloudy"
          : "Overcast";

  const hrow = document.getElementById("hrow");
  hrow.innerHTML = "";
  if (h && h.length) {
    h.slice(0, 12).forEach((item, i) => {
      const hr = document.createElement("div");
      const dt = new Date(item.dt * 1000);
      const isNow = i === 0;
      hr.className = "hcard" + (isNow ? " now-hr" : "");
      const hIcon = owmToIcon(item.weather[0].id, true);
      const hTemp = isCel
        ? Math.round(item.main.temp)
        : toF(Math.round(item.main.temp));
      const hTime = isNow
        ? "Now"
        : unixToTime(item.dt, tz).replace(/ [AP]M/, "");
      const pop = item.pop ? Math.round(item.pop * 100) : 0;
      hr.innerHTML = `
            <div class="htime ${isNow ? "now-lbl" : ""}">${hTime}</div>
            <span class="hemi">${hIcon}</span>
            <div class="htemp">${hTemp}°</div>
            ${pop > 10 ? `<div class="hpop">💧 ${pop}%</div>` : ""}
          `;
      hrow.appendChild(hr);
    });
  } else {
    hrow.innerHTML =
      '<div style="color:var(--t3);font-size:.8rem;padding:8px">Hourly data unavailable</div>';
  }

  const frow = document.getElementById("frow");
  frow.innerHTML = "";
  if (fc && fc.length) {
    fc.forEach((f, i) => {
      const card = document.createElement("div");
      card.className = "fcard" + (i === 0 ? " tod" : "");
      card.style.animationDelay = 0.42 + i * 0.07 + "s";
      const fIcon = owmToIcon(f.weather[0].id, true);
      const pop = f.pop ? Math.round(f.pop * 100) : 0;
      const dayName =
        i === 0
          ? "Today"
          : new Date(f.dt * 1000).toLocaleDateString("en-US", {
              weekday: "short",
            });
      card.innerHTML = `
            <div class="fday ${i === 0 ? "now" : ""}">${dayName}</div>
            <span class="femi">${fIcon}</span>
            <div class="fhi">${fmts(f.main.temp_max)}</div>
            <div class="flo">${fmts(f.main.temp_min)}</div>
            <div class="ftag">${f.weather[0].description}</div>
            ${pop > 10 ? `<span class="fpop">💧 ${pop}%</span>` : ""}
          `;
      frow.appendChild(card);
    });
  }

  document
    .getElementById("needle")
    .style.setProperty("--deg", (c.wind.deg || 0) + "deg");
  document.getElementById("wspd").textContent = ws + " " + wu;
  document.getElementById("wgust").textContent = wg + " " + wu;
  document.getElementById("wdir").textContent = degToCompass(c.wind.deg || 0);
  const { bf, name } = beaufort(windKmh);
  document.getElementById("wbf").textContent = "🌬️ Bf " + bf + " – " + name;

  const uv =
    d.uvi !== undefined ? Math.round(d.uvi) : Math.round(c.main.humidity / 10);
  document.getElementById("uvnum").textContent = uv;
  document.getElementById("uvc").style.left =
    Math.min((uv / 11) * 100, 100) + "%";
  const uvDesc =
    uv <= 2
      ? "Low — No protection needed"
      : uv <= 5
        ? "Moderate — SPF 30 recommended"
        : uv <= 7
          ? "High — Hat & SPF 50"
          : uv <= 10
            ? "Very High — Minimize exposure"
            : "Extreme — Avoid outdoor";
  document.getElementById("uvlvl").textContent = uvDesc;
  document.getElementById("sisr").textContent = srTime;
  document.getElementById("siss").textContent = ssTime;

  const diff = c.sys.sunset - c.sys.sunrise;
  document.getElementById("sidl").textContent =
    `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  const ghUnix = c.sys.sunset - 1800;
  document.getElementById("sigh").textContent = unixToTime(ghUnix, tz);

  updateMap(lat, lon, c.name);
  startClock(tz);
}

function updateMap(lat, lon, name) {
  const inner = document.getElementById("map-inner");
  inner.innerHTML = `<iframe
        src="https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.3}%2C${lat - 0.2}%2C${lon + 0.3}%2C${lat + 0.2}&amp;layer=mapnik&amp;marker=${lat}%2C${lon}"
        loading="lazy"
        title="${name} map"
        allowfullscreen
      ></iframe>`;
}

function setLoading(loading) {
  document.getElementById("sbtn").disabled = loading;
  document.getElementById("geo-btn").disabled = loading;
  document.getElementById("refresh-btn").disabled = loading;
  if (loading) {
    document.getElementById("sbtn").innerHTML =
      '<span class="spin-inline"></span> Searching';
  } else {
    document.getElementById("sbtn").textContent = "Search";
  }
}

async function fetchByCity(cityName) {
  hideError();
  setLoading(true);
  try {
    const geoRes = await fetch(
      `${GEO_BASE}/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`,
    );
    if (!geoRes.ok) throw new Error(`Geocoding failed (${geoRes.status})`);
    const geoData = await geoRes.json();
    if (!geoData.length)
      throw new Error(`City "${cityName}" not found. Try a different name.`);
    await fetchByCoords(geoData[0].lat, geoData[0].lon, cityName);
  } catch (e) {
    setLoading(false);
    const msg = e.message.includes("401")
      ? "Invalid API key. Check your OpenWeatherMap key."
      : e.message;
    showError(msg);
    toast("❌ " + msg, true);
  }
}

async function fetchByCoords(lat, lon, cityHint = "") {
  hideError();
  setLoading(true);
  try {
    const tzRes = await fetch(
      `${GEO_BASE}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`,
    );
    let tz = "UTC";
    if (tzRes.ok) {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    const [curRes, fRes] = await Promise.all([
      fetch(
        `${OWM_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      ),
      fetch(
        `${OWM_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=40`,
      ),
    ]);

    if (curRes.status === 401)
      throw new Error("Invalid API key. Please check your OpenWeatherMap key.");
    if (!curRes.ok) throw new Error(`Weather API error (${curRes.status})`);

    const cur = await curRes.json();
    const fRaw = fRes.ok ? await fRes.json() : null;

    let dailyList = [];
    if (fRaw && fRaw.list) {
      const seen = new Set();
      dailyList = fRaw.list
        .filter((item) => {
          const day = new Date(item.dt * 1000).toDateString();
          if (!seen.has(day)) {
            seen.add(day);
            return true;
          }
          return false;
        })
        .slice(0, 5);
    }

    const hourly = fRaw ? fRaw.list.slice(0, 12) : null;

    const offsetSec = cur.timezone;
    const offsetH = Math.abs(Math.floor(offsetSec / 3600));
    const offsetM = Math.abs(Math.floor((offsetSec % 3600) / 60));

    tz = guessTimezone(offsetSec, lat, lon) || tz;

    let uvi = undefined;
    try {
      const uvRes = await fetch(
        `${OWM_BASE3}/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&units=metric`,
      );
      if (uvRes.ok) {
        const uvData = await uvRes.json();
        uvi = uvData.current?.uvi;
      }
    } catch (e) {}

    const payload = {
      current: cur,
      forecast: dailyList,
      hourly: hourly,
      tz: tz,
      lat: lat,
      lon: lon,
      uvi: uvi,
    };

    render(payload);
    const displayName = cityHint || cur.name;
    addRecent(displayName);
    localStorage.setItem(LS_CITY_KEY, displayName);
    toast(`📍 ${cur.name}, ${cur.sys.country}`);
    setLoading(false);
  } catch (e) {
    setLoading(false);
    const msg = e.message.includes("401")
      ? "Invalid API key. Check your OpenWeatherMap key."
      : e.message;
    showError(msg);
    toast("❌ " + msg, true);
  }
}

function guessTimezone(offsetSec, lat, lon) {
  const offsetMin = Math.round(offsetSec / 60);
  const zones = Intl.supportedValuesOf
    ? Intl.supportedValuesOf("timeZone")
    : [];
  if (zones.length) {
    for (const z of zones) {
      try {
        const dt = new Date();
        const fmt = new Intl.DateTimeFormat("en", {
          timeZone: z,
          timeZoneName: "shortOffset",
        });
        const parts = fmt.formatToParts(dt);
        const off = parts.find((p) => p.type === "timeZoneName")?.value || "";
        const m = off.match(/([+-])(\d+)(?::(\d+))?/);
        if (m) {
          const sign = m[1] === "+" ? 1 : -1;
          const h = parseInt(m[2]),
            mn = parseInt(m[3] || "0");
          if (sign * (h * 60 + mn) === offsetMin) return z;
        }
      } catch (e) {}
    }
  }

  const sign = offsetSec >= 0 ? "+" : "-";
  const h = Math.abs(Math.floor(offsetSec / 3600));
  const mn = Math.abs(Math.floor((offsetSec % 3600) / 60));
  return `Etc/GMT${sign}${h}`;
}

function getMyLocation() {
  if (!navigator.geolocation) {
    toast("❌ Geolocation not supported by your browser.", true);
    return;
  }
  const btn = document.getElementById("geo-btn");
  btn.innerHTML = '<span class="spin-inline"></span> <span>Locating…</span>';
  btn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      btn.innerHTML = "📍 <span>My Location</span>";
      await fetchByCoords(pos.coords.latitude, pos.coords.longitude, "");
    },
    (err) => {
      btn.innerHTML = "📍 <span>My Location</span>";
      btn.disabled = false;
      const msgs = {
        1: "Location access denied. Please allow location in your browser settings.",
        2: "Location unavailable. Try searching manually.",
        3: "Location request timed out.",
      };
      showError(msgs[err.code] || "Could not get your location.");
      toast("❌ " + (msgs[err.code] || "Location error"), true);
    },
    { timeout: 10000, maximumAge: 300000 },
  );
}

function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.getElementById("theme-btn").innerHTML = dark
    ? "🌙 <span>Dark</span>"
    : "☀️ <span>Light</span>";
  localStorage.setItem(LS_THEME, dark ? "dark" : "light");
}

function doSearch(query) {
  const q = query.trim();
  if (!q) return;
  document.getElementById("sinput").blur();
  fetchByCity(q);
}

document.getElementById("sbtn").onclick = () =>
  doSearch(document.getElementById("sinput").value);
document.getElementById("sinput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch(e.target.value);
});
document.getElementById("geo-btn").onclick = getMyLocation;

document.getElementById("unit-btn").onclick = () => {
  isCel = !isCel;
  localStorage.setItem(LS_UNIT, isCel ? "C" : "F");
  document.getElementById("unit-btn").innerHTML = isCel
    ? "°C <span>/ °F</span>"
    : "°F <span>/ °C</span>";
  if (curData) render(curData);
  toast("Switched to " + (isCel ? "Celsius (°C)" : "Fahrenheit (°F)"));
};

document.getElementById("theme-btn").onclick = () => {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  applyTheme(!dark);
  toast(!dark ? "🌙 Dark mode" : "☀️ Light mode");
};

document.getElementById("refresh-btn").onclick = () => {
  const btn = document.getElementById("refresh-btn");
  btn.style.transform = "rotate(360deg)";
  btn.style.transition = "transform .6s";
  setTimeout(() => {
    btn.style.transform = "";
    btn.style.transition = "";
  }, 700);
  if (curLat && curLon) {
    fetchByCoords(curLat, curLon);
    toast("🔄 Refreshing weather data…");
  } else {
    const last = localStorage.getItem(LS_CITY_KEY);
    if (last) fetchByCity(last);
  }
};

setInterval(() => {
  if (curLat && curLon) fetchByCoords(curLat, curLon);
}, 600000);

window.addEventListener("load", async () => {
  const savedTheme = localStorage.getItem(LS_THEME);
  if (savedTheme) applyTheme(savedTheme === "dark");

  if (!isCel)
    document.getElementById("unit-btn").innerHTML = "°F <span>/ °C</span>";

  renderRecent();

  setTimeout(
    () => document.getElementById("loader").classList.add("gone"),
    600,
  );

  if (navigator.geolocation) {
    document.getElementById("loader-txt").textContent = "DETECTING LOCATION";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetchByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      async () => {
        const last = localStorage.getItem(LS_CITY_KEY) || "Pune";
        await fetchByCity(last);
      },
      { timeout: 5000, maximumAge: 300000 },
    );
  } else {
    const last = localStorage.getItem(LS_CITY_KEY) || "Pune";
    await fetchByCity(last);
  }
});


