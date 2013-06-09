'use strict';

describe('Service: newsblurService', function () {

  // load the service's module
  beforeEach(module('srcApp'));

  // instantiate service
  var newsblurService;
  beforeEach(inject(function (_newsblurService_) {
    newsblurService = _newsblurService_;
  }));

  it('should do something', function () {
    expect(!!newsblurService).toBe(true);
  });

});
