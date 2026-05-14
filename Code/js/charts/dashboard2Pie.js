/**
 * dashboard2Pie.js - Booked-days share by price tier for Dashboard 2.
 */

(function () {
  const D2 = window.Dashboard2 = window.Dashboard2 || {};

  D2.drawRoomShareChart = function drawRoomShareChart(data) {
    const container = document.getElementById('roomShareChart');
    const legend = document.getElementById('roomShareLegend');
    if (!container || !legend) return;

    container.innerHTML = '';
    legend.innerHTML = '';

    if (!data.length) {
      container.innerHTML = '<div class="page2-empty">No data</div>';
      return;
    }

    const W = container.clientWidth || 420;
    const H = container.clientHeight || 260;
    const radius = Math.max(38, Math.min(W, H) / 2 - 28);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%');

    const g = svg.append('g').attr('transform', `translate(${W / 2},${H / 2})`);
    const pie = d3.pie()
      .sort(null)
      .value(d => d.booked);
    const arcData = pie(data);
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);
    const labelArc = d3.arc()
      .innerRadius(radius * 0.62)
      .outerRadius(radius * 0.62);

    const slice = g.selectAll('.slice')
      .data(arcData)
      .join('g')
      .attr('class', 'slice');

    slice.append('path')
      .attr('d', arc)
      .attr('fill', d => D2.PRICE_TIER_COLORS[d.data.priceTier] || D2.PRICE_TIER_COLORS.Unknown)
      .attr('stroke', d => (D2.isActiveSelection('priceTier', d.data.priceTier) ? '#1f3b68' : '#000000'))
      .attr('stroke-width', d => (D2.isActiveSelection('priceTier', d.data.priceTier) ? 2.8 : 1.6))
      .attr('stroke-linejoin', 'round')
      .attr('class', d => [
        'room-share-slice',
        D2.isActiveSelection('priceTier', d.data.priceTier) ? 'is-selected' : '',
        D2.hasActiveSelection('priceTier') && !D2.isActiveSelection('priceTier', d.data.priceTier) ? 'is-dimmed' : '',
      ].filter(Boolean).join(' '))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        D2.toggleSelection('priceTier', d.data.priceTier);
      })
      .append('title')
      .text(d => [
        d.data.priceTier,
        `Doanh thu ước tính: ${D2.formatRevenueValue(d.data.totalRevenue)}`,
        `Tổng ngày book: ${D2.fmtInt(Math.round(d.data.booked))}`,
      ].join('\n'));

    slice.append('text')
      .attr('class', 'room-share-label')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(d => (d.data.share >= 0.035 ? D2.fmtPiePct(d.data.share) : ''));

    legend.innerHTML = data.map(d => {
      const color = D2.PRICE_TIER_COLORS[d.priceTier] || D2.PRICE_TIER_COLORS.Unknown;
      return `
        <div class="room-share-row" title="${d.priceTier}&#10;Doanh thu ước tính: ${D2.formatRevenueValue(d.totalRevenue)}&#10;Tổng ngày book: ${D2.fmtInt(Math.round(d.booked))}">
          <span class="room-share-swatch" style="background:${color}"></span>
          <div class="room-share-copy">
            <div class="room-share-name">${d.priceTier}</div>
            <div class="room-share-meta">${D2.fmtInt(d.booked)} booked days - ${D2.fmtPct(d.share)}</div>
          </div>
        </div>
      `;
    }).join('');

    Array.from(legend.querySelectorAll('.room-share-row')).forEach((row, index) => {
      const priceTier = data[index].priceTier;
      row.classList.toggle('is-selected', D2.isActiveSelection('priceTier', priceTier));
      row.classList.toggle('is-dimmed', D2.hasActiveSelection('priceTier') && !D2.isActiveSelection('priceTier', priceTier));
      row.addEventListener('click', event => {
        event.stopPropagation();
        D2.toggleSelection('priceTier', priceTier);
      });
    });
  };
})();
