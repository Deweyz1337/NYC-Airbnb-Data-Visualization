/**
 * dashboard2Booking.js - Average booked days by Brooklyn neighbourhood.
 */

(function () {
  const D2 = window.Dashboard2 = window.Dashboard2 || {};

  function scrollBookingChartToSelection(container, xScale, margin, totalWidth) {
    const activeSelection = D2.getActiveSelection();
    if (!activeSelection || activeSelection.type !== 'neighbourhood') return;

    const selectedX = xScale(activeSelection.value);
    if (selectedX === undefined) return;

    const selectedCenter = margin.left + selectedX + xScale.bandwidth() / 2;
    const maxScrollLeft = Math.max(0, totalWidth - container.clientWidth);
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, selectedCenter - container.clientWidth / 2));

    requestAnimationFrame(() => {
      container.scrollTo({
        left: nextScrollLeft,
        behavior: 'smooth',
      });
    });
  }

  D2.drawBrooklynBookingChart = function drawBrooklynBookingChart(data) {
    const container = document.getElementById('brooklynBookingChart');
    if (!container) return;

    container.innerHTML = '';

    if (!data.length) {
      container.innerHTML = '<div class="page2-empty">No data</div>';
      return;
    }

    const outerW = container.clientWidth || 900;
    const outerH = container.clientHeight || 340;
    const margin = { top: 18, right: 24, bottom: 120, left: 56 };
    const minBarWidth = 96;
    const W = Math.max(outerW, data.length * minBarWidth + margin.left + margin.right);
    const H = Math.max(outerH, 320);
    const w = Math.max(0, W - margin.left - margin.right);
    const h = Math.max(0, H - margin.top - margin.bottom);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'none')
      .style('width', `${W}px`)
      .style('height', `${H}px`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand()
      .domain(data.map(d => d.neighbourhood))
      .range([0, w])
      .padding(0.18);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.avgDays) || 0])
      .nice()
      .range([h, 0]);

    g.selectAll('.grid')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', w)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#e9edf5')
      .attr('stroke-width', 1);

    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', d => [
        'bar',
        'brooklyn-booking-bar',
        D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 'is-selected' : '',
        D2.hasActiveSelection('neighbourhood') && !D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 'is-dimmed' : '',
      ].filter(Boolean).join(' '))
      .attr('x', d => x(d.neighbourhood))
      .attr('y', d => y(d.avgDays))
      .attr('width', x.bandwidth())
      .attr('height', d => h - y(d.avgDays))
      .attr('rx', 4)
      .attr('fill', '#4472c4')
      .attr('stroke', d => (D2.isActiveSelection('neighbourhood', d.neighbourhood) ? '#1f3b68' : 'none'))
      .attr('stroke-width', d => (D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 2 : 0))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        D2.toggleSelection('neighbourhood', d.neighbourhood);
      })
      .append('title')
      .text(d => `${d.neighbourhood}: ${D2.fmtOne(d.avgDays)} avg booked days`);

    g.selectAll('.value')
      .data(data)
      .join('text')
      .attr('class', d => [
        'brooklyn-booking-value',
        D2.hasActiveSelection('neighbourhood') && !D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 'is-dimmed' : '',
      ].filter(Boolean).join(' '))
      .attr('x', d => (x(d.neighbourhood) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.avgDays) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#2b2b2b')
      .attr('font-size', '11px')
      .attr('font-weight', 600)
      .text(d => D2.fmtOne(d.avgDays));

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x))
      .call(g => g.select('.domain').attr('stroke', '#b9c2cf'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#b9c2cf'))
      .call(g => g.selectAll('.tick').attr('class', d => [
        'tick',
        'brooklyn-booking-tick',
        D2.hasActiveSelection('neighbourhood') && !D2.isActiveSelection('neighbourhood', d) ? 'is-dimmed' : '',
        D2.isActiveSelection('neighbourhood', d) ? 'is-selected' : '',
      ].filter(Boolean).join(' ')))
      .selectAll('text')
      .style('fill', '#666')
      .style('font-size', '10px')
      .style('font-weight', 500)
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.35em')
      .attr('dy', '0.35em');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0f')))
      .call(g => g.select('.domain').attr('stroke', '#b9c2cf'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#b9c2cf'))
      .selectAll('text')
      .style('fill', '#666')
      .style('font-size', '11px');

    svg.append('text')
      .attr('x', W / 2)
      .attr('y', H - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '11px')
      .text('Neighborhood');

    scrollBookingChartToSelection(container, x, margin, W);
  };
})();
