'use strict';

angular.module('msgr')
.controller('SubscriptionsController', function ($scope, subscriptionsService) {
    subscriptionsService.getSubscriptions().success(function(data) {
        $scope.subscriptions = data;
    });
});