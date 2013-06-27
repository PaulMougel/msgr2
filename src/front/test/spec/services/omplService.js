'use strict';

describe('Service: omplService', function () {

  // load the service's module
  beforeEach(module('srcApp'));

  // instantiate service
  var omplService;
  beforeEach(inject(function (_omplService_) {
    omplService = _omplService_;
  }));

  it('should do something', function () {
    expect(!!omplService).toBe(true);
  });

});
