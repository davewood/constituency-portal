'use strict';

/**
 * @ngdoc function
 * @name cpApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the cpApp
 */
angular.module('cpApp')
  .controller('LoginCtrl', function ($scope, $location, $state, $stateParams, Auth, notify, $rootScope) {
    $scope.credentials = {email: '', password: ''};
    $scope.login = function () {
      Auth.login($scope.credentials).then(function (response) {
        if(response.headers('cp-totp-required') === 'True'){
          $state.go('two-factor');
        }else{
          $rootScope.username = $scope.credentials.email;
          $state.go('organization_list');
        }
      }, function(){});
    };
    $scope.verifyTOTP = function(){
      Auth.post($scope.credentials, 'verify-totp').then(function(){
        $state.go('organization_list');
      });
    };

    $scope.lost_password = function () {
      Auth.lost_password({email: $scope.email})
                .then(function(resp){
                    notify({classes: 'notify-success', message: resp.data.message});
                  }, function(){});
    };

    if ($stateParams.token) {
        $scope.token = $stateParams.token;
    }
    $scope.activate_account = function() {
        Auth.activate_account($scope.token, $scope.password);
    };
  });
