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
    var d = deferred();

    console.log('Creating database...')
    doPUT(DBNAME, {})
    .then(
        function() {
            console.log('Database created');
            d.resolve();
        }, function(err) {
            if (err.message === 'file_exists') {
                console.log('Database already exists');
                d.resolve();
            }
            else {
                console.log('Database creation failed: ' + err);
                d.reject();
            }
        }
    );

    return d.promise;
};

function createView(couchUrl, filename) {
    var _rev = undefined;
    
    var d = deferred();

    doGET(DBNAME + couchUrl)
    .then(function(res) {
        _rev = res._rev;
    })
    .finally(function() {
        var couchViews = require(filename);
        couchViews._rev = _rev;
        doPUT(DBNAME + couchUrl, couchViews)
        .then(
            function(res) {
                console.log('View' + couchUrl + ' created or updated');
                d.resolve();
            },
            function(err) {
                console.log('View' + couchUrl + ' creation failed: ' + err.message);
                d.reject();
            }
        );
    });

    return d.promise;
};

function initDb() {
    return createDb()
    .then(function() { createView('/_design/articles', './couch-views-articles');} )
    .then(function() { createView('/_design/feeds', './couch-views-feeds');} )
    .then(function() { createView('/_design/users', './couch-views-users');} )
}

initDb();