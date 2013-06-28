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
        { host: HOST, port: PORT, method: 'GET', path: DBNAME + '/' + url },
        function(res) {
            var data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                var result = JSON.parse(data);

                if (res.statusCode >= 400) {
                    var error = new Error('HTTP error code');
                    error.message = result;
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
        { host: HOST, port: PORT, method: 'PUT', path: DBNAME + '/' + url },
        function(res) {
            var data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                var result = JSON.parse(data);

                if (res.statusCode >= 400) {
                    var error = new Error('HTTP error code');
                    error.message = result;
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

// Public API
function signup(user) {
    user.type = 'user';
    user.password = hash(user.password);
    return doPUT(user.login, user);
}

function login(user) {
    var hashedPassword = hash(user.password);

    var d = deferred();
    doGET(user.login)
    .then(
        function(data) {
            if (data.password == hashedPassword) {
                var user = {login: data.login};
                d.resolve(user);
            } else {
                d.reject(new Error('Wrong password'));
            }
        },
        function(err) {
            d.reject(new Error('Wrong login'));
        }
    );

    return d.promise;
}

exports.signup = signup;
exports.login = login;