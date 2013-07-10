'use strict';

angular.module('msgr')
.controller('TopBarController', function ($scope, $location, $routeParams) {
    var p = $location.path();

    if (p === '/subscriptions') {
        $scope.breadcrumbs = [
            { title: 'My subscriptions', link: '#'}
        ];
    }
    else if (p === '/import-opml') {
        $scope.breadcrumbs = [
            { title: 'My subscriptions', link: '#/subscriptions'},
            { title: 'Import OPML', link: '#'}
        ];
    }
    // /feed/:feedSlug/:articleSlug
    else if (p.match(/\/feed\/.*\/.*/)) {
        var feed = $routeParams.feedSlug;
        var article = $routeParams.articleSlug;

        $scope.breadcrumbs = [
            { title: 'My subscriptions', link: '#/subscriptions'},
            { title: feed, link: '#/feed/' + feed},
            { title: article, link: '#'}
        ];
    }
    // /feed/:feedSlug
    else if (p.match(/\/feed\/.*/)) {
        var feed = $routeParams.feedSlug;
        $scope.breadcrumbs = [
            { title: 'My subscriptions', link: '#/subscriptions'},
            { title: feed, link: '#'}
        ];
    }
});