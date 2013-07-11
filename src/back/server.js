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
		db.getUserWithFeedSummary({login: users[request.cookies.token]})
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
	var excludeContent = function (articles) {
		_.each(articles, function(article) {
			delete article.description;
		});
		return articles;
	};

	var feed_url = decodeURIComponent(request.params[0]);
	if (users[request.cookies.token]) {
		db.getAllArticlesForFeed({xmlUrl: feed_url})
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

					if (request.query.withoutcontent === 'true')
						excludeContent(dataToSend);

					response.status(200).send(dataToSend);
				});
			}
			else {
				if (request.query.withoutcontent === 'true')
					excludeContent(data);
				
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
			return db.updateUser(user);
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
app.post("/feeds/update", function (request, response) {
	if (users[request.cookies.token]) {
		updateFeeds()
		.then(
			function () {console.log('Feed update: Success')},
			function (err) {console.log('Feed update: Error, ' + err.message)}
		);
		response.send(204);
	} else {
		response.send(401);
	}
});

app.listen(3000);
console.log('Express started on port 3000');

/* updates every 30 mn */
setInterval(updateFeeds, 1000*60*30);
