'use strict';

sbsquaresApp.controller('GroupsCtrl', function($scope, $http, $location, $log) {
  
  $scope.group = null;
  $scope.email = {show: false, value: null};
  $scope.name = null;

  $scope.showUserInfo = false;

  $scope.init = function() {
      $log.log("group init called");
  	$http.get($location.url())
  	.success(function(data, status, headers, config) {
                $log.log("Received group info: "+angular.toJson(data));
  		$scope.group = data;
                $log.log("group: "+angular.toJson($scope.group));
  	}).error(function(data, status, headers, config) {
  		// redirect becuase there is no session
  		$location.url('/');
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
