/**
 * filters.js — Quản lý trạng thái filter và cross-filter logic
 */

function initFilters() {
  window.currentBorough = null;
  window.currentSentiment = null;
  window.currentNeighbourhood = null;
  window.currentYear = null;
  window.barSortOrder = 'desc';
}

/**
 * Trả về mảng reviews đã lọc, bỏ qua các filter trong `exclude`
 */
function getFiltered(exclude = []) {
  return window.allReviews.filter(r => {
    if (!exclude.includes('borough') && window.currentBorough &&
      window.listingBoroughMap.get(r.listing_id) !== window.currentBorough) return false;
    if (!exclude.includes('sentiment') && window.currentSentiment &&
      r.sentiment !== window.currentSentiment) return false;
    if (!exclude.includes('neighbourhood') && window.currentNeighbourhood &&
      window.listingNeighbourhoodMap.get(r.listing_id) !== window.currentNeighbourhood) return false;
    if (!exclude.includes('year') && window.currentYear &&
      r.date.split('-')[0] !== String(window.currentYear)) return false;
    return true;
  });
}

// Toggle functions
window.toggleBorough = (b) => {
  window.currentBorough = (window.currentBorough === b) ? null : b;
  window.triggerUpdate();
};

window.toggleSentiment = (s) => {
  window.currentSentiment = (window.currentSentiment === s) ? null : s;
  window.triggerUpdate();
};

window.toggleNeighbourhood = (n) => {
  window.currentNeighbourhood = (window.currentNeighbourhood === n) ? null : n;
  window.triggerUpdate();
};

window.toggleYear = (y) => {
  window.currentYear = (window.currentYear === String(y)) ? null : String(y);
  window.triggerUpdate();
};

window.toggleBarSort = () => {
  window.barSortOrder = (window.barSortOrder === 'desc') ? 'asc' : 'desc';
  window.triggerUpdate();
};
