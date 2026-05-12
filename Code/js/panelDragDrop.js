/**
 * panelDragDrop.js - Tree-based drag/drop layout for dashboard panels.
 * Drop near top/bottom to split vertically, near left/right to split horizontally.
 */

function initPanelDragDrop() {
  const dashboards = [
    {
      id: 'dashboard1',
      rootId: 'mainGrid',
      panelIds: ['linePanel', 'sentPanel', 'barPanel'],
      initialTree: split('row',
        sized(split('column', panel('linePanel'), panel('sentPanel')), 1.35),
        sized(panel('barPanel'), 1)
      ),
      render: () => {
        if (typeof window.updateDashboard === 'function') window.updateDashboard();
      },
    },
    {
      id: 'dashboard2',
      rootId: 'page2MainGrid',
      panelIds: [
        'page2RevenueKpiPanel',
        'page2AreaKpiPanel',
        'page2BookedDaysKpiPanel',
        'page2ScatterPanel',
        'page2BookingPanel',
        'page2RoomPanel',
      ],
      initialTree: split('column',
        sized(split('row',
          sized(split('column',
            panel('page2RevenueKpiPanel'),
            panel('page2AreaKpiPanel'),
            panel('page2BookedDaysKpiPanel')
          ), 0.42),
          panel('page2ScatterPanel'),
          panel('page2RoomPanel')
        ), 1),
        sized(panel('page2BookingPanel'), 1.15)
      ),
      render: () => {
        if (typeof window.renderDashboard2 === 'function') window.renderDashboard2();
      },
    },
  ];

  const state = new Map();
  const placeholder = document.createElement('div');
  placeholder.className = 'panel-drop-placeholder';
  placeholder.textContent = 'Tha chart vao day';
  placeholder.setAttribute('aria-hidden', 'true');

  let dragging = null;
  let pendingDrop = null;
  let renderTimer = null;

  function panel(id, size = 1) {
    return { type: 'panel', id, size };
  }

  function split(direction, ...children) {
    return { type: 'split', direction, children };
  }

  function sized(node, size) {
    return { ...node, size };
  }

  function cloneTree(node) {
    if (!node) return null;
    if (node.type === 'panel') return sized(panel(node.id), node.size || 1);
    return sized(split(node.direction, ...node.children.map(cloneTree).filter(Boolean)), node.size || 1);
  }

  function normalizeTree(node) {
    if (!node) return null;
    if (node.type === 'panel') return node;

    const children = node.children.map(normalizeTree).filter(Boolean);
    if (!children.length) return null;
    if (children.length === 1) return children[0];
    return sized(split(node.direction, ...children), node.size || 1);
  }

  function getDashboardConfig(id) {
    return dashboards.find(dashboard => dashboard.id === id);
  }

  function findPanelElement(panelId) {
    return document.getElementById(panelId);
  }

  function collectPanelElements(config) {
    const panelElements = new Map();
    config.panelIds.forEach(panelId => {
      const panelEl = findPanelElement(panelId);
      if (panelEl) panelElements.set(panelId, panelEl);
    });
    return panelElements;
  }

  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function pathToString(path) {
    return path.join('.');
  }

  function parsePath(value) {
    if (!value) return [];
    return value.split('.').filter(Boolean).map(Number);
  }

  function getNodeAtPath(node, path) {
    return path.reduce((current, index) => {
      if (!current || current.type !== 'split') return null;
      return current.children[index] || null;
    }, node);
  }

  function setNodeSizeAtPath(node, path, size) {
    const target = getNodeAtPath(node, path);
    if (target) target.size = size;
  }

  function applyPanelLayout(panelEl) {
    panelEl.style.minWidth = '0';
    panelEl.style.minHeight = '0';
    panelEl.style.display = 'flex';
    panelEl.style.flexDirection = 'column';
  }

  function startResize(event, config, direction, prevEl, nextEl, prevPath, nextPath) {
    event.preventDefault();
    event.stopPropagation();

    const tree = state.get(config.id);
    if (!tree) return;

    const isRow = direction === 'row';
    const startPointer = isRow ? event.clientX : event.clientY;
    const prevRect = prevEl.getBoundingClientRect();
    const nextRect = nextEl.getBoundingClientRect();
    const prevStart = isRow ? prevRect.width : prevRect.height;
    const nextStart = isRow ? nextRect.width : nextRect.height;
    const total = Math.max(prevStart + nextStart, 1);
    const minSize = Math.min(90, total * 0.35);

    document.body.classList.add('is-resizing');
    document.body.style.cursor = isRow ? 'col-resize' : 'row-resize';

    function onMove(moveEvent) {
      const pointer = isRow ? moveEvent.clientX : moveEvent.clientY;
      const delta = pointer - startPointer;
      const prevSize = Math.max(minSize, Math.min(total - minSize, prevStart + delta));
      const nextSize = total - prevSize;
      const prevFlex = prevSize / total;
      const nextFlex = nextSize / total;

      prevEl.style.flex = `${prevFlex} 1 0`;
      nextEl.style.flex = `${nextFlex} 1 0`;
      setNodeSizeAtPath(tree, prevPath, prevFlex);
      setNodeSizeAtPath(tree, nextPath, nextFlex);
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('is-resizing');
      document.body.style.cursor = '';
      scheduleRender(config);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function createResizeHandle(config, direction, prevEl, nextEl, prevPath, nextPath) {
    const handle = document.createElement('div');
    handle.className = `dashboard-layout-resizer dashboard-layout-resizer-${direction}`;
    handle.addEventListener('mousedown', event => {
      startResize(event, config, direction, prevEl, nextEl, prevPath, nextPath);
    });
    return handle;
  }

  function buildLayoutElement(config, node, panelElements, path = []) {
    if (!node) return null;

    if (node.type === 'panel') {
      const panelEl = panelElements.get(node.id) || findPanelElement(node.id);
      if (!panelEl) return null;
      applyPanelLayout(panelEl);
      panelEl.style.flex = `${node.size || 1} 1 0`;
      panelEl.dataset.layoutPath = pathToString(path);
      return panelEl;
    }

    const wrapper = document.createElement('div');
    wrapper.className = `dashboard-layout-split dashboard-layout-split-${node.direction}`;
    wrapper.style.flex = `${node.size || 1} 1 0`;
    wrapper.dataset.layoutPath = pathToString(path);
    wrapper.dataset.layoutDirection = node.direction;

    const childEntries = [];
    node.children.forEach((child, index) => {
      const childPath = path.concat(index);
      const childEl = buildLayoutElement(config, child, panelElements, childPath);
      if (childEl) childEntries.push({ childEl, childPath });
    });

    childEntries.forEach((entry, index) => {
      wrapper.appendChild(entry.childEl);
      const nextEntry = childEntries[index + 1];
      if (nextEntry) {
        wrapper.appendChild(createResizeHandle(
          config,
          node.direction,
          entry.childEl,
          nextEntry.childEl,
          entry.childPath,
          nextEntry.childPath
        ));
      }
    });
    return wrapper.childElementCount ? wrapper : null;
  }

  function renderTree(config, tree) {
    const root = document.getElementById(config.rootId);
    if (!root) return;

    const nextTree = normalizeTree(cloneTree(tree));
    const panelElements = collectPanelElements(config);
    const layoutEl = buildLayoutElement(config, nextTree, panelElements);

    root.classList.add('dashboard-dnd-root');
    clearElement(root);
    if (layoutEl) root.appendChild(layoutEl);

    state.set(config.id, cloneTree(nextTree));
  }

  function removePanelFromTree(node, panelId) {
    if (!node) return null;
    if (node.type === 'panel') {
      return node.id === panelId ? null : cloneTree(node);
    }

    return normalizeTree(sized(split(
      node.direction,
      ...node.children.map(child => removePanelFromTree(child, panelId)).filter(Boolean)
    ), node.size || 1));
  }

  function findPathToPanel(node, panelId, path = []) {
    if (!node) return null;
    if (node.type === 'panel') {
      return node.id === panelId ? path : null;
    }

    for (let index = 0; index < node.children.length; index += 1) {
      const found = findPathToPanel(node.children[index], panelId, path.concat(index));
      if (found) return found;
    }

    return null;
  }

  function insertSiblingAtPath(node, targetPath, draggedNode, position, fallbackDirection) {
    if (!node) return draggedNode;

    if (!targetPath.length || node.type !== 'split') {
      const direction = fallbackDirection || 'column';
      return position === 'before'
        ? split(direction, draggedNode, cloneTree(node))
        : split(direction, cloneTree(node), draggedNode);
    }

    const [head, ...rest] = targetPath;
    const children = node.children.map(cloneTree);

    if (!rest.length) {
      const insertIndex = position === 'before' ? head : head + 1;
      children.splice(insertIndex, 0, draggedNode);
      return normalizeTree(sized(split(node.direction, ...children), node.size || 1));
    }

    children[head] = insertSiblingAtPath(
      node.children[head],
      rest,
      draggedNode,
      position,
      fallbackDirection
    );
    return normalizeTree(sized(split(node.direction, ...children), node.size || 1));
  }

  function insertAtSplitIndex(node, parentPath, insertIndex, draggedNode, fallbackDirection) {
    if (!node) return draggedNode;

    if (!parentPath.length) {
      if (node.type !== 'split') {
        return split(fallbackDirection || 'column', cloneTree(node), draggedNode);
      }

      const children = node.children.map(cloneTree);
      const clampedIndex = Math.max(0, Math.min(children.length, insertIndex));
      children.splice(clampedIndex, 0, draggedNode);
      return normalizeTree(sized(split(node.direction, ...children), node.size || 1));
    }

    if (node.type !== 'split') return cloneTree(node);

    const [head, ...rest] = parentPath;
    const children = node.children.map((child, index) => (
      index === head
        ? insertAtSplitIndex(child, rest, insertIndex, draggedNode, fallbackDirection)
        : cloneTree(child)
    ));

    return normalizeTree(sized(split(node.direction, ...children), node.size || 1));
  }

  function createSplitForDrop(targetNode, draggedNode, zone) {
    const direction = zone === 'left' || zone === 'right' ? 'row' : 'column';
    const before = zone === 'left' || zone === 'top';
    const nextSplit = before
      ? split(direction, draggedNode, cloneTree(targetNode))
      : split(direction, cloneTree(targetNode), draggedNode);
    return sized(nextSplit, targetNode.size || 1);
  }

  function insertPanelAtTarget(node, targetPanelId, draggedNode, zone) {
    if (!node) return { node: null, inserted: false };

    if (node.type === 'panel') {
      if (node.id !== targetPanelId) {
        return { node: cloneTree(node), inserted: false };
      }

      return {
        node: createSplitForDrop(node, draggedNode, zone),
        inserted: true,
      };
    }

    let inserted = false;
    const children = node.children.map(child => {
      if (inserted) return cloneTree(child);
      const result = insertPanelAtTarget(child, targetPanelId, draggedNode, zone);
      inserted = result.inserted;
      return result.node;
    }).filter(Boolean);

    return {
      node: normalizeTree(sized(split(node.direction, ...children), node.size || 1)),
      inserted,
    };
  }

  function computePanelDropTree(config, draggedPanelId, targetPanelId, zone) {
    const currentTree = state.get(config.id) || config.initialTree;
    const treeWithoutDragged = removePanelFromTree(currentTree, draggedPanelId);
    const result = insertPanelAtTarget(treeWithoutDragged, targetPanelId, panel(draggedPanelId), zone);
    return result.inserted ? normalizeTree(result.node) : currentTree;
  }

  function computeGroupDropTree(config, draggedPanelId, targetPanelId, dropTarget) {
    const currentTree = state.get(config.id) || config.initialTree;
    const treeWithoutDragged = removePanelFromTree(currentTree, draggedPanelId);
    const targetPanelPath = findPathToPanel(treeWithoutDragged, targetPanelId);
    if (!targetPanelPath) return currentTree;

    let targetPath = targetPanelPath;
    if (dropTarget.promoteGroup && targetPanelPath.length >= 2) {
      targetPath = targetPanelPath.slice(0, -1);
    }

    return normalizeTree(insertSiblingAtPath(
      treeWithoutDragged,
      targetPath,
      panel(draggedPanelId),
      dropTarget.position,
      dropTarget.parentDirection
    ));
  }

  function computeSplitIndexDropTree(config, draggedPanelId, dropTarget) {
    const currentTree = state.get(config.id) || config.initialTree;
    const treeWithoutDragged = removePanelFromTree(currentTree, draggedPanelId);
    const draggedPath = findPathToPanel(currentTree, draggedPanelId);
    let insertIndex = dropTarget.insertIndex;

    if (
      draggedPath &&
      draggedPath.length === dropTarget.parentPath.length + 1 &&
      draggedPath.slice(0, -1).every((value, index) => value === dropTarget.parentPath[index]) &&
      draggedPath[draggedPath.length - 1] < insertIndex
    ) {
      insertIndex -= 1;
    }

    return normalizeTree(insertAtSplitIndex(
      treeWithoutDragged,
      dropTarget.parentPath,
      insertIndex,
      panel(draggedPanelId),
      dropTarget.parentDirection
    ));
  }

  function computeDropTree(config, draggedPanelId, dropTarget) {
    if (dropTarget.mode === 'split-index') {
      return computeSplitIndexDropTree(config, draggedPanelId, dropTarget);
    }

    if (dropTarget.mode === 'group') {
      return computeGroupDropTree(config, draggedPanelId, dropTarget.targetPanelId, dropTarget);
    }

    return computePanelDropTree(
      config,
      draggedPanelId,
      dropTarget.targetPanelId,
      dropTarget.zone
    );
  }

  function getEdgeInfo(panelEl, event) {
    const rect = panelEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));

    const distances = [
      { zone: 'left', value: x / Math.max(rect.width, 1) },
      { zone: 'right', value: (rect.width - x) / Math.max(rect.width, 1) },
      { zone: 'top', value: y / Math.max(rect.height, 1) },
      { zone: 'bottom', value: (rect.height - y) / Math.max(rect.height, 1) },
    ];

    distances.sort((a, b) => a.value - b.value);
    return distances[0];
  }

  function getPanelRelativePoint(panelEl, event) {
    const rect = panelEl.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1))),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(rect.height, 1))),
    };
  }

  function getBiasedCenterDrop(panelEl, event, parentDirection) {
    const point = getPanelRelativePoint(panelEl, event);
    const sideBias = 0.36;

    if (parentDirection === 'column') {
      if (point.x <= sideBias || point.x >= 1 - sideBias) {
        return {
          mode: 'panel',
          panelEl,
          targetPanelId: panelEl.id,
          zone: point.x < 0.5 ? 'left' : 'right',
        };
      }
    } else if (point.y <= sideBias || point.y >= 1 - sideBias) {
      return {
        mode: 'panel',
        panelEl,
        targetPanelId: panelEl.id,
        zone: point.y < 0.5 ? 'top' : 'bottom',
      };
    }

    return null;
  }

  function getGroupDropTarget(panelEl, event) {
    const parentSplitEl = panelEl.parentElement && panelEl.parentElement.closest('.dashboard-layout-split');
    if (!parentSplitEl) return null;

    const grandSplitEl = parentSplitEl.parentElement && parentSplitEl.parentElement.closest('.dashboard-layout-split');
    const scopeEl = grandSplitEl ? parentSplitEl : panelEl;
    const parentDirection = grandSplitEl
      ? grandSplitEl.dataset.layoutDirection
      : parentSplitEl.dataset.layoutDirection;
    const scopeRect = scopeEl.getBoundingClientRect();
    const pointer = parentDirection === 'row' ? event.clientX : event.clientY;
    const midpoint = parentDirection === 'row'
      ? scopeRect.left + scopeRect.width / 2
      : scopeRect.top + scopeRect.height / 2;

    const biasedDrop = getBiasedCenterDrop(panelEl, event, parentDirection);
    if (biasedDrop) return biasedDrop;

    return {
      mode: 'group',
      targetPanelId: panelEl.id,
      parentDirection,
      promoteGroup: Boolean(grandSplitEl),
      position: pointer < midpoint ? 'before' : 'after',
      scopeEl,
    };
  }

  function getSplitIndexDropTarget(handleEl) {
    const config = getDashboardConfig(dragging.dashboardId);
    const root = config && document.getElementById(config.rootId);
    if (!root || !root.contains(handleEl)) return null;

    const splitEl = handleEl.parentElement && handleEl.parentElement.closest('.dashboard-layout-split');
    if (!splitEl) return null;

    const children = Array.from(splitEl.children)
      .filter(child => !child.classList.contains('dashboard-layout-resizer'));
    const nextEl = handleEl.nextElementSibling;
    const insertIndex = children.indexOf(nextEl);
    if (insertIndex < 0) return null;

    return {
      mode: 'split-index',
      parentPath: parsePath(splitEl.dataset.layoutPath),
      parentDirection: splitEl.dataset.layoutDirection || 'column',
      insertIndex,
      splitEl,
      handleEl,
    };
  }

  function getDropTarget(event) {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!target || !dragging) return null;

    const handleEl = target.closest('.dashboard-layout-resizer');
    if (handleEl) {
      return getSplitIndexDropTarget(handleEl);
    }

    const panelEl = target.closest('.panel[data-dashboard-dnd]');
    if (!panelEl || panelEl.dataset.dashboardDnd !== dragging.dashboardId) return null;
    if (panelEl.id === dragging.panelId) return null;

    const edgeInfo = getEdgeInfo(panelEl, event);
    const edgeThreshold = 0.24;
    if (edgeInfo.value > edgeThreshold) {
      return getGroupDropTarget(panelEl, event);
    }

    return {
      mode: 'panel',
      panelEl,
      targetPanelId: panelEl.id,
      zone: edgeInfo.zone,
    };
  }

  function getPanelPlaceholderRect(panelEl, zone) {
    const rect = panelEl.getBoundingClientRect();
    const nextRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    if (zone === 'left' || zone === 'right') {
      nextRect.width = rect.width / 2;
      if (zone === 'right') nextRect.left = rect.left + rect.width / 2;
    } else {
      nextRect.height = rect.height / 2;
      if (zone === 'bottom') nextRect.top = rect.top + rect.height / 2;
    }

    return nextRect;
  }

  function getGroupPlaceholderRect(dropTarget) {
    const scopeRect = dropTarget.scopeEl.getBoundingClientRect();
    const parentSplitEl = dropTarget.scopeEl.parentElement
      ? dropTarget.scopeEl.parentElement.closest('.dashboard-layout-split')
      : null;
    const parentRect = parentSplitEl ? parentSplitEl.getBoundingClientRect() : scopeRect;
    const rect = {
      left: scopeRect.left,
      top: scopeRect.top,
      width: scopeRect.width,
      height: scopeRect.height,
    };

    if (dropTarget.parentDirection === 'row') {
      rect.top = parentRect.top;
      rect.height = parentRect.height;
      rect.width = Math.max(120, scopeRect.width / 2);
      if (dropTarget.position === 'after') {
        rect.left = scopeRect.right - rect.width;
      }
    } else {
      rect.left = parentRect.left;
      rect.width = parentRect.width;
      rect.height = Math.max(72, scopeRect.height / 2);
      if (dropTarget.position === 'after') {
        rect.top = scopeRect.bottom - rect.height;
      }
    }

    return rect;
  }

  function getSplitIndexPlaceholderRect(dropTarget) {
    const splitRect = dropTarget.splitEl.getBoundingClientRect();
    const handleRect = dropTarget.handleEl.getBoundingClientRect();

    if (dropTarget.parentDirection === 'row') {
      const width = Math.max(120, splitRect.width * 0.18);
      return {
        left: handleRect.left + handleRect.width / 2 - width / 2,
        top: splitRect.top,
        width,
        height: splitRect.height,
      };
    }

    const height = Math.max(72, splitRect.height * 0.18);
    return {
      left: splitRect.left,
      top: handleRect.top + handleRect.height / 2 - height / 2,
      width: splitRect.width,
      height,
    };
  }

  function movePlaceholder(dropTarget) {
    const rect = dropTarget.mode === 'split-index'
      ? getSplitIndexPlaceholderRect(dropTarget)
      : (dropTarget.mode === 'group'
        ? getGroupPlaceholderRect(dropTarget)
        : getPanelPlaceholderRect(dropTarget.panelEl, dropTarget.zone));
    placeholder.style.left = `${rect.left}px`;
    placeholder.style.top = `${rect.top}px`;
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;

    if (!placeholder.parentElement) {
      document.body.appendChild(placeholder);
    }
  }

  function clearPlaceholder() {
    placeholder.remove();
    pendingDrop = null;
  }

  function scheduleRender(config) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => config.render(), 40);
  }

  function clearDragState() {
    document.body.classList.remove('is-panel-dragging');
    document.querySelectorAll('.panel.drag-source').forEach(panelEl => panelEl.classList.remove('drag-source'));
    clearPlaceholder();
    dragging = null;
  }

  function handleDragOver(event) {
    if (!dragging) return;

    const dropTarget = getDropTarget(event);
    if (!dropTarget) {
      clearPlaceholder();
      return;
    }

    event.preventDefault();
    const config = getDashboardConfig(dragging.dashboardId);
    if (!config) return;

    movePlaceholder(dropTarget);
    pendingDrop = {
      config,
      dropTarget,
    };

    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event) {
    if (!dragging || !pendingDrop) return;
    event.preventDefault();

    const { config, dropTarget } = pendingDrop;
    const nextTree = computeDropTree(config, dragging.panelId, dropTarget);
    renderTree(config, nextTree);
    clearDragState();
    scheduleRender(config);
  }

  function setupHeaderDrag(config, panelId) {
    const panelEl = findPanelElement(panelId);
    if (!panelEl) return;

    panelEl.dataset.dashboardDnd = config.id;
    const header = panelEl.querySelector('h2');
    if (!header) return;

    header.classList.add('panel-drag-handle');
    header.setAttribute('draggable', 'true');
    header.setAttribute('title', 'Keo de doi vi tri chart');

    header.addEventListener('dragstart', event => {
      dragging = {
        dashboardId: config.id,
        panelId,
      };
      panelEl.classList.add('drag-source');
      document.body.classList.add('is-panel-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', panelId);
      }
    });

    header.addEventListener('dragend', clearDragState);
  }

  function setupDashboard(config) {
    const root = document.getElementById(config.rootId);
    if (!root) return;

    renderTree(config, config.initialTree);
    config.panelIds.forEach(panelId => setupHeaderDrag(config, panelId));

    root.addEventListener('dragover', handleDragOver);
    root.addEventListener('drop', handleDrop);
    root.addEventListener('dragleave', event => {
      if (!root.contains(event.relatedTarget)) clearPlaceholder();
    });
  }

  dashboards.forEach(setupDashboard);
}
