var db = require("./couch-wrapper");
var feed = require("./feed-wrapper");

var express = require("express");
var crypto = require("crypto");
var deferred = require("deferred");
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
			response.cookie('token', user.token, {maxAge: 86400000});
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

/* mark an article as unread */
app.post("\^\/user\/feeds\/*\/*\/unread", function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]), story_guid = decodeURIComponent(request.params[1]);
	if (users[request.cookies.token]) {
		db.getUser({login: users[request.cookies.token]})
		.then(function (user) {
			var unread = _.find(user.subscriptions, function (s) {
				return (s.xmlUrl === feed_url)
			}).unread, story_array = [];
			story_array.push(story_guid);
			unread = _.union(unread, story_array);
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

		// Get feed OR (Add feed to database and get it)
		var d = deferred();
		db.getFeed({xmlUrl: feed_url})
		.then(
			function(feed) { // feed exists
				d.resolve(feed);
			},
			function(err) {
				if (err.message !== 'not_found') d.reject(err);

				// Feed doesn't exist, we need to add it to the db
				feed.get_meta(feed_url)
				.then(db.addFeed)
				.then(function() {
					return db.getFeed({xmlUrl: feed_url})
				}).then(function(feed) {
					d.resolve(feed);
				})
				.catch(function(err) { d.reject(err)})
			}
		);
		// Make the user subscribe to this feed
		d.promise.then(
			function (feed) {
				db.subscribe({login: users[request.cookies.token]}, {title: feed.title, xmlUrl: feed.xmlUrl})
				.then(function (user) {
					response.status(200).send(user);
				}, function (error) {
					response.status(403).send(error.message);
				});
			}
			, function (error) {
				response.status(403).send(error.message);
			}
		);
	} else {
		response.send(401);
	}
});

/* cancel a subscription */
app.delete("\^\/user\/feeds\/*", function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]);
	if (users[request.cookies.token]) {
		db.unsubscribe({login: users[request.cookies.token]}, {xmlUrl: feed_url})
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

function updateFeeds() {
	return db.getAllFeeds()
	.then(function (feeds) {
		_.each(feeds, function (f) {
			feed.get_stories(f.xmlUrl)
			.then(function (stories) {
				_.each(stories, function (story) {
					db.addArticle(story);
				});
			});
		});
	});
}

/* we should not provide this API call in a production environment */
app.post("/feeds/update", function (request, response) {
	if (users[request.cookies.token]) {
		updateFeeds()
		.then(function () {
			response.send(204);
		}, function (error) {
			response.status(400).send(error.message);
		});
	}
});

app.listen(3000);
console.log('Express started on port 3000');

/* updates every 30 mn */
setInterval(updateFeeds, 1000*60*30);
