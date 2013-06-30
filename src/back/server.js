var db = require("./couch-wrapper");
var feed = require("./feed-wrapper");

var express = require("express");
var crypto = require("crypto");
var _ = require("underscore");

var app = express();
var users = [];
users.token = "kikoo";

app.use(express.cookieParser());
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
		}).then(function (user) {
			response.cookie('token', user.token, {maxAge: 900000});
			response.status(200).send(user);
			users[user.token] = user.login;
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
	if (users[request.cookies.token]) {
		db.getUser({login: users[request.cookies.token]})
		.then(function (user) {
			response.status(200).send(user);
		}, function (error) {
			response.status(403).send(error.message);
		});
	} else {
		response.send(401);
	}
});

/* get feeds the logged user subscribed to */
app.get("/user/feeds", function (request, response) {
	if (users[request.cookies.token]) {
		db.getUser({login: users[request.cookies.token]})
		.then(function (user) {
			response.status(200).send(user.subscriptions);
		}, function (error) {
			response.status(403).send(error.message);
		});
	} else {
		response.send(401);
	}
});

/* get feed's last stories */
app.get("\^\/user\/feeds\/*", function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]);
	if (users[request.cookies.token]) {
		feed.get_stories(feed_url)
		.then(function (data) {
			if (request.query.filter === "unread") {
				db.getUser({login: users[request.cookies.token]})
				.then(function (user) {
					var unread = _.find(user.subscriptions, function (s) {
						return (s.xmlUrl === feed_url)
					}).unread, dataToSend = [];
					dataToSend = _.filter(data, function (d) {
						return unread.indexOf(d.guid) != -1;
					});
					response.status(200).send(dataToSend);
				});
			}
			else {
				response.status(200).send(data);
			}
		}, function (error) {
			response.status(403).send(error.message);
		});
	} else {
		response.send(401);
	}
});

/* mark an article as read */
app.post("\^\/user\/feeds\/*\/*\/read", function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]), story_guid = decodeURIComponent(request.params[1]);
	if (users[request.cookies.token]) {
		db.getUser({login: users[request.cookies.token]})
		.then(function (user) {
			var unread = _.find(user.subscriptions, function (s) {
				return (s.xmlUrl === feed_url)
			}).unread;
			unread = _.without(unread, story_guid);
			user.subscriptions[_.indexOf(user.subscriptions, _.findWhere(user.subscriptions, {xmlUrl: feed_url}))].unread = unread;
			return db.updateUser(user)
			.then(function () {
				return user;
			});
		})
		.then(
			function (user) {
				response.status(200).send(user);
			}, function (error) {
				response.status(403).send(error.message);
			}
		);
	} else {
		response.send(401);
	}
});

/* subscribe to a feed */
app.put("\^\/user\/feeds\/*", function (request, response) {
	if (users[request.cookies.token]) {
		var feed_url = decodeURIComponent(request.params[0]);
		feed.get_meta(feed_url)
		.then(function (meta) {
			db.addSubscription({login: users[request.cookies.token]}, meta)
			.then(function (user) {
				response.status(200).send(user);
			}, function (error) {
				response.status(403).send(error.message);
			});
		}, function(error) {
			response.status(403).send(error.message);
		});
	} else {
		response.send(401);
	}
});

app.listen(3000);
console.log('Express started on port 3000');
