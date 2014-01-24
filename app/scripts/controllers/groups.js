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
                    $log.log("Received group info: " + angular.toJson(data, true));
                    $scope.group = data;
                    // $log.log("square 0" + angular.toJson($scope.group.squares[0]));
                    // if there are no admins create one
                    if (_.isUndefined($scope.group.cost)) {
                        $('#groupInfo').addClass('hide');
                        $('#adminPanel').removeClass('hide');
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
        $log.log("minimizing: "+angular.toJson(square));
        
        if(!square.name){
            return;
        }
        if (square.name.length === 0) {
            return;
        }
        
        // $log.log("min name called");
        if (square.name.length > 12) {
            return square.name.substring(0, 8) + "...";
        } else {
            $log.log("returning something: "+square.name);
            return square.name;
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

        if (square.name) {
            if (square.name !== $scope.name) {
                alert("You cannot change someone else's square. Please select another");
                return;
            } else if (square.name === $scope.name) {
                $log.log("Clearing square");
                $http.post('/removeOwner', {groupId: $scope.group.groupId, x: square.x, y: square.y})
                        .error(function(err) {
                            $log.log("error removing square");
                        });
                square.name = null;
                $scope.squaresCount = $scope.squaresCount - 1;
                $scope.squaresCost = $scope.squaresCount * $scope.group.cost;
            } else {
                $log.log("uhhh, how am I here");
            }
        } else {
            square.name = $scope.name;
            square.email = $scope.email;
            $scope.squaresCount = $scope.squaresCount + 1;
            $scope.squaresCost = $scope.squaresCount * $scope.group.cost;
            $http.post('/updateSquare', {groupId: $scope.group.groupId, x: square.x, y: square.y, "name": square.name, "email": square.email})
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
                            $('#adminPanel').removeClass('hide');
                            $('#groupInfo').addClass('hide');
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
                                    $('#groupInfo').addClass('hide');
                                    $('#adminPanel').removeClass('hide');
                                }
                                //$log.log("group: " + angular.toJson($scope.group));
                            }).error(function(data, status, headers, config) {
                        // redirect becuase there is no session
                        $location.url('/');
                    });
                    $('#groupInfo').removeClass('hide');
                    $('#adminPanel').addClass('hide');
                })
                .error(function(data, status, headers, config) {
                    // $log.log("Couldn't save admin info!");
                    $location.url('/');
                });
    };
});
