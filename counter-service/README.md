# Volley Academy daily counter

Anonymous daily visitor counter for the public Cloud.ru trainer. A browser gets a new random ID each Moscow day. The server grants a signed day/origin-scoped token and stores one empty R2 object under a keyed hash; repeated and concurrent registrations of the same browser/day overwrite that object. Names, email addresses, IP addresses and raw visitor IDs are not stored by the application.

Only aggregate daily counts are public. Registration accepts the configured Cloud.ru Origin, a valid UUID and a signed current-day token. This is a lightweight visitor counter, not a fraud-proof measure of unique humans: different browsers and cleared storage can count separately. The client uses first-party localStorage for its daily ID, falling back to sessionStorage or in-memory state if storage is unavailable.

Runtime: Sites Worker ESM; BUCKET is the private R2 binding. ALLOWED_ORIGIN is the trainer origin. COUNTER_SIGNING_KEY is a server-only Sites secret. No analytics-service API or credential is exposed to the frontend.

GET /v1/today returns {day,count,timeZone}. POST /v1/token issues a visitor capability. POST /v1/visit records it idempotently. GET /health is a service check.

Build: node scripts/build.mjs. Tests: node --test tests/counter.test.mjs.
