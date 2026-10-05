const dataset = window.PATMOS_DATASET;
const head = document.querySelector("[data-table-head]");
const body = document.querySelector("[data-table-body]");
const rowCount = document.querySelector("[data-row-count]");

const coordinateColumns = new Set(["x", "y"]);
const preferredColumns = [
  "id",
  "name (local or google maps)",
  "Dedication_Inferred",
  "const_date",
  "apoc_ref",
  "door",
  "nautical",
  "signage_check",
];
const displayColumns = [
  ...preferredColumns.filter((column) => dataset.columns.includes(column)),
  ...dataset.columns.filter((column) => !preferredColumns.includes(column)),
].map((column) => ({ column, sourceIndex: dataset.columns.indexOf(column) }));
let sortColumn = null;
let sortDirection = "ascending";

function humanizeHeader(value) {
  if (value === "x") return "Longitude (hidden)";
  if (value === "y") return "Latitude (hidden)";
  return String(value).replaceAll("_", " ");
}

function render(rows) {
  body.replaceChildren();
  const fragment = document.createDocumentFragment();

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    displayColumns.forEach(({ column, sourceIndex }) => {
      const td = document.createElement("td");
      const value = row[sourceIndex];
      td.dataset.label = humanizeHeader(column);
      td.textContent = coordinateColumns.has(column)
        ? "Coordinates withheld"
        : value === null || value === ""
          ? "Not recorded"
          : String(value);
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });

  body.appendChild(fragment);
  rowCount.textContent = rows.length;
}

function compareValues(a, b, index) {
  const first = a[index];
  const second = b[index];
  if (first === null || first === "") return second === null || second === "" ? 0 : 1;
  if (second === null || second === "") return -1;
  if (typeof first === "number" && typeof second === "number") return first - second;
  return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: "base" });
}

function updateSortIndicators() {
  document.querySelectorAll("[data-sort-column]").forEach((button) => {
    const active = Number(button.dataset.sortColumn) === sortColumn;
    button.dataset.direction = active ? sortDirection : "none";
    button.setAttribute("aria-sort", active ? sortDirection : "none");
  });
}

displayColumns.forEach(({ column, sourceIndex }) => {
  const th = document.createElement("th");
  th.scope = "col";
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.sortColumn = sourceIndex;
  button.dataset.direction = "none";
  button.setAttribute("aria-sort", "none");
  button.textContent = humanizeHeader(column);
  button.addEventListener("click", () => {
    if (sortColumn === sourceIndex) {
      sortDirection = sortDirection === "ascending" ? "descending" : "ascending";
    } else {
      sortColumn = sourceIndex;
      sortDirection = "ascending";
    }
    const sorted = [...dataset.rows].sort((a, b) => {
      const result = compareValues(a, b, sourceIndex);
      return sortDirection === "ascending" ? result : -result;
    });
    render(sorted);
    updateSortIndicators();
  });
  th.appendChild(button);
  head.appendChild(th);
});

render(dataset.rows);
