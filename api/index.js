// ============================================================
// Globals
// ============================================================
var ROUTE_STORE = "/v0/store";

var ERROR_MISSING_ID = "Please specify an ID to retrieve.",
    ERROR_INVALID_ENDPOINT = "Invalid endpoint",
    ERROR_INVALID_JSON = "Must specify valid JSON";

var STORE_TTL = 31556952;  // Auto-deleted after 1 year

var ALLOWED_HOSTS = {
  "genomeribbon.com": {
    store: {
      prefix: "ribbon"
    }
  }
};

var CORS_ORIGIN = "*",
    CORS_HEADERS = {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": CORS_ORIGIN,
        "Access-Control-Allow-Methods": "HEAD, GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };


// ============================================================
// Utility functions
// ============================================================
// Generate a UUID (source: https://stackoverflow.com/a/2117523)
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}


// ============================================================
// Success/error functions
// ============================================================

function error_400(message) {
  let payload = {
    success: false,
    message: message,
    error_code: 400,
    data: {}
  };

  return new Response(JSON.stringify(payload), {
    headers: CORS_HEADERS,
    status: 400
  });
}

function success(data, message="OK") {
  let payload = {
    success: true,
    message: message,
    error_code: 200,
    data: data
  };

  return new Response(JSON.stringify(payload), {
    headers: CORS_HEADERS,
    status: 200
  });
}


// ============================================================
// Handle requests
// ============================================================
async function handleRequest(request)
{
  // Fetch user parameters
  const url = new URL(request.url),
        method = request.method,
        endpoint = url.pathname;

  // Only accept expected hosts (origin = null outside browser)
  let origin = request.headers.get('Origin');
  if(origin == null)
    origin = "null";
  else
    origin = origin.replace(/https?:\/\/(www\.)?/, "");

  // ----------------------------------------------------------
  // /store/<some/path>
  // ----------------------------------------------------------
  if(endpoint.startsWith(ROUTE_STORE))
  {
    // Parse token, if any
    let url = new URL(request.url),
        token = url.searchParams.get("token"),
        ttl = url.searchParams.get("ttl");

    // Sanitize the endpoint (trim whitespace and slashes)
    let uuid = endpoint
                  .replace(ROUTE_STORE, "")
                  .trim()
                  .replace(/\/$/, "")  // remove trailing slash
                  .replace(/^\//, "")  // remove leading slash

    // --------------------------------------------------------
    // GET /store/<some/path>
    // --------------------------------------------------------
    if(method == "GET") {
      // Must specify an ID
      if(uuid == null || uuid == "")
        return error_400(ERROR_MISSING_ID);

      // Fetch the ID of interest
      return success(await STORE.get(uuid, "json"));
 
    // --------------------------------------------------------
    // POST /store (body = contents)
    // --------------------------------------------------------
    } else if(method == "POST") {
      // Parse out the JSON
      let value = null, key = null, time_to_live;
      try {
        value = JSON.stringify(await request.json());
      } catch(e) {
        return error_400(ERROR_INVALID_JSON);
      }

      // If no uuid, generate a random one
      if(uuid == null || uuid == "" || token != TOKEN_STORE)
        uuid = uuidv4();

      // Set default key name & TTL
      key = `${ALLOWED_HOSTS[origin].store.prefix}/${uuid}`;
      time_to_live = STORE_TTL;
      // Can also specify a custom ID with custom TTL with a token
      if(token == TOKEN_STORE) {
        key = uuid;
        if(ttl != null)
          time_to_live = ttl;
      }

      // Generate the key name and store data there
      await STORE.put(key, value, { expirationTtl: time_to_live });
      return success(key);

    // --------------------------------------------------------
    // DELETE /store/<some/path>
    // --------------------------------------------------------
    } else if(method == "DELETE") {
      if(token != TOKEN_STORE || uuid.startsWith("_") || uuid == null || uuid == "")
        return error_400(ERROR_INVALID_ENDPOINT);

      return success(await STORE.delete(uuid));
    }

  }

  return error_400(ERROR_INVALID_ENDPOINT);
}


// ============================================================
// CORS Support
// ============================================================

function handleOptions(request) {
	// Make sure the necesssary headers are present
	// for this to be a valid pre-flight request
	if (
		request.headers.get('Origin') !== null &&
		request.headers.get('Access-Control-Request-Method') !== null &&
		request.headers.get('Access-Control-Request-Headers') !== null
	) {
		// Handle CORS pre-flight request.
		return new Response(null, {
			// We support the GET, POST, HEAD, and OPTIONS methods from any origin,
			// and accept the Content-Type header on requests. These headers must be
			// present on all responses to all CORS requests. In practice, this means
			// all responses to OPTIONS requests.
			headers: {
				'Access-Control-Allow-Origin': CORS_ORIGIN,
				'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Range',
				'Access-Control-Max-Age': 600  // Cache OPTIONS queries for 10 mins
			},
		});
	} else {
		// Handle standard OPTIONS request.
		return new Response(null, {
			headers: { Allow: 'GET, HEAD, OPTIONS' },
		});
	}
}


// ============================================================
// On function load
// ============================================================
addEventListener('fetch', event => {
  let request = event.request;

  if (request.method === 'OPTIONS')
    event.respondWith(handleOptions(request));
  else
    event.respondWith(handleRequest(request));
});
