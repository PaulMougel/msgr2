'use strict';

angular.module('msgr', ['xml', 'slugifier'])
.config(function ($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'views/login.html',
    })
    .when('/subscriptions', {
        templateUrl: 'views/subscriptions.html',
    })
    .when('/feed/:feedSlug', {
        templateUrl: 'views/feed.html',
    })
    .when('/feed/:feedSlug/:articleSlug', {
        templateUrl: 'views/article.html',
    })
    .when('/import-opml', {
        templateUrl: 'views/import-opml.html',
    })
    .otherwise({
        templateUrl: 'views/404.html'
    });
})
.config(function ($httpProvider) {
    $httpProvider.responseInterceptors.push('xmlHttpInterceptor');
})
.constant('apiBaseUrl', 'http://' + document.domain + ':3000')
.run(function($rootScope) {
    // Re-initialize Foundation on each view change
    $rootScope.$on('$viewContentLoaded', function () {
        $(document).foundation();
    });
});