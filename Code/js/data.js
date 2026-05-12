/**
 * data.js — Tải dữ liệu CSV và tạo các lookup Map
 */

const fmt = d3.format(',');

function loadData() {
  return Promise.all([
    d3.csv('/fixed_data/fixed_listings.csv'),
    d3.csv('/fixed_data/fixed_reviews_sentiment.csv'),
    d3.csv('/listings.csv', d => ({ host_id: d.host_id, host_name: d.host_name }))
  ]).then(([listings, reviews, rawListings]) => {
    // Lưu dữ liệu gốc
    window.allListings = listings;
    window.allReviews = reviews;

    // Map host_id → host_name
    window.hostNameMap = new Map();
    rawListings.forEach(d => {
      if (d.host_name) window.hostNameMap.set(d.host_id, d.host_name);
    });

    // Map listing_id → borough / neighbourhood (O(1) lookup)
    window.listingBoroughMap = new Map();
    window.listingNeighbourhoodMap = new Map();
    listings.forEach(d => {
      window.listingBoroughMap.set(d.id, d.neighbourhood_group_cleansed);
      window.listingNeighbourhoodMap.set(d.id, d.neighbourhood_cleansed);
    });
  });
}
