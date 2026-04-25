export const RESULTS_PER_PAGE = 12;
export const FETCH_BATCH      = 50;

export const state = {
  currentPage:     1,
  totalPages:      1,
  allResults:      [],
  filteredResults: [],
  continueParams:  null,
  isFetching:      false,
  currentQuery:    "",   // API query (may include intitle: etc.)
  displayQuery:    "",   // raw user-typed text for UI messages
  activeApiFilter: null,
};
