var express = require('express');
var app = express();

app.all('*', function(request, response, next) {
  	if (request.method === "OPTIONS") {
		if (request.headers.origin) {
            response.setHeader("Access-Control-Allow-Origin", request.headers.origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods", "PUT, PATCH, DELETE");
            response.setHeader("Access-Control-Allow-Headers", "accept, access-control-allow-credentials, x-requested-with, origin, content-type");
			response.writeHead(200, "OK");
		} else {
			response.writeHead(400, "Bad Request");
		}

	} else {
		// add CORS headers
		if (request.headers.origin) {
            response.setHeader("Access-Control-Allow-Origin", request.headers.origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
    }
  	next();
 });

app.listen(3000);