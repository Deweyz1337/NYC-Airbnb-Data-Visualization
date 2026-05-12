/**
 * dashboard2.js - Dashboard 2 render controller only.
 */

(function () {
  const D2 = window.Dashboard2 = window.Dashboard2 || {};
  let resizeTimer = null;
  let renderSeq = 0;
  let hasDrawnDashboard2 = false;
  let controlsInitialized = false;

  function updateBookingSortControl() {
    const iconAsc = document.getElementById('page2IconSortAsc');
    const iconDesc = document.getElementById('page2IconSortDesc');
    const sortToggle = document.getElementById('page2BookingSortToggle');
    const sortOrder = D2.getBookingSortOrder ? D2.getBookingSortOrder() : 'desc';

    if (iconAsc) iconAsc.style.display = sortOrder === 'asc' ? 'block' : 'none';
    if (iconDesc) iconDesc.style.display = sortOrder === 'desc' ? 'block' : 'none';
    if (sortToggle) {
      sortToggle.title = sortOrder === 'desc' ? 'Dang sap xep giam dan' : 'Dang sap xep tang dan';
    }
  }

  function initDashboard2Controls() {
    if (controlsInitialized) return;
    controlsInitialized = true;

    const sortToggle = document.getElementById('page2BookingSortToggle');
    if (sortToggle) {
      sortToggle.addEventListener('click', event => {
        event.stopPropagation();
        if (typeof D2.toggleBookingSortOrder === 'function') {
          D2.toggleBookingSortOrder();
        }
      });
    }
  }

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

    initDashboard2Controls();
    updateBookingSortControl();

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
        updateBookingSortControl();
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
