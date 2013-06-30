'use strict';

angular.module('msgr')
.factory('authService', function($http, $location, apiBaseUrl) {
    return {
        user: undefined,
        signup: function(user) {
            // user = { login: 'foo', password: 'bar' }
            return $http({
                method: 'POST',
                url: apiBaseUrl + '/users/signup',
                data: user,
                withCredentials: true
            });
        },
        signin: function(user) {
            // user = { login: 'foo', password: 'bar' }
            return $http({
                method: 'POST',
                url: apiBaseUrl + '/users/signin',
                data: user,
                withCredentials: true
            });
        },
        ensureLogin: function() {
            // Optimistic function : immediately returns by assuming the
            // user is correctly logged in. If not, after server-side check,
            // redirects the user to the login page
            var t = this;
            var p = $http({
                method: "GET",
                url: apiBaseUrl + "/user",
                withCredentials: true
            });
            p.success(function(data) {
                t.user = data;
            });
            p.error(function() {
                $location.path('/');
            });
            return p;
        }
    };
});