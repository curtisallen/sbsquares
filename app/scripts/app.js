'use strict';

var sbsquaresApp = angular.module('sbsquaresApp', [])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/group/:groupId', {
        templateUrl: 'views/group.html',
        controller: 'GroupsCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);
