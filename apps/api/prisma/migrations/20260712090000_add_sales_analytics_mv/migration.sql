-- Database Design §4.6: analytics is materialized views, not application-maintained
-- rollup tables — always derivable from `orders`, never a second write path that can
-- drift from the source of truth. Refreshed on a schedule by the Worker's
-- `report-rollup` job (Architecture §13), not on every order write.
--
-- CANCELLED/REJECTED orders are excluded — they never represent realized revenue.
-- "New customer" = a user's earliest non-cancelled/rejected order for this business
-- landed on that day (row_number() = 1 per business+user).
CREATE MATERIALIZED VIEW business_sales_daily_mv AS
WITH ranked_orders AS (
  SELECT
    o.business_id,
    o.placed_at::date AS sale_date,
    o.user_id,
    o.total_paise,
    ROW_NUMBER() OVER (PARTITION BY o.business_id, o.user_id ORDER BY o.placed_at) AS user_order_rank
  FROM orders o
  WHERE o.status NOT IN ('CANCELLED', 'REJECTED')
)
SELECT
  business_id,
  sale_date,
  COUNT(*)::int AS order_count,
  SUM(total_paise)::bigint AS revenue_paise,
  COUNT(*) FILTER (WHERE user_order_rank = 1)::int AS new_customer_count
FROM ranked_orders
GROUP BY business_id, sale_date;

-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY (Worker's report-rollup job) —
-- without a unique index, a concurrent refresh isn't possible and every refresh would
-- lock the view against reads for its full duration.
CREATE UNIQUE INDEX idx_business_sales_daily_mv_business_date ON business_sales_daily_mv (business_id, sale_date);
