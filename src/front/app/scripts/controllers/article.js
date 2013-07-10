'use strict';

angular.module('msgr')
.controller('ArticleController', function ($scope, $routeParams, $location, authService, subscriptionsService, Slug) {
    // Initialization
    authService.ensureLogin().success(function() {
        var feedSlug = $routeParams.feedSlug;
        var articleSlug = $routeParams.articleSlug;

        // feedSlug => feed info
        var subscription = undefined;
       _.map(authService.user.subscriptions, function(s) {
            if (Slug.slugify(s.title) === $routeParams.feedSlug)
                subscription = s;
        });
        if (subscription === undefined)
            $location.path('/subscriptions');

        // articleSlug => article infos
        subscriptionsService.get(subscription.xmlUrl)
        .success(function(s) {
            $scope.article = undefined;
            _.map(s, function(a) {
                if (Slug.slugify(a.title) === $routeParams.articleSlug)
                    $scope.article = a;
            });
            if ($scope.article === undefined)
                $location.path('/feed/' + feedSlug);
        })
        .error(function() {
            $location.path('/feed/' + feedSlug);
        });
    });
});