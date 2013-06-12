'use strict';

angular.module('msgr')
  .factory('superfeedrService', function ($rootScope, $http) {
    // Service logic
    // ...
    var baseUrl = "https://readerapi.superfeedr.com";
    var token = "";

    function addAuthorizationHeader(headers) {
      if (!headers) {
        headers = {};
      }
      headers['Authorization'] = 'GoogleLogin auth=' + token;
      return headers
    }

    // Public API here
    return {
      login: function (email, password) {
        return $http({
          method: "POST",
          url: baseUrl + "/accounts/ClientLogin",
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          transformRequest: function(obj) {
            var str = [];
            for(var p in obj)
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
          },
          data: {Email: email, Passwd: password}
        });
      },
      user: function() {
        return $http({
          method: "GET",
          url: baseUrl + "/reader/api/0/user-info",
          headers: addAuthorizationHeader(),
        });
      },
      subscriptions: function() {
        return $http({
          method: "GET",
          url: baseUrl + "/reader/api/0/subscription/list?output=json",
          headers: addAuthorizationHeader()
        });
      },
      subscribe: function(feed_url) {
        return $http({
          method: "POST",
          url: baseUrl + "/reader/api/0/subscription/edit",
          headers: addAuthorizationHeader({'Content-Type': 'application/x-www-form-urlencoded'}),
          transformRequest: function(obj) {
            var str = [];
            for(var p in obj)
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
          },
          data: {s: "feed/" + feed_url, ac: "subscribe"}
        });
      },
      atom: function(url, n) {
        if (!url) {
          url = "http://www.engadget.com/rss.xml";
        }
        return $http({
          method: "GET",
          url: baseUrl + "/reader/atom/feed/" + url,
          headers: addAuthorizationHeader(),
        });
      },
      registerToken: function (data) {
        token = _.last(data.split("=")).trim();
      }
    };
  });
