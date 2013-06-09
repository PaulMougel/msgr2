'use strict';

describe('Controller: LoginControllerCtrl', function () {

  // load the controller's module
  beforeEach(module('srcApp'));

  var LoginControllerCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LoginControllerCtrl = $controller('LoginControllerCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
