(() => {
  const points = window.PATMOS_MAP_DATA ?? [];
  const mapElement = document.querySelector("#church-map");
  const countElement = document.querySelector("[data-map-count]");
  const titleElement = document.querySelector("[data-legend-title]");
  const itemsElement = document.querySelector("[data-legend-items]");

  if (!mapElement || typeof window.L === "undefined") return;

  const map = L.map(mapElement, { scrollWheelZoom: true }).setView([37.31, 26.55], 12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const markerLayer = L.layerGroup().addTo(map);
  const datedPoints = points.filter((point) => Number.isFinite(point.year));
  const years = datedPoints.map((point) => point.year);
  const minYear = years.length ? Math.min(...years) : 0;
  const maxYear = years.length ? Math.max(...years) : 1;

  function yearColor(year) {
    if (!Number.isFinite(year)) return "#7d8794";
    const position = (year - minYear) / Math.max(1, maxYear - minYear);
    const hue = 44 - position * 34;
    const lightness = 57 - position * 7;
    return `hsl(${hue} 78% ${lightness}%)`;
  }

  function dedicationColor(dedication) {
    const value = dedication || "Not recorded";
    let hash = 0;
    for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return `hsl(${hash % 360} 58% 46%)`;
  }

  function colorFor(point, mode) {
    if (mode === "year") return yearColor(point.year);
    if (mode === "dedication") return dedicationColor(point.dedication);
    return "#2a5585";
  }

  function popupFor(point) {
    const popup = document.createElement("div");
    popup.className = "map-popup";

    const name = document.createElement("strong");
    name.textContent = point.name || `Record ${point.id}`;
    popup.append(name);

    const dedication = document.createElement("span");
    dedication.textContent = `Dedication: ${point.dedication || "Not recorded"}`;
    popup.append(dedication);

    const year = document.createElement("span");
    year.textContent = `Year: ${Number.isFinite(point.year) ? point.year : "Not recorded"}`;
    popup.append(year);
    return popup;
  }

  function addLegendItem(color, label) {
    const row = document.createElement("div");
    row.className = "legend-item";
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = color;
    const text = document.createElement("span");
    text.textContent = label;
    row.append(swatch, text);
    itemsElement.append(row);
  }

  function renderLegend(mode) {
    itemsElement.replaceChildren();
    if (mode === "year") {
      titleElement.textContent = "Year of creation";
      const ramp = document.createElement("div");
      ramp.className = "year-ramp";
      const first = document.createElement("span");
      first.textContent = minYear || "Earlier";
      const last = document.createElement("span");
      last.textContent = maxYear || "Later";
      ramp.append(first, last);
      itemsElement.append(ramp);
      addLegendItem("#7d8794", "Year not recorded");
      return;
    }

    if (mode === "dedication") {
      titleElement.textContent = "Dedication";
      const dedications = [...new Set(points.map((point) => point.dedication || "Not recorded"))]
        .sort((a, b) => a.localeCompare(b));
      dedications.forEach((dedication) => addLegendItem(dedicationColor(dedication), dedication));
      return;
    }

    titleElement.textContent = "Single symbol";
    addLegendItem("#2a5585", "Church location");
  }

  function render(mode) {
    markerLayer.clearLayers();
    points.forEach((point) => {
      L.circleMarker([point.lat, point.lng], {
        radius: 7,
        color: "#ffffff",
        weight: 1.5,
        fillColor: colorFor(point, mode),
        fillOpacity: 0.9,
      }).bindPopup(popupFor(point)).addTo(markerLayer);
    });
    renderLegend(mode);
  }

  if (countElement) countElement.textContent = points.length;
  if (points.length) {
    map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [28, 28] });
  }

  document.querySelectorAll('input[name="map-mode"]').forEach((input) => {
    input.addEventListener("change", () => render(input.value));
  });
  render("single");
})();
