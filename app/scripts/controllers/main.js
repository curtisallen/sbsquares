'use strict';

sbsquaresApp.controller('MainCtrl', function($scope, $log, $http, $location) {

	$scope.password = null;
	$scope.groupId = null;
	$scope.error = {show: false};

  $scope.createGroup = function () {
  	//$log.log("Create group");
  	var data = {"groupId": $scope.groupId, "password": $scope.password};
  	//$log.log("Sedning: " + angular.toJson(data));
  	$http.post("/createGroup", data)
  		.success(function(data, status, headers, config) {
  			$log.log("created group " + angular.toJson(data));
  			$location.path('/group/' + $scope.groupId);
  		})
  		.error(function(data, status, headers, config) {
  			$log.log("Coudn't create group " + angular.toJson(data));
  			$scope.error = {show: true, msg: data.message};
  		});
  };

  $scope.login = function () {
  	var data = {"groupId": $scope.groupId, "password": $scope.password};
  	$log.log("Login");
  	$http.post("/login", data)
  		.success(function(data, status, headers, config) {
  			$location.path('/group/' + $scope.groupId);
  		})
  		.error(function(data, status, headers, config) {
  			$log.log("Error login unsuccessful" + angular.toJson(data));
  			$scope.error = {show: true, msg: data.message};
  		});
  }
});
