const fmt = d3.format(',');

    Promise.all([
      d3.csv('/fixed_data/fixed_listings.csv'),
      d3.csv('/fixed_data/fixed_reviews_sentiment.csv'),
      d3.csv('/listings.csv', d => ({ host_id: d.host_id, host_name: d.host_name }))
    ]).then(([listings, reviews, rawListings]) => {
      document.getElementById('loader').style.display = 'none';
      document.getElementById('dashboard').style.display = 'flex';

      // Store raw data globally
      window.allListings = listings;
      window.allReviews = reviews;
      window.hostNameMap = new Map();
      rawListings.forEach(d => { if (d.host_name) window.hostNameMap.set(d.host_id, d.host_name); });
      
      // O(1) Map for fast borough lookups (Fixes N+1 issue)
      window.listingBoroughMap = new Map();
      window.listingHostMap = new Map();
      listings.forEach(d => {
        window.listingBoroughMap.set(d.id, d.neighbourhood_group_cleansed);
        window.listingHostMap.set(d.id, d.host_id);
      });
      
      window.currentBorough = null; 
      window.currentSentiment = null; 
      window.currentHost = null;
      window.currentYear = null;
      window.barSortOrder = 'desc';

      window.updateDashboard = () => {
        const getFiltered = (exclude = []) => {
          return window.allReviews.filter(r => {
            if (!exclude.includes('borough') && window.currentBorough && window.listingBoroughMap.get(r.listing_id) !== window.currentBorough) return false;
            if (!exclude.includes('sentiment') && window.currentSentiment && r.sentiment !== window.currentSentiment) return false;
            if (!exclude.includes('host') && window.currentHost && window.listingHostMap.get(r.listing_id) !== window.currentHost) return false;
            if (!exclude.includes('year') && window.currentYear && r.date.split('-')[0] !== String(window.currentYear)) return false;
            return true;
          });
        };

        const fullyFiltered = getFiltered([]);
        document.getElementById('totalNumber').textContent = fmt(fullyFiltered.length);

        // 1. Line Chart (exclude year so other years are visible)
        const lineReviews = getFiltered(['year']);
        const reviewsByYear = d3.rollup(lineReviews, v => v.length, d => d.date.split('-')[0]);
        const yearData = [];
        for (let y = 2009; y <= 2025; y++) {
          yearData.push({ year: y, count: reviewsByYear.get(String(y)) || 0 });
        }
        drawLineChart(yearData);

        // 2. Sentiment Table (exclude borough & sentiment)
        const sentReviews = getFiltered(['borough', 'sentiment']);
        const boroughs = ['Brooklyn', 'Manhattan', 'Queens', 'Bronx', 'Staten Island'];
        const sentMap = {};
        boroughs.forEach(b => { sentMap[b] = { positive: 0, neutral: 0, negative: 0 }; });
        
        sentReviews.forEach(r => {
          const b = window.listingBoroughMap.get(r.listing_id);
          if (b && sentMap[b]) {
            sentMap[b][r.sentiment]++;
          }
        });
        drawSentimentTable(sentMap, boroughs);

        // 3. Bar Chart (exclude host so other hosts are visible)
        const barReviews = getFiltered(['host']);
        const hostReviews = d3.rollup(barReviews, v => v.length, r => window.listingHostMap.get(r.listing_id));
        window.allHostData = Array.from(hostReviews, ([id, count]) => ({
          host_id: id,
          host_name: window.hostNameMap.get(id) || id,
          count
        }));
        
        const sorted = [...window.allHostData].sort((a, b) => 
          window.barSortOrder === 'desc' ? b.count - a.count : a.count - b.count
        );
        
        // Show top 100 for scrolling
        const displayData = sorted;
        document.querySelector('#barPanel h2').textContent = 
          (window.currentBorough ? `[${window.currentBorough}] ` : '') +
          (window.barSortOrder === 'desc' ? 'Host được review nhiều nhất' : 'Host được review ít nhất');
          
        const sortToggleEl = document.getElementById('sortToggle');
        if (sortToggleEl) {
          sortToggleEl.textContent = `Sort ${window.barSortOrder === 'desc' ? '▼' : '▲'}`;
        }
          
        drawBarChart(displayData);
      };

      window.triggerUpdate = () => {
        const overlay = document.getElementById('overlayLoader');
        if (overlay) overlay.style.display = 'flex';
        
        // Yield to browser to paint the spinner
        setTimeout(() => {
          window.updateDashboard();
          if (overlay) overlay.style.display = 'none';
        }, 50);
      };

      window.toggleBorough = (b) => {
        window.currentBorough = (window.currentBorough === b) ? null : b;
        window.triggerUpdate();
      };

      window.toggleSentiment = (s) => {
        window.currentSentiment = (window.currentSentiment === s) ? null : s;
        window.triggerUpdate();
      };

      window.toggleHost = (h) => {
        window.currentHost = (window.currentHost === h) ? null : h;
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
      
      const sortToggleEl = document.getElementById('sortToggle');
      if (sortToggleEl) {
        sortToggleEl.addEventListener('click', window.toggleBarSort);
      }

      requestAnimationFrame(() => window.updateDashboard());
    });

    // ===== LINE CHART =====
    function drawLineChart(data) {
      const el = document.getElementById('lineChart');
      el.innerHTML = ''; // Clear for update
      const W = el.clientWidth || 700, H = el.clientHeight || 300;
      const m = { top: 30, right: 30, bottom: 50, left: 55 };
      const w = W - m.left - m.right, h = H - m.top - m.bottom;

      const svg = d3.select('#lineChart').append('svg').attr('width', W).attr('height', H);
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
        .on('click', (e, d) => window.toggleYear(d.year));
    }

    // ===== BAR CHART =====
    function drawBarChart(data) {
      const el = document.getElementById('barChart');
      const axisEl = document.getElementById('barXAxis');
      el.innerHTML = ''; 
      if (axisEl) axisEl.innerHTML = '';

      const W = el.clientWidth || 450;
      const containerH = el.clientHeight || 500;
      const m = { top: 25, right: 60, bottom: 5, left: 120 };
      const H = Math.max(containerH, data.length * 30 + m.top + m.bottom); 
      const w = W - m.left - m.right, h = H - m.top - m.bottom;

      const svg = d3.select('#barChart').append('svg').attr('width', W).attr('height', H);
      const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

      const y = d3.scaleBand().domain(data.map(d => d.host_id)).range([0, h]).padding(0.3);
      const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count) * 1.1]).range([0, w]);

      // X axis (Sticky at bottom if container exists)
      if (axisEl) {
        const axisSvg = d3.select('#barXAxis').append('svg').attr('width', W).attr('height', 35);
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
        .attr('x', 0).attr('y', d => y(d.host_id))
        .attr('width', d => x(d.count)).attr('height', y.bandwidth())
        .attr('fill', '#4472c4')
        .attr('class', d => {
          const isActive = !window.currentHost || window.currentHost === d.host_id;
          return `bar clickable ${isActive ? '' : 'dimmed'}`;
        })
        .on('click', (e, d) => window.toggleHost(d.host_id));

      // Host name labels (left)
      g.selectAll('.hlbl').data(data).join('text')
        .attr('x', -6).attr('y', d => y(d.host_id) + y.bandwidth() / 2)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
        .attr('fill', '#333').attr('font-size', '10px')
        .text(d => d.host_name)
        .attr('class', d => {
          const isActive = !window.currentHost || window.currentHost === d.host_id;
          return `hlbl clickable ${isActive ? '' : 'dimmed'}`;
        })
        .on('click', (e, d) => window.toggleHost(d.host_id));

      // Value labels (right of bar)
      g.selectAll('.vlbl').data(data).join('text')
        .attr('x', d => x(d.count) + 4)
        .attr('y', d => y(d.host_id) + y.bandwidth() / 2)
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#333').attr('font-size', '10px').attr('font-weight', 500)
        .text(d => fmt(d.count))
        .attr('class', d => {
          const isActive = !window.currentHost || window.currentHost === d.host_id;
          return `vlbl ${isActive ? '' : 'dimmed'}`;
        });
    }

    // ===== SENTIMENT TABLE =====
    function drawSentimentTable(sentMap, boroughs) {
      const sentiments = ['positive', 'neutral', 'negative'];

      // Collect all values to build a global scale
      const allVals = [];
      sentiments.forEach(s => boroughs.forEach(b => allVals.push(sentMap[b][s])));
      const maxVal = d3.max(allVals);
      const minVal = d3.min(allVals);

      // Green gradient scale: low value = light, high value = dark green
      const colorScale = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range(['rgba(200,230,215,0.3)', 'rgba(70,150,110,0.65)']);

      let html = '<table class="sent-table">';
      html += '<tr><th>Sentiment</th>';
      boroughs.forEach(b => {
        const isActive = window.currentBorough === b;
        const isDimmed = window.currentBorough && !isActive;
        const activeClass = isActive ? 'active' : (isDimmed ? 'filter-dimmed' : '');
        html += `<th class="clickable-header ${activeClass}" onclick="window.toggleBorough('${b}')">${b}</th>`;
      });
      html += '</tr>';

      sentiments.forEach(sent => {
        html += '<tr>';
        const isSentActive = window.currentSentiment === sent;
        const isSentDimmed = window.currentSentiment && !isSentActive;
        const sentClass = isSentActive ? 'active' : (isSentDimmed ? 'filter-dimmed' : '');
        html += `<td class="clickable-header ${sentClass}" onclick="window.toggleSentiment('${sent}')" style="font-weight:bold">${sent}</td>`;
        
        boroughs.forEach(b => {
          const val = sentMap[b][sent];
          const bg = colorScale(val);
          
          const isBoroughActive = !window.currentBorough || window.currentBorough === b;
          const isSentimentActive = !window.currentSentiment || window.currentSentiment === sent;
          const isActiveCell = isBoroughActive && isSentimentActive;
          const cellClass = isActiveCell ? '' : 'filter-dimmed';

          html += `<td class="${cellClass}" style="background:${bg}">${fmt(val)}</td>`;
        });
        html += '</tr>';
      });
      html += '</table>';

      document.getElementById('sentTable').innerHTML = html;
    }