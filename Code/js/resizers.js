/**
 * resizers.js — Drag-to-resize cho các panel
 */

function initResizers() {
  const resizerH = document.getElementById('resizerH');
  const resizerV = document.getElementById('resizerV');
  const mainGrid = document.getElementById('mainGrid');

  let isResizingH = false;
  let isResizingV = false;
  let rafPending = false;

  function isResizableNode(node) {
    return node && node.classList && (
      node.classList.contains('panel') ||
      node.classList.contains('dashboard-dnd-column')
    );
  }

  function getAdjacentResizable(resizer, direction) {
    let node = direction === 'previous' ? resizer.previousElementSibling : resizer.nextElementSibling;
    while (node && !isResizableNode(node)) {
      node = direction === 'previous' ? node.previousElementSibling : node.nextElementSibling;
    }
    return node;
  }

  function getAdjacentPanel(resizer, direction) {
    let node = direction === 'previous' ? resizer.previousElementSibling : resizer.nextElementSibling;
    while (node && !(node.classList && node.classList.contains('panel'))) {
      node = direction === 'previous' ? node.previousElementSibling : node.nextElementSibling;
    }
    return node;
  }

  if (resizerH) {
    resizerH.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizingH = true;
      resizerH.classList.add('active');
      document.body.classList.add('is-resizing');
      document.body.style.cursor = 'col-resize';
    });
  }

  if (resizerV) {
    resizerV.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizingV = true;
      resizerV.classList.add('active');
      document.body.classList.add('is-resizing');
      document.body.style.cursor = 'row-resize';
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (!isResizingH && !isResizingV) return;
    if (rafPending) return;
    rafPending = true;

    requestAnimationFrame(() => {
      if (isResizingH) {
        const leftColumn = getAdjacentResizable(resizerH, 'previous');
        const rightColumn = getAdjacentResizable(resizerH, 'next');
        if (!leftColumn || !rightColumn) {
          rafPending = false;
          return;
        }

        const rect = mainGrid.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const totalWidth = rect.width - resizerH.offsetWidth;
        let leftFlex = x / totalWidth;
        leftFlex = Math.max(0.1, Math.min(0.9, leftFlex));
        leftColumn.style.flex = leftFlex;
        rightColumn.style.flex = 1 - leftFlex;
      }

      if (isResizingV) {
        const column = resizerV.parentElement;
        const topPanel = getAdjacentPanel(resizerV, 'previous');
        const bottomPanel = getAdjacentPanel(resizerV, 'next');
        if (!column || !topPanel || !bottomPanel) {
          rafPending = false;
          return;
        }

        const rect = column.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const totalHeight = rect.height - resizerV.offsetHeight;
        let topFlex = y / totalHeight;
        topFlex = Math.max(0.1, Math.min(0.9, topFlex));
        topPanel.style.flex = topFlex;
        bottomPanel.style.flex = 1 - topFlex;
      }
      rafPending = false;
    });
  });

  document.addEventListener('mouseup', () => {
    if (isResizingH || isResizingV) {
      isResizingH = false;
      isResizingV = false;
      if (resizerH) resizerH.classList.remove('active');
      if (resizerV) resizerV.classList.remove('active');
      document.body.classList.remove('is-resizing');
      document.body.style.cursor = '';
      if (window.updateDashboard) window.updateDashboard();
    }
  });
}
