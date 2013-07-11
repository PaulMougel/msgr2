'use strict';

angular.module('msgr')
.controller('FeedController', function ($scope, $routeParams, $location, authService, subscriptionsService, Slug) {
    $scope.read = function(article) {
        subscriptionsService.read($scope.subscription.xmlUrl, article.guid).success(function() {
            article.read = true;
        });
    };

     $scope.unread = function(article) {
        subscriptionsService.unread($scope.subscription.xmlUrl, article.guid).success(function() {
            article.read = false;
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
        subscriptionsService.get($scope.subscription.xmlUrl).success(function (data) {
            $scope.articles = data;
        });
    });

    $scope.$watch(
        'articles',
        function() {
            $scope.unreadCount = _.filter($scope.articles, function (article) {
                return ! article.read;
            }).length;
        },
        true
    );
});