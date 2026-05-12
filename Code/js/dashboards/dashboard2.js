/**
 * dashboard2.js - Dashboard 2 render controller only.
 */

(function () {
  const D2 = window.Dashboard2 = window.Dashboard2 || {};
  let resizeTimer = null;
  let renderSeq = 0;
  let hasDrawnDashboard2 = false;

  function drawDashboard2(listings, geojson) {
    const selectedListings = D2.applySelection(listings);
    const neighborhoodMapData = D2.buildBrooklynRevenueMapData(selectedListings, geojson);
    const fullNeighborhoodMapData = D2.buildBrooklynRevenueMapData(listings, geojson);
    const roomShareData = D2.buildRoomShareData(selectedListings);
    const bookingChartListings = D2.getBookingChartListings(listings, selectedListings);
    const neighborhoodData = D2.buildNeighborhoodData(bookingChartListings);

    D2.drawKpiPanels(selectedListings);
    D2.drawBrooklynRevenueChoropleth(neighborhoodMapData, geojson, fullNeighborhoodMapData);
    D2.drawRoomShareChart(roomShareData);
    D2.drawBrooklynBookingChart(neighborhoodData);
  }

  function renderDashboard2() {
    const page2 = document.getElementById('page2');
    if (!page2 || window.currentPage !== 1) return;

    const seq = ++renderSeq;
    if (!hasDrawnDashboard2) {
      D2.setLoading();
    }

    Promise.all([
      D2.loadListings(),
      D2.loadNeighborhoodGeojson(),
    ]).then(([listings, geojson]) => {
      if (seq !== renderSeq || window.currentPage !== 1) return;
      requestAnimationFrame(() => {
        if (seq !== renderSeq || window.currentPage !== 1) return;
        drawDashboard2(listings, geojson);
        hasDrawnDashboard2 = true;
      });
    });
  }

  window.renderDashboard2 = renderDashboard2;

  window.addEventListener('resize', () => {
    if (window.currentPage !== 1) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderDashboard2();
    }, 120);
  });
})();
