/**
 * data.js — Tải dữ liệu CSV và tạo các lookup Map
 */

const fmt = d3.format(',');

function loadData() {
  return Promise.all([
    d3.csv('/fixed_data/fixed_listings.csv'),
    d3.csv('/fixed_data/fixed_reviews_sentiment.csv')
  ]).then(([listings, reviews]) => {
    // Lưu dữ liệu gốc
    window.allListings = listings;
    window.allReviews = reviews;

    // Map listing_id → borough / neighbourhood (O(1) lookup)
    window.listingBoroughMap = new Map();
    window.listingNeighbourhoodMap = new Map();
    listings.forEach(d => {
      window.listingBoroughMap.set(d.id, d.neighbourhood_group_cleansed);
      window.listingNeighbourhoodMap.set(d.id, d.neighbourhood_cleansed);
    });
  });
}
