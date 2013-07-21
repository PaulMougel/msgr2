var db = require("./couch-wrapper");
var feed = require("./feed-wrapper");

var express = require("express");
var crypto = require("crypto");
var deferred = require("deferred");
var _ = require("underscore");

var app = express();
var users = [];

/* middlewares */
app.use(express.cookieParser());
app.use(express.bodyParser());
var auth = function(request, response, next) {
	if (request.cookies.token && users[request.cookies.token]) {
		request.login = users[request.cookies.token];
		next();
	}
	else if (request.get("Authorization")) {
		express.basicAuth(function (login, password, callback) {
			db.signin({
				login: login,
				password: password
			}).then(function (user) {
				request.login = user.login;
				callback(null, true);
			}, function (error) {
				callback(error.message, false);
			});
		})(request, response, next);
	}
	else {
		return response.send(401);
	}
}

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

/* get user info */
app.get("/user", auth, function (request, response) {
	db.getUser({login: request.login})
	.then(function (user) {
		response.status(200).send(user);
	}, function (error) {
		response.status(403).send(error.message);
	});
});

/* get feeds the logged user subscribed to */
app.get("/user/feeds", auth, function (request, response) {
	db.getUserWithFeedSummary({login: request.login})
	.then(function (user) {
		response.status(200).send(user.subscriptions);
	}, function (error) {
		response.status(403).send(error.message);
	});
});

/* get feed's last stories */
app.get("\^\/user\/feeds\/*", auth, function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]);
	db.getAllArticlesForFeed({login: request.login}, {xmlUrl: feed_url})
	.then(function (data) {
		if (request.query.filter === "unread") {
			data = _.filter(data, function (article) { return ! article.read; });
		}

		response.status(200).send(data);
	}, function (error) {
		response.status(403).send(error.message);
	});
});

/* get an article */
app.get("\^\/user\/articles\/*", auth, function (request, response) {
	var guid = decodeURIComponent(request.params[0]);
	db.getArticle({guid: guid})
	.then(function (data) {
		response.status(200).send(data);
	}, function (error) {
		response.status(403).send(error.message);
	});
});

/* mark an article as read */
app.post("\^\/user\/feeds\/*\/*\/read", auth, function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]), story_guid = decodeURIComponent(request.params[1]);
	db.updateReadstate({login: request.login}, {guid: story_guid}, true)
	.then(
		function (user) {
			response.status(200).send(user);
		}, function (error) {
			response.status(403).send(error.message);
		}
	);
});

/* mark an article as unread */
app.post("\^\/user\/feeds\/*\/*\/unread", auth, function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]), story_guid = decodeURIComponent(request.params[1]);
	db.updateReadstate({login: request.login}, {guid: story_guid}, false)
	.then(
		function (user) {
			response.status(200).send(user);
		}, function (error) {
			response.status(403).send(error.message);
		}
	);
});

/* subscribe to a feed */
app.put("\^\/user\/feeds\/*", auth, function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]);
	console.log("subscribing to " + feed_url + "...");

	// Get feed OR (Add feed to database and get it)
	var d = deferred();
	db.getFeed({xmlUrl: feed_url})
	.then(
		function(feed) { // feed exists
			console.log("... " + feed.title + " already exists");
			d.resolve(feed);
		},
		function(err) {
			if (err.message !== 'not_found') d.reject(err);

			// Feed doesn't exist, we need to add it to the db
			console.log("... " + feed_url + " doesn't exist yet");
			feed.get_meta(feed_url)
			.then(function (feed) {
				console.log(feed);
				console.log("... ... got " + feed.title + "; storing it...");
				return db.addFeed(feed);
			})
			.then(function (f) {
				console.log("... ... done");						
				d.resolve(f);
			})
			.catch(function (err) {
				console.log("failed");
				console.log(err);
				d.reject(err)
			});
		}
	);
	// Make the user subscribe to this feed
	d.promise.then(
		function (feed) {
			db.subscribe({login: request.login}, {title: feed.title, xmlUrl: feed.xmlUrl})
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
});

/* cancel a subscription */
app.delete("\^\/user\/feeds\/*", auth, function (request, response) {
	var feed_url = decodeURIComponent(request.params[0]);
	db.unsubscribe({login: request.login}, {xmlUrl: feed_url})
	.then(
		function (user) {
			response.status(200).send(user);
		}, function (error) {
			response.status(403).send(error.message);
		}
	);
});

/* 
 * updateFeeds() returns immediately, in order to end the request.
 * It should sequentially process each feed 
 */
function updateFeeds() {
	console.log("update...");
	// Retrieve all feeds
	var newStoriesByFeed = db.getAllFeeds()
	.then(function (feeds) {
		return deferred.map(feeds, function (f) {
			console.log("... fetching " + f.title);
			return feed.get_stories(f.xmlUrl)
			.then(function (stories) {
				return deferred.map(stories, function (story) {
					console.log("... ... found " + story.title);
					return db.addArticle(story).then(
						function () { return story; },
						function () { return undefined; }
					);
				})
				.then(function (stories) {
					var newStories = _.filter(stories, function (story) {
						return story !== undefined;
					});
					return {newStories: newStories, feed: f.xmlUrl};
				});
			}, function (err) {
				console.log("... unable to fetch " = f.title);
				return [];
			});
		});
	});

	// Retrieve all users
	var allUsers = db.getAllUsers();

	// When we have both, add all readState documents
	return deferred(newStoriesByFeed, allUsers)
	.then(function (data) {
		console.log("... got all feeds & users information, adding readState documents");
		var newStoriesByFeed = data[0];
		var allUsers = data[1];

		return deferred.map(allUsers, function (user) {
			return deferred.map(user.subscriptions, function (subscription) {
				var newArticles = _.findWhere(newStoriesByFeed, {feed: subscription.xmlUrl}).newStories;
				return deferred.map(newArticles, function (newArticle) {
					return db.addReadstate(user, subscription, newArticle, false);
				});
			});
		});
	});
}

/* we should not provide this API call in a production environment */
app.post("/feeds/update", auth, function (request, response) {
	updateFeeds()
	.then(
		function () {console.log('Feed update: Success')},
		function (err) {console.log('Feed update: Error, ' + err.message)}
	);
	response.send(204);
});

app.listen(3000);
console.log('Express started on port 3000');

/* updates every 30 mn */
setInterval(updateFeeds, 1000*60*30);
