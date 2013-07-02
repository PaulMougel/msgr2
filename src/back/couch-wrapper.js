var http = require('http');
var crypto = require('crypto');
var deferred = require('deferred');
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

function subscribe(user, feed) {
    return doGET(DBNAME + '/' + user.login)
    .then(function (user) {
        user.subscriptions.push(feed);
        return doPUT(DBNAME + '/' + user.login, user);
    });
}

function unsubscribe(user, feed) {
    return doGET(DBNAME + '/' + user.login)
    .then(function (user) {
        user.subscriptions = _.filter(user.subscriptions, function(subscription) {
            return subscription.xmlUrl !== feed.xmlUrl;
        });
        return doPUT(DBNAME + '/' + user.login, user);
    });
}

function addFeed(feed) {
    feed.type = 'feed';
    return doPUT(DBNAME + '/' + encodeURIComponent(feed.xmlUrl), feed)
    .then(function(feed) {
        return cleanFeed(feed);
    });
}

function getFeed(feed) {
    return doGET(DBNAME + '/' + encodeURIComponent(feed.xmlUrl))
    .then(function(feed) {
        return cleanFeed(feed);
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
    .then(function(article) {
        return cleanArticle(article);
    });
}

exports.signup = signup;
exports.signin = signin;
exports.getUser = getUser;
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.addFeed = addFeed;
exports.getFeed = getFeed;
exports.addArticle = addArticle;
exports.getArticle = getArticle;
exports.getAllArticlesForFeed = getAllArticlesForFeed;