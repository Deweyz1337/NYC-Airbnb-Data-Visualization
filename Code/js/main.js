/**
 * main.js - app bootstrap only.
 */

loadData().then(() => {
  document.getElementById('loader').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';

  initFilters();
  initDashboard1();
  initNavigation();

  if (typeof initPanelDragDrop === 'function') initPanelDragDrop();
  initResizers();

  requestAnimationFrame(() => {
    if (typeof window.updateDashboard === 'function') {
      window.updateDashboard();
    }
  });
});
