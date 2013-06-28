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
})
.constant('apiBaseUrl', 'http://' + document.domain + ':3000')
.run(function($rootScope) {
	// Function to be called by each controller once the view is loaded
	// It will initialize foundation's components
	$rootScope.foundation = function() { $(document).foundation(); };
});