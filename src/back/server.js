var db = require("./couch-wrapper");

var express = require("express");
var crypto = require("crypto");

var app = express();
var users = [];

app.use(express.bodyParser());

/* implement CORS */
app.all("*", function (request, response, next) {
  	if (request.method === "OPTIONS") {
  		// set cors headers for preflight request
		if (request.get("Origin")) {
            response.set("Access-Control-Allow-Origin", request.get("Origin"));
            response.set("Access-Control-Allow-Credentials", "true");
            response.set("Access-Control-Allow-Methods", "PUT, PATCH, DELETE");
            response.set("Access-Control-Allow-Headers", "accept, access-control-allow-credentials, x-requested-with, origin, content-type");
			return response.send(200);
		} else {
			return response.send(400);
		}

	} else {
		// set CORS headers for actual request
		if (request.get("Origin")) {
            response.set("Access-Control-Allow-Origin", request.get("Origin"));
            response.set("Access-Control-Allow-Credentials", "true");
        }
    }
  	next();
 });

/* sign-in */
app.post("/users/signin", function (request, response) {
	if (request.body.login && request.body.password) {
		db.signin({
			login: request.body.login,
			password: request.body.password
		}).then(function (data) {
			response.send(200);
		}, function (error) {
			response.status(401).send(error.message);
		});
	} else {
		response.send(400);
	}
});

/* sign-up */
app.post("/users/signup", function (request, response) {
	if (request.body.login && request.body.password) {
		db.signup({
			login: request.body.login,
			password: request.body.password
		}).then(function (data) {
			response.send(201);
		}, function (error) {
			response.status(403).send(error.message);
		});
	} else {
		response.send(400);
	}
});

/* get user info, including unread count */
app.get("/user", function (request, response) {
	response.send(501);
});

/* get feeds the logged user subscribed to */
app.get("/user/feeds", function (request, response) {
	response.send(501);
});

/* get feed's last stories */
app.get("/feeds/:feed", function (request, response) {
	response.send(501);
});

/* subscribe to a feed */
app.put("/user/feeds/:feed_url", function (request, response) {
	response.send(501);
});

app.listen(3000);
console.log('Express started on port 3000');
