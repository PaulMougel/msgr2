'use strict';

angular.module('msgr')
  .factory('newsblurService', function ($rootScope, $http) {
    // Service logic
    // ...

    // Public API here
    return {
      login: function (username, password) {
      return $http({
          method: "POST",
          url: "http://newsblur.com/api/login",
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          transformRequest: function(obj) {
            var str = [];
            for(var p in obj)
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
          },
          data: {username: username, password: password},
          withCredentials: true
        });
      }
    };
  });
