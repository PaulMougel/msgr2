'use strict';

angular.module('msgr')
.factory('authService', function($http, apiBaseUrl) {
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
        }
    };
});