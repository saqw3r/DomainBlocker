// Function to get query parameters from the URL
function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const regex = /([^&=]+)=([^&]*)/g;
  let match;
  while (match = regex.exec(queryString)) {
    params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
  }
  return params;
}

// Get the blocked URL from the query parameters and display it
const params = getQueryParams();
const blockedUrl = params.blockedUrl || 'unknown';
document.getElementById('blocked-url').textContent = blockedUrl;