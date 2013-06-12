'use strict';

angular.module('msgr', ['xml'])
.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: 'views/login.html',
		controller: 'LoginController'
	})
	.when('/stories/', {
		templateUrl: 'views/stories.html',
		controller: 'AtomController'
	})
	.otherwise({
		templateUrl: 'views/404.html'
	});
}])
.config(function ($httpProvider) {
    $httpProvider.responseInterceptors.push('xmlHttpInterceptor');
});