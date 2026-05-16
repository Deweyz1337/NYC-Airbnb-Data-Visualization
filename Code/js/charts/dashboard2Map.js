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

  function getMapLabelText(neighbourhood, isSelected) {
    return neighbourhood || '';
  }

  function estimateLabelBox(d, labelText, fontSize) {
    const [x, y] = d.labelPoint;
    const width = Math.max(24, labelText.length * fontSize * 0.62);
    const height = fontSize * 1.35;
    const padding = 4;

    return {
      left: x - width / 2 - padding,
      right: x + width / 2 + padding,
      top: y - height / 2 - padding,
      bottom: y + height / 2 + padding,
    };
  }

  function boxesOverlap(a, b) {
    return a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top;
  }

  function boxFits(box, width, height) {
    return box.left >= 0 &&
      box.right <= width &&
      box.top >= 0 &&
      box.bottom <= height;
  }

  function pickVisibleMapLabels(candidates, width, height, selectedNeighborhood) {
    const placedBoxes = [];
    const visibleLabels = [];

    candidates.forEach(d => {
      const isSelected = d.neighbourhood === selectedNeighborhood;
      const fontSize = isSelected ? 12 : (width < 520 || height < 260 ? 9 : 10);
      const labelText = getMapLabelText(d.neighbourhood, isSelected);
      const box = estimateLabelBox(d, labelText, fontSize);

      if (!isSelected && (!boxFits(box, width, height) || placedBoxes.some(existing => boxesOverlap(box, existing)))) {
        return;
      }

      placedBoxes.push(box);
      visibleLabels.push({ ...d, labelText, fontSize });
    });

    return visibleLabels;
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
        `Doanh thu ước tính: ${D2.formatRevenueValue(d.totalRevenue)}`,
        `Số phòng (listing): ${D2.fmtInt(d.listingCount)}`,
      ].join('\n'));

    const selectedNeighborhood = D2.getActiveSelection() &&
      D2.getActiveSelection().type === 'neighbourhood'
      ? D2.getActiveSelection().value
      : null;
    const labelCandidates = data
      .map(d => ({
        ...d,
        labelArea: path.area(d.feature),
        labelPoint: path.centroid(d.feature),
      }))
      .filter(d => (
        d.neighbourhood === selectedNeighborhood ||
        d.totalRevenue > 0
      ))
      .sort((a, b) =>
        (a.neighbourhood === selectedNeighborhood ? -1 : 0) ||
        (b.neighbourhood === selectedNeighborhood ? 1 : 0) ||
        d3.descending(a.totalRevenue, b.totalRevenue)
      );
    const labelData = pickVisibleMapLabels(labelCandidates, W, H, selectedNeighborhood);

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
      .style('font-size', d => `${d.fontSize}px`)
      .text(d => d.labelText);

    if (legend) {
      legend.innerHTML = buildRevenueLegendHtml(scaleMin, scaleMax, revenueScale);
    }
  };
})();
