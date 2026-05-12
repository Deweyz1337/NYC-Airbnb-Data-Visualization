/**
 * dashboard2Kpis.js - Dashboard 2 KPI panels and loading state.
 */

(function () {
  const D2 = window.Dashboard2 = window.Dashboard2 || {};

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  D2.drawKpiPanels = function drawKpiPanels(listings) {
    const data = D2.buildKpiData(listings);
    setText('dashboard2TotalRevenue', D2.formatRevenueValue(data.totalRevenue));
    setText('dashboard2AreaCount', D2.fmtInt(data.areaCount));
    setText('dashboard2BookedDays', D2.fmtInt(Math.round(data.totalBookedDays)));
  };

  D2.setLoading = function setLoading() {
    const revenueMap = document.getElementById('brooklynRevenueMap');
    const revenueLegend = document.getElementById('brooklynRevenueLegend');
    const roomChart = document.getElementById('roomShareChart');
    const roomLegend = document.getElementById('roomShareLegend');
    const bookingChart = document.getElementById('brooklynBookingChart');

    setText('dashboard2TotalRevenue', '---');
    setText('dashboard2AreaCount', '---');
    setText('dashboard2BookedDays', '---');
    if (revenueMap) revenueMap.innerHTML = '<div class="page2-empty">Loading data...</div>';
    if (revenueLegend) revenueLegend.innerHTML = '';
    if (roomChart) roomChart.innerHTML = '<div class="page2-empty">Loading data...</div>';
    if (roomLegend) roomLegend.innerHTML = '';
    if (bookingChart) bookingChart.innerHTML = '<div class="page2-empty">Loading data...</div>';
  };
})();
