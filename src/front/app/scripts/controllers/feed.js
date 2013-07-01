'use strict';

angular.module('msgr')
.controller('FeedController', function ($scope, $routeParams, $location, authService, subscriptionsService, Slug) {
    // Initialization
    authService.ensureLogin().success(function() {
        // Find the feed corresponding to the URL parameter
        var subscription = undefined;
        _.map(authService.user.subscriptions, function(s) {
            if (Slug.slugify(s.title) === $routeParams.titleSlug)
                subscription = s;
        });
        if (subscription === undefined)
            $location.path('/subscriptions');
        subscriptionsService.get(subscription.xmlUrl).success(function(data) {
            $scope.articles = data;
        });
    });
});