var http = require('http');
var HOST = 'localhost';
var PORT = 5984;
var DBNAME = '/msgr';

console.log('Creating database…');
http.request(
    {
        host: HOST,
        port: PORT,
        method: 'PUT',
        path: DBNAME
    },
    function(res) {
        console.log("Database created: " + res.statusCode);
    }
).end();