'use strict';

angular.module('msgr')
.controller('SubscriptionsController', function ($scope, authService, subscriptionsService) {
    var refreshSubscriptions = function() {
        subscriptionsService.getAll().success(function(data) {
            $scope.subscriptions = data;
        });
    };

    $scope.add = function() {
        var url = encodeURIComponent($scope.xmlUrl);
        subscriptionsService.add(url).success(refreshSubscriptions);
    };

    // Initialization
    authService.ensureLogin().success(function() {
        refreshSubscriptions();
    });
});