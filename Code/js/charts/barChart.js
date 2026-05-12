/**
 * barChart.js — Vẽ biểu đồ cột ngang (Horizontal Bar Chart)
 */

function drawBarChart(data) {
  const el = document.getElementById('barChart');
  const axisEl = document.getElementById('barXAxis');
  el.innerHTML = '';
  if (axisEl) axisEl.innerHTML = '';

  const W = el.clientWidth || 450;
  const containerH = el.clientHeight || 500;
  const m = { top: 25, right: 60, bottom: 5, left: 145 };

  // Tính chiều cao bar động: vừa đúng 15 bar hiện trong viewport
  const visibleBarsCount = 15;
  const dynamicBarHeight = (containerH - m.top - m.bottom) / visibleBarsCount;
  const H = Math.max(containerH, data.length * dynamicBarHeight + m.top + m.bottom);
  const w = W - m.left - m.right, h = H - m.top - m.bottom;

  const fontSizePx = Math.max(9, Math.min(14, Math.floor(dynamicBarHeight * 0.2))) + 'px';

  const svg = d3.select('#barChart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'none')
    .style('width', '100%')
    .attr('height', H);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const y = d3.scaleBand().domain(data.map(d => d.neighbourhood)).range([0, h]).padding(0.3);
  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count) * 1.1]).range([0, w]);

  // X axis (Sticky ở đáy nếu container tồn tại)
  if (axisEl) {
    const axisSvg = d3.select('#barXAxis').append('svg')
      .attr('viewBox', `0 0 ${W} 35`)
      .attr('preserveAspectRatio', 'none')
      .style('width', '100%')
      .style('height', '100%');
    const axisG = axisSvg.append('g').attr('transform', `translate(${m.left},0)`);

    axisG.append('g').attr('transform', `translate(0,1)`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => {
        if (d >= 1000) return d3.format('.0f')(d / 1000) + 'K';
        return d;
      }))
      .call(g => g.select('.domain').attr('stroke', '#bbb'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#bbb'))
      .selectAll('text').style('fill', '#666').style('font-size', '9px');

    axisSvg.append('text').attr('x', m.left + w / 2).attr('y', 30)
      .attr('fill', '#666').attr('font-size', '9px').attr('text-anchor', 'middle')
      .text('Count of Reviews ▼');
  } else {
    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => {
        if (d >= 1000) return d3.format('.0f')(d / 1000) + 'K';
        return d;
      }))
      .call(g => g.select('.domain').attr('stroke', '#bbb'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#bbb'))
      .selectAll('text').style('fill', '#666').style('font-size', '9px');

    svg.append('text').attr('x', m.left + w / 2).attr('y', H - 4)
      .attr('fill', '#666').attr('font-size', '9px').attr('text-anchor', 'middle')
      .text('Count of Reviews ▼');
  }

  // Grid
  g.selectAll('.gx').data(x.ticks(6)).join('line')
    .attr('x1', d => x(d)).attr('x2', d => x(d)).attr('y1', 0).attr('y2', h)
    .attr('stroke', '#e8e8e8');

  // Bars
  g.selectAll('.bar').data(data).join('rect')
    .attr('x', 0).attr('y', d => y(d.neighbourhood))
    .attr('width', d => x(d.count)).attr('height', y.bandwidth())
    .attr('fill', '#4472c4')
    .attr('class', d => {
      const isActive = !window.currentNeighbourhood || window.currentNeighbourhood === d.neighbourhood;
      return `bar clickable ${isActive ? '' : 'dimmed'}`;
    })
    .on('click', (e, d) => window.toggleNeighbourhood(d.neighbourhood));

  // Neighbourhood name labels (trái)
  g.selectAll('.hlbl').data(data).join('foreignObject')
    .attr('x', -m.left)
    .attr('y', d => y(d.neighbourhood))
    .attr('width', m.left - 6)
    .attr('height', y.bandwidth())
    .attr('class', d => {
      const isActive = !window.currentNeighbourhood || window.currentNeighbourhood === d.neighbourhood;
      return `hlbl clickable ${isActive ? '' : 'dimmed'}`;
    })
    .on('click', (e, d) => window.toggleNeighbourhood(d.neighbourhood))
    .html(d => `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-end;"><span style="text-align: right; font-size: ${fontSizePx}; line-height: 1.15; color: #333; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; word-break: break-word;">${d.neighbourhood}</span></div>`);

  // Value labels (phải thanh bar)
  g.selectAll('.vlbl').data(data).join('text')
    .attr('x', d => x(d.count) + 4)
    .attr('y', d => y(d.neighbourhood) + y.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#333').attr('font-size', fontSizePx).attr('font-weight', 500)
    .text(d => fmt(d.count))
    .attr('class', d => {
      const isActive = !window.currentNeighbourhood || window.currentNeighbourhood === d.neighbourhood;
      return `vlbl ${isActive ? '' : 'dimmed'}`;
    });
}
