# Weather Dashboard

A simple, modern weather dashboard built with HTML, CSS, and JavaScript.

## Features
- Search for weather by city
- Uses the public Open-Meteo API (no API key required)
- Displays current conditions and 7-day forecast
- Shows next 12 hours of hourly weather
- Responsive layout for desktop and mobile

## Local setup
Open `index.html` directly in a browser, or serve the folder with any static server.

Example:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Files
- `index.html` – app layout
- `styles.css` – dashboard styling
- `app.js` – weather fetching and rendering

## Notes
This project uses the Open-Meteo geocoding and forecast APIs, which are free for public use.
