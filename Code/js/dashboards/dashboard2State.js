/**
 * dashboard2State.js - Dashboard 2 data loading, selection state, and aggregations.
 */

(function () {
  const D2 = window.Dashboard2 = window.Dashboard2 || {};

  D2.PRICE_TIER_ORDER = [
    'Budget',
    'Luxury',
    'Mid-range',
    'Premium',
  ];

  D2.PRICE_TIER_COLORS = {
    Budget: '#4472c4',
    Luxury: '#f28e2b',
    'Mid-range': '#e15759',
    Premium: '#76b7b2',
    Unknown: '#9aa5b1',
  };

  D2.fmtInt = d3.format(',');
  D2.fmtPct = d3.format('.1%');
  D2.fmtPiePct = d3.format('.0%');
  D2.fmtOne = d3.format('.1f');
  D2.fmtCurrency = d3.format('$,.0f');

  let listingsPromise = null;
  let normalizedListingsCache = null;
  let neighborhoodsGeoPromise = null;
  let normalizedNeighborhoodsGeoCache = null;
  let activeSelection = null;
  let bookingSortOrder = 'desc';

  function toNumber(value, fallback = 0) {
    const number = +value;
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeListing(d) {
    return {
      id: (d.id || '').trim(),
      neighbourhood_group_cleansed: (d.neighbourhood_group_cleansed || '').trim(),
      neighbourhood_cleansed: (d.neighbourhood_cleansed || '').trim(),
      latitude: toNumber(d.latitude, null),
      longitude: toNumber(d.longitude, null),
      room_type: (d.room_type || '').trim(),
      price_tier: (d.price_tier || '').trim(),
      price: toNumber(d.price),
      estimated_occupancy_l365d: toNumber(d.estimated_occupancy_l365d),
      estimated_revenue_l365d: toNumber(d.estimated_revenue_l365d),
    };
  }

  function normalizeNeighborhoodGeojson(geojson) {
    if (!geojson || !Array.isArray(geojson.features)) {
      return { type: 'FeatureCollection', features: [] };
    }

    return {
      type: 'FeatureCollection',
      features: geojson.features
        .filter(feature => feature && feature.geometry && feature.properties)
        .map(feature => ({
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            neighbourhood: (feature.properties.neighbourhood || '').trim(),
            neighbourhood_group: (feature.properties.neighbourhood_group || '').trim(),
          },
        })),
    };
  }

  D2.loadListings = function loadListings() {
    if (normalizedListingsCache) {
      return Promise.resolve(normalizedListingsCache);
    }

    if (Array.isArray(window.allListings) && window.allListings.length) {
      normalizedListingsCache = window.allListings.map(normalizeListing);
      return Promise.resolve(normalizedListingsCache);
    }

    if (!listingsPromise) {
      listingsPromise = d3.csv('/fixed_data/fixed_listings.csv', normalizeListing).then(data => {
        normalizedListingsCache = data;
        return data;
      });
    }

    return listingsPromise;
  };

  D2.loadNeighborhoodGeojson = function loadNeighborhoodGeojson() {
    if (normalizedNeighborhoodsGeoCache) {
      return Promise.resolve(normalizedNeighborhoodsGeoCache);
    }

    if (!neighborhoodsGeoPromise) {
      neighborhoodsGeoPromise = d3.json('/fixed_data/neighbourhoods.geojson')
        .then(normalizeNeighborhoodGeojson)
        .then(data => {
          normalizedNeighborhoodsGeoCache = data;
          return data;
        });
    }

    return neighborhoodsGeoPromise;
  };

  D2.getBrooklynListings = function getBrooklynListings(listings) {
    return listings.filter(d => d.neighbourhood_group_cleansed === 'Brooklyn');
  };

  D2.getActiveSelection = function getActiveSelection() {
    return activeSelection;
  };

  D2.isActiveSelection = function isActiveSelection(type, value) {
    return activeSelection &&
      activeSelection.type === type &&
      activeSelection.value === value;
  };

  D2.hasActiveSelection = function hasActiveSelection(type) {
    return activeSelection && activeSelection.type === type;
  };

  D2.toggleSelection = function toggleSelection(type, value) {
    activeSelection = D2.isActiveSelection(type, value) ? null : { type, value };
    if (typeof window.renderDashboard2 === 'function') window.renderDashboard2();
  };

  D2.getBookingSortOrder = function getBookingSortOrder() {
    return bookingSortOrder;
  };

  D2.toggleBookingSortOrder = function toggleBookingSortOrder() {
    bookingSortOrder = bookingSortOrder === 'desc' ? 'asc' : 'desc';
    if (typeof window.renderDashboard2 === 'function') window.renderDashboard2();
  };

  D2.applySelection = function applySelection(listings) {
    if (!activeSelection) return listings;

    if (activeSelection.type === 'neighbourhood') {
      return listings.filter(d => d.neighbourhood_cleansed === activeSelection.value);
    }

    if (activeSelection.type === 'priceTier') {
      return listings.filter(d => (d.price_tier || 'Unknown') === activeSelection.value);
    }

    return listings;
  };

  D2.getBookingChartListings = function getBookingChartListings(listings, selectedListings) {
    if (activeSelection && activeSelection.type === 'neighbourhood') {
      return listings;
    }

    return selectedListings;
  };

  D2.buildBrooklynRevenueData = function buildBrooklynRevenueData(listings) {
    const brooklynListings = D2.getBrooklynListings(listings);

    return d3.rollup(
      brooklynListings,
      values => ({
        totalRevenue: d3.sum(values, d => d.estimated_revenue_l365d || 0),
        totalBookedDays: d3.sum(values, d => d.estimated_occupancy_l365d || 0),
        listingCount: values.length,
      }),
      d => d.neighbourhood_cleansed || 'Unknown'
    );
  };

  D2.buildBrooklynRevenueMapData = function buildBrooklynRevenueMapData(listings, geojson) {
    const brooklynFeatures = (geojson && Array.isArray(geojson.features) ? geojson.features : [])
      .filter(feature => feature && feature.properties && feature.properties.neighbourhood_group === 'Brooklyn')
      .map(feature => ({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          neighbourhood: (feature.properties.neighbourhood || '').trim(),
          neighbourhood_group: (feature.properties.neighbourhood_group || '').trim(),
        },
      }));

    const revenueByNeighborhood = D2.buildBrooklynRevenueData(listings);

    return brooklynFeatures
      .map(feature => {
        const neighbourhood = feature.properties.neighbourhood || 'Unknown';
        const values = revenueByNeighborhood.get(neighbourhood) || {
          totalRevenue: 0,
          totalBookedDays: 0,
          listingCount: 0,
        };

        return {
          feature,
          neighbourhood,
          totalRevenue: values.totalRevenue || 0,
          totalBookedDays: values.totalBookedDays || 0,
          listingCount: values.listingCount || 0,
        };
      })
      .sort((a, b) =>
        d3.descending(a.totalRevenue, b.totalRevenue) ||
        d3.ascending(a.neighbourhood, b.neighbourhood)
      );
  };

  D2.buildRoomShareData = function buildRoomShareData(listings) {
    const brooklynListings = D2.getBrooklynListings(listings);
    const totalBooked = d3.sum(brooklynListings, d => d.estimated_occupancy_l365d || 0) || 1;
    const counts = d3.rollup(
      brooklynListings,
      v => d3.sum(v, d => d.estimated_occupancy_l365d || 0),
      d => d.price_tier || 'Unknown'
    );

    const order = [...D2.PRICE_TIER_ORDER];
    counts.forEach((_, key) => {
      if (!order.includes(key)) order.push(key);
    });

    return order
      .filter(priceTier => counts.has(priceTier))
      .map(priceTier => ({
        priceTier,
        booked: counts.get(priceTier) || 0,
        share: (counts.get(priceTier) || 0) / totalBooked,
      }))
      .sort((a, b) => d3.descending(a.booked, b.booked));
  };

  D2.buildNeighborhoodData = function buildNeighborhoodData(listings) {
    const brooklynListings = D2.getBrooklynListings(listings);
    const byNeighborhood = d3.rollup(
      brooklynListings,
      v => d3.mean(v, d => d.estimated_occupancy_l365d || 0),
      d => d.neighbourhood_cleansed || 'Unknown'
    );

    const direction = bookingSortOrder === 'desc' ? d3.descending : d3.ascending;

    return Array.from(byNeighborhood, ([neighbourhood, avgDays]) => ({
      neighbourhood,
      avgDays: +avgDays || 0,
    })).sort((a, b) =>
      direction(a.avgDays, b.avgDays) || d3.ascending(a.neighbourhood, b.neighbourhood)
    );
  };

  D2.buildKpiData = function buildKpiData(listings) {
    const brooklynListings = D2.getBrooklynListings(listings);
    const neighborhoods = new Set(
      brooklynListings
        .map(d => d.neighbourhood_cleansed)
        .filter(Boolean)
    );

    return {
      totalRevenue: d3.sum(brooklynListings, d => d.estimated_revenue_l365d || 0),
      areaCount: neighborhoods.size,
      totalBookedDays: d3.sum(brooklynListings, d => d.estimated_occupancy_l365d || 0),
    };
  };

  D2.formatRevenueValue = function formatRevenueValue(value) {
    return D2.fmtCurrency(Math.round(value || 0));
  };
})();
