'use strict';

describe('Directive: cpAppVersion', function () {

  // load the directive's module
  beforeEach(module('cpApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<cp-app-version></cp-app-version>');
    element = $compile(element)(scope);
    expect(element.text()).toMatch(/\d+\.\d+\.\d+/);
  }));
});
