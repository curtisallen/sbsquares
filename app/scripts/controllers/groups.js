'use strict';

sbsquaresApp.controller('GroupsCtrl', function($scope, $http, $location, $log) {

    $scope.group = null;
    $scope.email = null;
    $scope.name = null;
    $scope.squaresCount = 0;
    $scope.squaresCost = 0;

    $scope.showUserInfo = false;

    $scope.init = function() {
        $log.log("group init called");
        $http.get($location.url())
                .success(function(data, status, headers, config) {
            //$log.log("Received group info: " + angular.toJson(data));
            $scope.group = data;

            //$log.log("group: " + angular.toJson($scope.group));
        }).error(function(data, status, headers, config) {
            // redirect becuase there is no session
            $location.url('/');
        });
        var url = $location.url();
        console.log(angular.toJson(url));
    };

    $scope.calculateSquares = function() {
        //$log.log("calc squares");
        var numSquares = 0;
        if ($scope.name == null || $scope.email == null) {
            return;
        }
        for (var i = 0; i < $scope.group.squares.length; i++) {
            var square = $scope.group.squares[i];
            if (square.name === $scope.name && square.email === $scope.email) {
                numSquares++;
            }
        }
        $scope.squaresCount = numSquares;
        if ($scope.group.cost == null) {
            $scope.group.cost = 1;
        }
        $scope.squaresCost = numSquares * $scope.group.cost;
    }

    $scope.minimizedName = function(name) {
        if (name == null) {
            return "";
        }
        if (name.length > 12) {
            return name.substring(0, 8) + "...";
        } else {
            return name;
        }
    }

    $scope.squareClick = function(square) {
        if ($scope.name == null) {
            alert('Insert a name first');
            return;
        }
        if ($scope.email == null) {
            alert('Insert an email first');
            return;
        }
        if (square.owner == null || square.owner.name == null) {
            $log.log("adding name to square");
            square.owner = {name: $scope.name, email: $scope.email};
            $scope.squaresCount = $scope.squaresCount + 1;
            $scope.squaresCost = $scope.squaresCount * $scope.group.cost;
        } else {
            if (square.owner.name === $scope.name && square.owner.email === $scope.email) {
                square.owner = {};
                $scope.squaresCount = $scope.squaresCount - 1;
                $scope.squaresCost = $scope.squaresCount * $scope.group.cost;

            }
        }
    }



    $scope.userEmail = function() {
        var user = _.find($scope.group.users, function(mail) {
            if (mail === email) {
                return mail;
            }
        });
        if (_.isUndefined(user)) { // add this user to the model
            $scope.showUserInfo = true;
        }
        $log.log("Got this user " + user);
    }
});
