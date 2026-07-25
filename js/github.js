/**
 * GitHub API Module
 * Fetches profile and repo data with localStorage caching.
 * Unauthenticated rate limit: 60 requests/hour per IP.
 * Cache TTL: 10 minutes to stay well within limits.
 */

const GitHubAPI = (function () {
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  const API_BASE = 'https://api.github.com';

  const GITHUB_USERNAME = window.GH_USERNAME || 'pshickeydev';

  function getCache(key) {
    try {
      const raw = localStorage.getItem('gh_cache_' + key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > CACHE_TTL) {
        return null;
      }
      return data.value;
    } catch (e) {
      return null;
    }
  }

  function setCache(key, value) {
    try {
      localStorage.setItem('gh_cache_' + key, JSON.stringify({
        timestamp: Date.now(),
        value: value
      }));
    } catch (e) {
      // localStorage might be full or unavailable
    }
  }

  async function fetchJSON(url) {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }

    if (response.status === 404) {
      throw new Error('Not found.');
    }

    if (!response.ok) {
      throw new Error('GitHub API error: ' + response.status);
    }

    return response.json();
  }

  async function getUser() {
    const cacheKey = 'user_' + GITHUB_USERNAME;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const data = await fetchJSON(API_BASE + '/users/' + GITHUB_USERNAME);
    setCache(cacheKey, data);
    return data;
  }

  async function getRepos() {
    const cacheKey = 'repos_' + GITHUB_USERNAME;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    // Fetch up to 100 repos, sorted by last updated
    const data = await fetchJSON(
      API_BASE + '/users/' + GITHUB_USERNAME + '/repos?per_page=100&sort=updated&direction=desc'
    );
    setCache(cacheKey, data);
    return data;
  }

  async function getEvents() {
    const cacheKey = 'events_' + GITHUB_USERNAME;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const data = await fetchJSON(
      API_BASE + '/users/' + GITHUB_USERNAME + '/events/public?per_page=30'
    );
    setCache(cacheKey, data);
    return data;
  }

  async function getRateLimit() {
    try {
      const data = await fetchJSON(API_BASE + '/rate_limit');
      return data.rate;
    } catch (e) {
      return null;
    }
  }

  return {
    username: GITHUB_USERNAME,
    getUser: getUser,
    getRepos: getRepos,
    getEvents: getEvents,
    getRateLimit: getRateLimit
  };
})();
