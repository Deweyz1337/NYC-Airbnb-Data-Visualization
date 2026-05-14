/**
 * lineChart.js — Vẽ biểu đồ đường (Line Chart)
 */

function drawLineChart(data) {
  const el = document.getElementById('lineChart');
  el.innerHTML = '';
  const W = el.clientWidth || 700, H = el.clientHeight || 300;
  const m = { top: 30, right: 30, bottom: 50, left: 55 };
  const w = W - m.left - m.right, h = H - m.top - m.bottom;
  const tooltip = d3.select(el).append('div')
    .attr('class', 'line-chart-tooltip')
    .style('opacity', 0)
    .style('visibility', 'hidden');

  const quarterLabel = d => `Quý ${d.quarter}`;
  const tooltipHtml = d => `
    <div class="line-chart-tooltip-title">Năm ${d.year}</div>
    <div class="line-chart-tooltip-total">Tổng: ${fmt(d.count)} reviews</div>
    ${(d.quarters || []).map(q => `
      <div class="line-chart-tooltip-row">
        <span>${quarterLabel(q)}</span>
        <strong>${fmt(q.count)}</strong>
      </div>
    `).join('')}
  `;
  const moveTooltip = (event) => {
    const [mx, my] = d3.pointer(event, el);
    const node = tooltip.node();
    const tooltipW = node.offsetWidth;
    const tooltipH = node.offsetHeight;
    let left = mx + 14;
    if (left + tooltipW > W - 8) left = mx - tooltipW - 14;
    const top = Math.max(8, Math.min(H - tooltipH - 8, my - tooltipH / 2));

    tooltip
      .style('left', `${Math.max(8, left)}px`)
      .style('top', `${top}px`);
  };
  const showTooltip = (event, d) => {
    tooltip.html(tooltipHtml(d))
      .style('opacity', 1)
      .style('visibility', 'visible');
    moveTooltip(event);
  };
  const hideTooltip = () => {
    tooltip
      .style('opacity', 0)
      .style('visibility', 'hidden');
  };

  const svg = d3.select('#lineChart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'none')
    .style('width', '100%')
    .style('height', '100%');
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, w]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) * 1.25]).range([h, 0]);

  // Grid lines
  g.selectAll('.gy').data(y.ticks(5)).join('line')
    .attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', '#e0e0e0').attr('stroke-width', 1);

  // X axis
  g.append('g').attr('transform', `translate(0,${h})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(data.length))
    .call(g => g.select('.domain').attr('stroke', '#bbb'))
    .call(g => g.selectAll('.tick line').attr('stroke', '#bbb'))
    .selectAll('text').style('fill', '#666').style('font-size', '12px')
    .attr('class', d => {
      const isActive = !window.currentYear || window.currentYear === String(d);
      return `clickable ${isActive ? '' : 'dimmed'}`;
    })
    .on('click', (e, d) => window.toggleYear(d));

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).tickFormat(d => {
      if (d === 0) return '0K';
      if (d >= 1000) return d3.format('.0f')(d / 1000) + 'K';
      return d;
    }).ticks(5))
    .call(g => g.select('.domain').attr('stroke', '#bbb'))
    .call(g => g.selectAll('.tick line').attr('stroke', '#bbb'))
    .selectAll('text').style('fill', '#666').style('font-size', '12px');

  // Y label
  svg.append('text').attr('transform', 'rotate(-90)')
    .attr('x', -H / 2).attr('y', 12).attr('fill', '#666')
    .attr('font-size', '13px').attr('text-anchor', 'middle')
    .text('Số lượng review');

  // X label
  svg.append('text').attr('x', W / 2).attr('y', H - 4)
    .attr('fill', '#666').attr('font-size', '13px').attr('text-anchor', 'middle')
    .text('Năm');

  // Line
  const line = d3.line().x(d => x(d.year)).y(d => y(d.count)).curve(d3.curveMonotoneX);
  g.append('path').datum(data).attr('d', line)
    .attr('fill', 'none').attr('stroke', '#4472c4').attr('stroke-width', 2.5);

  // Dots
  g.selectAll('.dot').data(data).join('circle')
    .attr('cx', d => x(d.year)).attr('cy', d => y(d.count))
    .attr('r', 4.5).attr('fill', '#4472c4').attr('stroke', '#fff').attr('stroke-width', 1.5)
    .attr('class', d => {
      const isActive = !window.currentYear || window.currentYear === String(d.year);
      return `dot clickable ${isActive ? '' : 'dimmed'}`;
    })
    .on('mouseenter', showTooltip)
    .on('mousemove', moveTooltip)
    .on('mouseleave', hideTooltip)
    .on('click', (e, d) => window.toggleYear(d.year));

  // Data labels
  g.selectAll('.lbl').data(data).join('text')
    .attr('x', d => x(d.year)).attr('y', d => y(d.count) - 12)
    .attr('text-anchor', 'middle').attr('fill', '#333')
    .attr('font-size', '12px').attr('font-weight', 600)
    .style('paint-order', 'stroke')
    .style('stroke', '#fff')
    .style('stroke-width', '3px')
    .style('stroke-linecap', 'round')
    .style('stroke-linejoin', 'round')
    .text(d => fmt(d.count))
    .attr('class', d => {
      const isActive = !window.currentYear || window.currentYear === String(d.year);
      return `lbl clickable ${isActive ? '' : 'dimmed'}`;
    })
    .on('mouseenter', showTooltip)
    .on('mousemove', moveTooltip)
    .on('mouseleave', hideTooltip)
    .on('click', (e, d) => window.toggleYear(d.year));
}
