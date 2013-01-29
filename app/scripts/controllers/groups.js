'use strict';

sbsquaresApp.controller('GroupsCtrl', function($scope, $http, $location, $log) {
  
  $scope.group = null;
  $scope.email = null;
  $scope.name = null;
  
  $scope.showUserInfo = false;

  $scope.init = function() {
  	$http.get($location.url())
  	.success(function(data, status, headers, config) {
  		$scope.group = data;
  	});
  	var url = $location.url();
  	console.log(angular.toJson(url));
  };

  $scope.userEmail = function() {
  	var user = _.find($scope.group.users, function(mail) {
  		if(mail === email) {
  			return mail;
  		}
  	});
  	if(_.isUndefined(user)) { // add this user to the model
  		$scope.showUserInfo = true;

  	}
  	$log.log("Got this user " + user);
  }
});
