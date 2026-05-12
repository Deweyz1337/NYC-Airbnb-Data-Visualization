/**
 * dashboard2Map.js - Brooklyn revenue choropleth for Dashboard 2.
 */

(function () {
  const D2 = window.Dashboard2 = window.Dashboard2 || {};

  function buildRevenueLegendHtml(domainMin, domainMax, colorScale) {
    const safeMin = Math.max(1, domainMin || 1);
    const safeMax = Math.max(safeMin, domainMax || safeMin);
    const logMin = Math.log(safeMin);
    const logMax = Math.log(safeMax);
    const steps = d3.range(0, 1.0001, 0.25);
    const colors = steps.map(step => {
      const value = Math.exp(logMin + (logMax - logMin) * step);
      return colorScale(value);
    });
    const gradient = `linear-gradient(to top, ${colors
      .map((color, index) => `${color} ${(steps[index] * 100).toFixed(0)}%`)
      .join(', ')})`;
    const tickSteps = safeMax === safeMin ? [0, 1] : [0, 0.33, 0.66, 1];
    const ticks = tickSteps.map(step => Math.exp(logMin + (logMax - logMin) * step));

    const tickHtml = ticks.map(value => {
      const ratio = logMax === logMin ? 0 : ((Math.log(value) - logMin) / (logMax - logMin)) * 100;
      return `
        <div class="brooklyn-revenue-legend-tick" style="top:${(100 - ratio).toFixed(2)}%">
          ${D2.formatRevenueValue(value)}
        </div>
      `;
    }).join('');

    return `
      <div class="brooklyn-revenue-legend-title">Doanh thu</div>
      <div class="brooklyn-revenue-legend-body">
        <div class="brooklyn-revenue-legend-bar" style="background:${gradient}"></div>
        <div class="brooklyn-revenue-legend-labels">${tickHtml}</div>
      </div>
    `;
  }

  D2.drawBrooklynRevenueChoropleth = function drawBrooklynRevenueChoropleth(data, geojson, colorDomainData = data) {
    const container = document.getElementById('brooklynRevenueMap');
    const legend = document.getElementById('brooklynRevenueLegend');
    if (!container) return;

    container.innerHTML = '';
    if (legend) legend.innerHTML = '';

    if (!data.length || !geojson || !Array.isArray(geojson.features)) {
      container.innerHTML = '<div class="page2-empty">No Brooklyn data</div>';
      return;
    }

    const W = Math.max(container.clientWidth || 720, 320);
    const H = Math.max(container.clientHeight || 260, 200);
    const collection = {
      type: 'FeatureCollection',
      features: data.map(d => d.feature),
    };

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%');

    const projection = d3.geoMercator().fitSize([W, H], collection);
    const path = d3.geoPath(projection);

    const revenueValues = data
      .map(d => d.totalRevenue || 0)
      .filter(value => value > 0);
    const domainSource = revenueValues.length > 1 ? data : colorDomainData;
    const domainValues = domainSource
      .map(d => d.totalRevenue || 0)
      .filter(value => value > 0);
    const maxRevenue = d3.max(domainValues) || d3.max(revenueValues) || 0;
    const minPositiveRevenue = d3.min(domainValues) || d3.min(revenueValues) || 1;
    const scaleMin = Math.max(1, minPositiveRevenue);
    const scaleMax = Math.max(scaleMin * 1.001, maxRevenue || scaleMin);
    const revenueScale = d3.scaleSequentialLog(d3.interpolateBlues)
      .domain([scaleMin, scaleMax]);

    svg.append('g')
      .selectAll('.brooklyn-neighborhood')
      .data(data)
      .join('path')
      .attr('class', d => [
        'brooklyn-neighborhood',
        D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 'is-selected' : '',
        D2.hasActiveSelection('neighbourhood') && !D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 'is-dimmed' : '',
      ].filter(Boolean).join(' '))
      .attr('d', d => path(d.feature))
      .attr('fill', d => (d.totalRevenue > 0 ? revenueScale(d.totalRevenue) : '#edf2f7'))
      .attr('stroke', d => (D2.isActiveSelection('neighbourhood', d.neighbourhood) ? '#1f3b68' : '#000000'))
      .attr('stroke-width', d => (D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 2.2 : 0.9))
      .attr('vector-effect', 'non-scaling-stroke')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        D2.toggleSelection('neighbourhood', d.neighbourhood);
      })
      .on('mouseenter', function () {
        d3.select(this)
          .attr('stroke', '#264b7f')
          .attr('stroke-width', 1.4);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .attr('stroke', D2.isActiveSelection('neighbourhood', d.neighbourhood) ? '#1f3b68' : '#000000')
          .attr('stroke-width', D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 2.2 : 0.9);
      })
      .append('title')
      .text(d => [
        d.neighbourhood,
        `Doanh thu: ${D2.formatRevenueValue(d.totalRevenue)}`,
        `Booked days: ${D2.fmtInt(d.totalBookedDays)}`,
        `Listings: ${D2.fmtInt(d.listingCount)}`,
      ].join('\n'));

    const selectedNeighborhood = D2.getActiveSelection() &&
      D2.getActiveSelection().type === 'neighbourhood'
      ? D2.getActiveSelection().value
      : null;
    const labelData = data
      .map(d => ({
        ...d,
        labelArea: path.area(d.feature),
        labelPoint: path.centroid(d.feature),
      }))
      .filter(d => (
        d.neighbourhood === selectedNeighborhood ||
        (d.totalRevenue > 0 && d.labelArea >= 170)
      ))
      .sort((a, b) =>
        (a.neighbourhood === selectedNeighborhood ? -1 : 0) ||
        (b.neighbourhood === selectedNeighborhood ? 1 : 0) ||
        d3.descending(a.totalRevenue, b.totalRevenue)
      )
      .slice(0, selectedNeighborhood ? 1 : 14);

    svg.append('g')
      .attr('class', 'brooklyn-map-labels')
      .selectAll('.brooklyn-map-label')
      .data(labelData)
      .join('text')
      .attr('class', d => [
        'brooklyn-map-label',
        D2.isActiveSelection('neighbourhood', d.neighbourhood) ? 'is-selected' : '',
      ].filter(Boolean).join(' '))
      .attr('x', d => d.labelPoint[0])
      .attr('y', d => d.labelPoint[1])
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(d => d.neighbourhood);

    if (legend) {
      legend.innerHTML = buildRevenueLegendHtml(scaleMin, scaleMax, revenueScale);
    }
  };
})();
