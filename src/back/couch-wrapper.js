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
        feed.unread = [];
        user.subscriptions.push(feed);
        return doPUT(DBNAME + '/' + user.login, user)
        .then(function () {
            return cleanUser(user);
        });
    });
}

function unsubscribe(user, feed) {
    return doGET(DBNAME + '/' + user.login)
    .then(function (user) {
        user.subscriptions = _.filter(user.subscriptions, function(subscription) {
            return subscription.xmlUrl !== feed.xmlUrl;
        });
        return doPUT(DBNAME + '/' + user.login, user)
        .then(function() {
            return cleanUser(user);
        });
    });
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

function getAllArticlesForFeed(feed) {
    return doGET(DBNAME + '/_design/articles/_view/byFeed?key="' + encodeURIComponent(feed.xmlUrl) + '"')
    .then(function(data) {
        return _.map(data.rows, function (row) {
            return cleanArticle(row.value);
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
exports.addArticle = addArticle;
exports.getArticle = getArticle;
exports.getAllArticlesForFeed = getAllArticlesForFeed;
exports.getSubscribersForFeed = getSubscribersForFeed;