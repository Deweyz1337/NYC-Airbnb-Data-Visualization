/**
 * sentimentTable.js — Vẽ bảng sentiment (Sentiment Heatmap Table)
 */

function drawSentimentTable(sentMap, boroughs) {
  const sentiments = ['positive', 'neutral', 'negative'];
  const fmtPct = d3.format('.1%');
  const boroughTotals = {};

  // Thu thập tất cả giá trị để xây dựng thang màu
  const allVals = [];
  boroughs.forEach(b => {
    boroughTotals[b] = d3.sum(sentiments, s => sentMap[b][s] || 0);
    sentiments.forEach(s => allVals.push(sentMap[b][s]));
  });
  const maxVal = d3.max(allVals);
  const minVal = d3.min(allVals);

  // Dùng median làm điểm giữa (tránh bị outlier kéo lệch)
  const sorted = [...allVals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Gradient: nhạt → xanh dương trung bình → xanh dương đậm
  const colorScale = d3.scaleLinear()
    .domain([minVal, median, maxVal])
    .range(['rgba(200,220,245,0.25)', 'rgba(68,114,196,0.5)', '#4472c4']);

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
      const total = boroughTotals[b] || 0;
      const share = total ? val / total : 0;
      const tooltip = `${sent} - ${b};&#10;Tỉ lệ trong ${b}: ${fmtPct(share)}`;

      const isBoroughActive = !window.currentBorough || window.currentBorough === b;
      const isSentimentActive = !window.currentSentiment || window.currentSentiment === sent;
      const isActiveCell = isBoroughActive && isSentimentActive;
      const cellClass = isActiveCell ? '' : 'filter-dimmed';

      html += `<td class="${cellClass}" title="${tooltip}" style="background:${bg}">${fmt(val)}</td>`;
    });
    html += '</tr>';
  });
  html += '</table>';

  document.getElementById('sentTable').innerHTML = html;
}
