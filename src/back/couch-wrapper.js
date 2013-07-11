var http = require('http');
var crypto = require('crypto');
var deferred = require('deferred');
var _ = require('underscore');
var HOST = 'localhost';
var PORT = 5984;
var DBNAME = '/msgr';

// Private functions
function doGET(url) {
    var d = deferred();
    var req = http.request(
        { host: HOST, port: PORT, method: 'GET', path: url },
        function(res) {
            var data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                var result = JSON.parse(data);

                if (res.statusCode >= 400) {
                    var error = new Error(result.error);
                    d.reject(error);
                } else {
                    d.resolve(result);
                }
            });
        }
    );
    req.on('error', function(e) {
        d.reject(e);
    });
    req.end();

    return d.promise;
}

function doPUT(url, data) {
    var d = deferred();
    var req = http.request(
        { host: HOST, port: PORT, method: 'PUT', path: url },
        function(res) {
            var data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                var result = JSON.parse(data);

                if (res.statusCode >= 400) {
                    var error = new Error(result.error);
                    d.reject(error);
                } else {
                    d.resolve(result);
                }
            });
        }
    );
    req.on('error', function(e) {
        d.reject(e);
    });
    req.write(JSON.stringify(data));
    req.end();

    return d.promise;
}

function doDELETE(url) {
    var d = deferred();
    var req = http.request(
        { host: HOST, port: PORT, method: 'DELETE', path: url},
        function(res) {
            var data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                var result = JSON.parse(data);

                if (res.statusCode >= 400) {
                    var error = new Error(result.error);
                    d.reject(error);
                } else {
                    d.resolve(result);
                }
            });
        }
    );
    req.on('error', function(e) {
        d.reject(e);
    });
    req.end();

    return d.promise;
}

function hash(text) {
    return crypto.createHash("sha512").update(text, "utf8").digest("hex");
}

function cleanUser(user) {
    delete user._id;
    delete user._rev;
    delete user.type;
    delete user.password;
    return user;
}

function cleanFeed(feed) {
    delete feed._id;
    delete feed._rev;
    delete feed.type;
    return feed;
}

function cleanArticle(article) {
    delete article._id;
    delete article._rev;
    delete article.type;
    return article;
}

function cleanReadstate(readstate) {
    delete readstate._id;
    delete readstate._rev;
    delete readstate.type;
    return readstate;
}

// Public API
function signup(user) {
    user.type = 'user';
    user.password = hash(user.password);
    user.subscriptions = [];

    return doPUT(DBNAME + '/' + user.login, user);
}

function signin(user) {
    return doGET(DBNAME + '/' + user.login)
    .then(
        function (u) {
            if (u.password === hash(user.password)) {
                // Get a token from CouchDB
                return doGET('/_uuids').then(
                    function(data) {
                        u.token = data.uuids[0];
                        return cleanUser(u);
                    }
                );
            }
            else {
                throw new Error(('Wrong password'));
            }
        }
    );
}

function getUser(user) {
    return doGET(DBNAME + '/' + user.login)
    .then(
        function (user) {
            return cleanUser(user);
        }
    );
}

function getAllUsers() {
    return doGET(DBNAME + '/_design/users/_view/all')
    .then(function (docs) {
        return _.map(docs.rows, function(row) {
            return cleanUser(row.value);
        });
    });
}

function subscribe(user, feed) {
    return doGET(DBNAME + '/' + user.login)
    .then(function (user) {
        user.subscriptions.push(feed);
        return doPUT(DBNAME + '/' + user.login, user)
        .then(function () {
            return cleanUser(user);
        });
    });
}

function unsubscribe(user, feed) {
    // 1) update the user object
    var updatedUser = doGET(DBNAME + '/' + user.login)
    .then(function (user) {
        user.subscriptions = _.filter(user.subscriptions, function(subscription) {
            return subscription.xmlUrl !== feed.xmlUrl;
        });
        return doPUT(DBNAME + '/' + user.login, user)
        .then(function() {
            return cleanUser(user);
        });
    });
    // 2) remove the readState objects
    var deleteReadStates = doGET(DBNAME + '/_design/feeds/_view/readState'
                + '?startkey=["' + user.login + '","' + encodeURIComponent(feed.xmlUrl) + '"]'
                + '&endkey=["' + user.login + '","' + encodeURIComponent(feed.xmlUrl) + '"]')
    .then(function (data) {
        var readstates = data.rows;
        // NOTE: We limit the number of concurrent DELETE request to 5 with
        // deferred.gate. CouchDB seems to fail when too many DELETE requests
        // are issued at the same time
        return deferred.map(readstates, deferred.gate(function (row) {
            return doDELETE(DBNAME + '/' + encodeURIComponent(row.value._id) + '?rev=' + row.value._rev);
        }), 5);
    });

    return deferred(updatedUser, deleteReadStates).then(function (data) {
        return data[0]; // updated user
    })
}

function updateUser(user) {
    return doGET(DBNAME + '/' + user.login)
    .then(function (u) {
        // Restore deleted fields
        user._rev = u._rev;
        user.type = u.type;
        user.password = !user.password ? u.password : hash(user.password);
        return doPUT(DBNAME + '/' + user.login, user)
    })
    .then(function () {
        return cleanUser(user);
    });
}

function addFeed(feed) {
    feed.type = 'feed';
    return doPUT(DBNAME + '/' + encodeURIComponent(feed.xmlUrl), feed)
    .then(function () {
        return cleanFeed(feed);
    });
}

function getFeed(feed) {
    return doGET(DBNAME + '/' + encodeURIComponent(feed.xmlUrl))
    .then(function(feed) {
        return cleanFeed(feed);
    });
}

function getAllFeeds() {
    return doGET(DBNAME + '/_design/feeds/_view/all')
    .then(function (docs) {
        return _.map(docs.rows, function(row) {
            return cleanFeed(row.value);
        });
    });
}

function getUserWithFeedSummary(user) {
    return getUser(user)
    .then(function(u) {
        // Group by user login and feed xmlUrl: group_level=2
        // Only get the data related to a user: startkey=["toto"]&endkey=["toto",{}]
        return doGET(DBNAME + '/_design/feeds/_view/unreadCount'
                    + '?group_level=2'
                    + '&startkey=["' + u.login + '"]'
                    + '&endkey=["' + u.login + '",{}]')
        .then(function (d) {
            _.map(d.rows, function (result) {
                var feed = result.key[1];
                var count = result.value;
                _.findWhere(u.subscriptions, {xmlUrl: feed}).unreadCount = count;
            });

            return u;
        });
    })
}

function addArticle(article) {
    article.type = 'article';
    return doPUT(DBNAME + '/' + encodeURIComponent(article.guid), article)
    .then(function(article) {
        return cleanArticle(article);
    });
}

function getArticle(article) {
    return doGET(DBNAME + '/' + encodeURIComponent(article.guid))
    .then(function(article) {
        return cleanArticle(article);
    });
}

function getAllArticlesForFeed(user, feed) {
    return doGET(DBNAME + '/_design/feeds/_view/readState'
                    + '?startkey=["' + user.login + '","' + encodeURIComponent(feed.xmlUrl) + '"]'
                    + '&endkey=["' + user.login + '","' + encodeURIComponent(feed.xmlUrl) + '"]')
    .then(function(data) {
        return _.map(data.rows, function (d) {
            var readstate = d.value;
            readstate.article.read = readstate.read; // inject read boolean into article object
            return readstate.article; // and return to server only the article objects
        });
    });
}

function getSubscribersForFeed(feed) {
    return doGET(DBNAME + '/_design/feeds/_view/subscribersByFeed?key="' + encodeURIComponent(feed.xmlUrl) + '"')
    .then(function (s) {
        return _.map(s.rows, function (row) {
            return cleanUser(row.value); // extract subscribers's id
        });
    })
}

function addReadstate(user, subscription, article, read) {
    return doPUT(
        DBNAME + '/' + user.login + ':' + encodeURIComponent(article.guid),
        {
            type: 'readstate',
            login: user.login,
            feed: subscription.xmlUrl,
            article: { guid: article.guid, pubdate: article.pubdate, title: article.title },
            read: read
        }
    );
}

function updateReadstate(user, article, read) {
    return doGET(DBNAME + '/' + user.login + ':' + encodeURIComponent(article.guid))
    .then(function (readstate) {
        readstate.read = read;
        return doPUT(DBNAME + '/' + user.login + ':' + encodeURIComponent(article.guid), readstate);
    });
}

exports.signup = signup;
exports.signin = signin;
exports.getUser = getUser;
exports.getAllUsers = getAllUsers;
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.updateUser = updateUser;
exports.addFeed = addFeed;
exports.getFeed = getFeed;
exports.getAllFeeds = getAllFeeds;
exports.getUserWithFeedSummary = getUserWithFeedSummary;
exports.addArticle = addArticle;
exports.getArticle = getArticle;
exports.getAllArticlesForFeed = getAllArticlesForFeed;
exports.getSubscribersForFeed = getSubscribersForFeed;
exports.addReadstate = addReadstate;
exports.updateReadstate = updateReadstate;