var http = require('http');
var Q = require('Q');
var HOST = 'localhost';
var PORT = 5984;
var DBNAME = '/msgr';

function doPUT(url, data) {
    var deferred = Q.defer();
    var req = http.request(
        { host: HOST, port: PORT, method: 'PUT', path: DBNAME + '/' + url },
        function(res) {
            var data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                deferred.resolve(data);
            });
        }
    );
    req.on('error', function(e) {
        deferred.reject(e);
    });
    req.write(JSON.stringify(data));
    req.end();

    return deferred.promise;
}


function signup(user) {
    return doPUT(user.login, user)
}

signup({
    type: 'user'
    login: 'pmol',
    password: 'bra'
});