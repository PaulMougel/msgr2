var http = require('http');
var deferred = require('deferred');
var HOST = 'localhost';
var PORT = 5984;
var DBNAME = '/msgr';

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
};

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
};

function createDb() {
    return doPUT(DBNAME, {})
};

function createView() {
    var _rev = undefined;
    
    return doGET(DBNAME + '/_design/articles')
    .then(function(res) {
        _rev = res._rev;
    })
    .finally(function() {
        var couchViews = require("./couch-views");
        couchViews._rev = _rev;
        return doPUT(DBNAME + '/_design/articles', couchViews)
        .then(
            function(res) {
                console.log("Views created or updated");
            },
            function(err) {
                console.log("Views creation failed: " + err.message);
            }
        );
    })
};

function initDb() {
    var p = createDb();
    
    p.then(
        function() {
            console.log("Database created");
            return createView();
        },
        function(err) {
            if (err.message === "file_exists") {
                console.log("Database already exists");
                return createView();
            }
            else {
                console.log("Database creation failed: " + err);
                return p;
            }
        }
    );

    return p;
}

initDb();