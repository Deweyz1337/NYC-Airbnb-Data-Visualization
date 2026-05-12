/**
 * dashboard1.js - Dashboard 1 orchestration only.
 */

function buildDashboard1YearData(reviews) {
  const reviewsByYear = d3.rollup(reviews, v => v.length, d => d.date.split('-')[0]);
  const yearData = [];

  for (let y = 2009; y <= 2025; y++) {
    yearData.push({ year: y, count: reviewsByYear.get(String(y)) || 0 });
  }

  return yearData;
}

function buildDashboard1SentimentData(reviews) {
  const boroughs = ['Brooklyn', 'Manhattan', 'Queens', 'Bronx', 'Staten Island'];
  const sentMap = {};
  boroughs.forEach(b => { sentMap[b] = { positive: 0, neutral: 0, negative: 0 }; });

  reviews.forEach(r => {
    const borough = window.listingBoroughMap.get(r.listing_id);
    if (borough && sentMap[borough]) sentMap[borough][r.sentiment]++;
  });

  return { sentMap, boroughs };
}

function buildDashboard1NeighbourhoodData(reviews) {
  const neighbourhoodReviews = d3.rollup(
    reviews,
    v => v.length,
    r => window.listingNeighbourhoodMap.get(r.listing_id)
  );

  window.allNeighbourhoodData = Array.from(neighbourhoodReviews, ([name, count]) => ({
    neighbourhood: name,
    count,
  }));

  return [...window.allNeighbourhoodData]
    .sort((a, b) => (
      window.barSortOrder === 'desc'
        ? b.count - a.count
        : a.count - b.count
    ))
    .slice(0, 30);
}

function updateDashboard1Title() {
  const title = document.querySelector('#barPanel h2');
  if (!title) return;

  title.textContent =
    (window.currentBorough ? `[${window.currentBorough}] ` : '') +
    (window.barSortOrder === 'desc'
      ? 'Khu vực được review nhiều nhất'
      : 'Khu vực được review ít nhất');
}

function updateDashboard1SortIcon() {
  const sortToggleEl = document.getElementById('sortToggle');
  if (!sortToggleEl) return;

  const iconAsc = document.getElementById('icon-sort-asc');
  const iconDesc = document.getElementById('icon-sort-desc');
  if (!iconAsc || !iconDesc) return;

  iconAsc.style.display = window.barSortOrder === 'asc' ? 'block' : 'none';
  iconDesc.style.display = window.barSortOrder === 'desc' ? 'block' : 'none';
}

function updateDashboard1() {
  const fullyFiltered = getFiltered([]);
  const totalNumberEl = document.getElementById('totalNumber');
  if (totalNumberEl) totalNumberEl.textContent = fmt(fullyFiltered.length);

  drawLineChart(buildDashboard1YearData(getFiltered(['year'])));

  const sentimentData = buildDashboard1SentimentData(getFiltered(['borough', 'sentiment']));
  drawSentimentTable(sentimentData.sentMap, sentimentData.boroughs);

  updateDashboard1Title();
  updateDashboard1SortIcon();
  drawBarChart(buildDashboard1NeighbourhoodData(getFiltered(['neighbourhood'])));
}

function triggerDashboard1Update() {
  const overlay = document.getElementById('overlayLoader');
  if (overlay) overlay.style.display = 'flex';

  setTimeout(() => {
    updateDashboard1();
    if (overlay) overlay.style.display = 'none';
  }, 50);
}

function initDashboard1() {
  window.updateDashboard = updateDashboard1;
  window.triggerUpdate = triggerDashboard1Update;

  const sortToggleEl = document.getElementById('sortToggle');
  if (sortToggleEl) {
    sortToggleEl.addEventListener('click', window.toggleBarSort);
  }
}
