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

        // get all articles basic information for this feed
        subscriptionsService.get(subscription.xmlUrl)
        .success(function(s) {
            // article slug => article guid
            var article_guid = undefined;
            _.map(s, function(a) {
                if (Slug.slugify(a.title) === $routeParams.articleSlug)
                    article_guid = a.guid;
            });
            if (article_guid === undefined) {
                $location.path('/feed/' + feedSlug);
                return;
            }

            subscriptionsService.getArticle(article_guid).success(function (data) {
                $scope.article = data;
            })
        })
        .error(function() {
            $location.path('/feed/' + feedSlug);
        });
    });
});