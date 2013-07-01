'use strict';

angular.module('msgr')
.factory('subscriptionsService', function($http, apiBaseUrl, authService) {
    return {
        getAll: function() {
            return $http({
                method: 'GET',
                url: apiBaseUrl + '/user/feeds',
                withCredentials: true
            });
        },
        add: function(xmlUrl) {
            return $http({
                method: 'PUT',
                url: apiBaseUrl + '/user/feeds/' + encodeURIComponent(xmlUrl),
                withCredentials: true
            });
        },
        get: function(xmlUrl) {
            return $http({
                method: 'GET',
                url: apiBaseUrl + '/user/feeds/' + encodeURIComponent(xmlUrl),
                withCredentials: true
            });
        },
        read: function(xmlUrl, guid) {
            return $http({
                method: 'POST',
                url: apiBaseUrl + '/user/feeds/' + encodeURIComponent(xmlUrl) + '/' + encodeURIComponent(guid) + '/read',
                withCredentials: true
            });
        }
    };
});