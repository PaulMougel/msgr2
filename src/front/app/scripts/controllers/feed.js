'use strict';

angular.module('msgr')
.controller('FeedController', function ($scope, $routeParams, $location, authService, subscriptionsService, Slug) {
    $scope.read = function(article) {
        subscriptionsService.read($scope.subscription.xmlUrl, article.guid).success(function() {
            article.unread = false;
            $scope.subscription.unread = _.without($scope.subscription.unread, article.guid);
        });
    };

     $scope.unread = function(article) {
        subscriptionsService.unread($scope.subscription.xmlUrl, article.guid).success(function() {
            article.unread = true;
            $scope.subscription.unread.push(article.guid);
        });
    };

    // Initialization
    $scope.subscription = undefined;
    $scope.articles = undefined;

    authService.ensureLogin().success(function() {
        // feedSlug => feed info
        _.map(authService.user.subscriptions, function(s) {
            if (Slug.slugify(s.title) === $routeParams.feedSlug)
                $scope.subscription = s;
        });
        if ($scope.subscription === undefined) {
            $location.path('/subscriptions');
            return;
        }

        // Get all the articles information for this feed
        subscriptionsService.get($scope.subscription.xmlUrl, true).success(function(data) {
            $scope.articles = data;

            _.map($scope.articles, function(article) {
                article.unread = _.contains($scope.subscription.unread, article.guid);
            })
        });
    });
});