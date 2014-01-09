'use strict';

sbsquaresApp.controller('GroupsCtrl', function($scope, $http, $location, $log) {

    $scope.group = null;
    $scope.email = null;
    $scope.name = null;
    $scope.cost = null;
    $scope.adminPassword = null;
    $scope.squaresCount = 0;
    $scope.squaresCost = 0;

    $scope.showUserInfo = false;
    $scope.showAlert = false;
    $scope.pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

    $scope.init = function() {
        // $log.log("group init called");
        $http.get($location.url())
                .success(function(data, status, headers, config) {
            //$log.log("Received group info: " + angular.toJson(data));
            $scope.group = data;
            // $log.log("square 0" + angular.toJson($scope.group.squares[0]));
            // if there are no admins create one
            if (_.isUndefined($scope.group.cost)) {
                $('#adminPanel').modal('show');
            }
            //$log.log("group: " + angular.toJson($scope.group));
        }).error(function(data, status, headers, config) {
            // redirect becuase there is no session
            $location.url('/');
        });
        var url = $location.url();
        // console.log(angular.toJson(url));
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

    $scope.minimizedName = function(square) {
        if (square.owner == null || square.owner.length == 0) {
            return;
        }
        var name = square.owner[0].name;
        if (name == null | name === "") {
            return "";
        }
        // $log.log("min name called");
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
        
        if(square.owner && square.owner[0]){
            if(square.owner[0].name !== $scope.name){
                alert("You cannot change someone else's square. Please select another");
                return;
            } else if(square.owner[0].name === $scope.name){
                $log.log("Clearing square");
                    square.owner = [];      
                    $scope.squaresCount = $scope.squaresCount - 1;
                    $scope.squaresCost = $scope.squaresCount * $scope.group.cost;
            }else {
                $log.log("uhhh, how am I here");
            }
        } else {
            square.owner = [{name: $scope.name, email: $scope.email}];
            $scope.squaresCount = $scope.squaresCount + 1;
            $scope.squaresCost = $scope.squaresCount * $scope.group.cost;
            $http.post('/updateSquare', square)
                .error(function(err) {
                    $log.log("error saving square: " + err);
                });
        }
//        if (square.owner == null || square.owner.name == null) {
//            // $log.log("adding name to square");
//            square.owner = [{name: $scope.name, email: $scope.email}];
//            $scope.squaresCount = $scope.squaresCount + 1;
//            $scope.squaresCost = $scope.squaresCount * $scope.group.cost;
//        } else {
//            if (square.owner != null && square.owner.length > 0) {
//                if (square.owner[0].name === $scope.name && square.owner[0].email === $scope.email) {
//                    square.owner = {};
//                    $scope.squaresCount = $scope.squaresCount - 1;
//                    $scope.squaresCost = $scope.squaresCount * $scope.group.cost;
//
//                }
//
//            }
//        }
    }

    $scope.submitSquares = function() {
        $http.post("/updateGroup", $scope.group).success(function(data, status, headers, config) {
            $http.get($location.url())
                    .success(function(data, status, headers, config) {
                //$log.log("Received group info: " + angular.toJson(data));
                $scope.group = data;
                $scope.showAlert = true;
                // if there are no admins create one
                if (_.isUndefined($scope.group.cost)) {
                    $('#adminPanel').modal('show');
                }
                //$log.log("group: " + angular.toJson($scope.group));
            }).error(function(data, status, headers, config) {
                // redirect becuase there is no session
                $location.url('/');
            });
        }).error(function(data, status, headers, config) {

        });
    }

    $scope.saveAdmin = function() {
        $http.post('/saveAdmin', {cost: $scope.cost})
                .success(function(data, status, headers, config) {
            $http.get($location.url())
                    .success(function(data, status, headers, config) {
                //$log.log("Received group info: " + angular.toJson(data));
                $scope.group = data;
                // if there are no admins create one
                if (_.isUndefined($scope.group.cost)) {
                    $('#adminPanel').modal('show');
                }
                //$log.log("group: " + angular.toJson($scope.group));
            }).error(function(data, status, headers, config) {
                // redirect becuase there is no session
                $location.url('/');
            });
            $('#adminPanel').modal('hide');
        })
                .error(function(data, status, headers, config) {
            // $log.log("Couldn't save admin info!");
            $location.url('/');
        });
    };
});
