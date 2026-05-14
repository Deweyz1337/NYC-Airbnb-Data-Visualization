/**
 * navigation.js — Dashboard combobox navigation
 */

function initNavigation() {
  window.currentPage = 0;
  const navLabels = ['Dashboard 1', 'Dashboard 2'];
  const dashboardTitles = ['Tình hình đánh giá tại New York City', 'Phân tích doanh thu và nhu cầu đặt phòng tại Brooklyn'];

  window.goToPage = (page) => {
    window.currentPage = page;

    // Cập nhật header và label
    document.getElementById('dashboardTitle').textContent = dashboardTitles[page];
    document.getElementById('dashSelectLabel').textContent = navLabels[page];

    // Cập nhật trạng thái active các option
    document.querySelectorAll('.dash-option').forEach(opt => {
      opt.classList.toggle('active', parseInt(opt.dataset.page) === page);
    });

    // Ẩn/hiện dashboard pages
    const mainGrid = document.getElementById('mainGrid');
    const page2 = document.getElementById('page2');
    if (page === 0) {
      if (mainGrid) mainGrid.style.display = 'flex';
      if (page2) page2.style.display = 'none';
    } else {
      if (mainGrid) mainGrid.style.display = 'none';
      if (page2) page2.style.display = 'flex';
      if (typeof window.renderDashboard2 === 'function') {
        window.renderDashboard2();
      }
    }

    // Đóng dropdown
    document.getElementById('dashSelect').classList.remove('open');
  };

  // Mở/đóng dropdown
  document.getElementById('dashSelectTrigger').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('dashSelect').classList.toggle('open');
  });

  // Chọn option
  document.querySelectorAll('.dash-option').forEach(opt => {
    opt.addEventListener('click', () => window.goToPage(parseInt(opt.dataset.page)));
  });

  // Click ra ngoài → đóng
  document.addEventListener('click', () => {
    document.getElementById('dashSelect').classList.remove('open');
  });

  window.goToPage(0);
}
