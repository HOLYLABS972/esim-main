/**
 * Google Search Console Service
 * Client-side service for fetching GSC data from our API route.
 */

const GSC_API = '/api/admin/gsc';

async function gscFetch(type, params = {}) {
  const sp = new URLSearchParams({ type, ...params });
  const res = await fetch(`${GSC_API}?${sp}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'GSC API error');
  return data;
}

/** Fetch aggregate summary with period-over-period comparison */
export function fetchGSCSummary({ startDate, endDate } = {}) {
  return gscFetch('summary', {
    startDate: startDate || defaultStart(),
    endDate: endDate || defaultEnd(),
  });
}

/** Fetch performance rows with given dimensions */
export function fetchGSCPerformance({ startDate, endDate, dimensions = 'query', rowLimit = 50 } = {}) {
  return gscFetch('performance', {
    startDate: startDate || defaultStart(),
    endDate: endDate || defaultEnd(),
    dimensions,
    rowLimit: String(rowLimit),
  });
}

/** Shortcut: top queries */
export function fetchGSCQueries(opts = {}) {
  return fetchGSCPerformance({ ...opts, dimensions: 'query', rowLimit: opts.rowLimit || 50 });
}

/** Shortcut: top pages */
export function fetchGSCPages(opts = {}) {
  return fetchGSCPerformance({ ...opts, dimensions: 'page', rowLimit: opts.rowLimit || 25 });
}

/** Shortcut: by country */
export function fetchGSCCountries(opts = {}) {
  return fetchGSCPerformance({ ...opts, dimensions: 'country', rowLimit: opts.rowLimit || 25 });
}

/** Shortcut: by device */
export function fetchGSCDevices(opts = {}) {
  return fetchGSCPerformance({ ...opts, dimensions: 'device', rowLimit: 5 });
}

/** Shortcut: daily time series */
export function fetchGSCTimeSeries(opts = {}) {
  return fetchGSCPerformance({ ...opts, dimensions: 'date', rowLimit: 500 });
}

/** Check if GSC is properly configured */
export function checkGSCStatus() {
  return gscFetch('status');
}

// 28 days ago
function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 28);
  return d.toISOString().split('T')[0];
}

// 2 days ago (GSC data delay)
function defaultEnd() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return d.toISOString().split('T')[0];
}
