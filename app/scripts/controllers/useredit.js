'use strict';

/**
 * @ngdoc function
 * @name cpApp.controller:UsereditctrlCtrl
 * @description
 * # UsereditctrlCtrl
 * Controller of the cpApp
 */
angular.module('cpApp')
  .directive('convertToNumber', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
          ngModel.$parsers.push(function(val) {
            return parseInt(val, 10);
          });
          ngModel.$formatters.push(function(val) {
            return '' + val;
          });
        }
    };
  })
  .directive('positiveInteger', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$validators.integer = function(modelValue, viewValue) {
          var val = parseInt(viewValue, 10);
	  return (val > 0);
        };
      }
    };
  })
  .controller('UsereditCtrl', function ($scope, $filter, $uibModal, User, Organization, Country, Membership, Auth, GridData, notifications, $stateParams, $state, $q, FileReader) {

    var loadUser = function() {
      if (!$stateParams.id) { return {}; }
      return User.query({'id': $stateParams.id}).$promise
                .then(function(resp){
                    if (resp.birthdate) { resp.birthdate = new Date(resp.birthdate); }
                    return resp;
                  }, function(){});
    };

    var loadRoles = function(){
      return Membership.roles().$promise
                .then(function(resp){
                    return resp.membership_roles;
                  }, function(){});
    };

    var loadOrgs = function(){
      return Organization.query_list().$promise
                .then(function(resp){
                    return resp.organizations;
                  }, function(){});
    };

    var loadMemberships = function(){
      if (!$stateParams.id) { return [{}]; }
      return User.memberships({'id': $stateParams.id}).$promise
                .then(function(resp){
                    return resp.memberships;
                  }, function(){});
    };

    var loadCountries = function(){
      return Country.query_list().$promise
                .then(function(resp){
                    return resp.countries;
                  }, function(){});
    };

    var loadParallel = function() {
        return $q.all([ loadUser(), loadRoles(), loadOrgs(), loadCountries(), loadMemberships() ])
            .then( function( result ) {
              $scope.user          = result.shift();
              $scope.roles         = result.shift();
              $scope.organizations = result.shift();
              $scope.countries     = result.shift();
              $scope.memberships   = result.shift();
            }
        );
    };

    function _handle_upload_field(obj, key) {
      if (obj['delete_'+key]) { obj[key] = ''; } // delete checkbox is checked
      delete obj['delete_'+key]; // dont send checkbox value to server
      angular.element("input[type='file'][data-key='"+key+"']").val(null); // reset input field
    }

    // e.g.: if a phone number is deleted the value is set to the empty string
    // but the server expects { phone: null }
    function emptyToNull(obj) {
        Object.keys(obj).forEach(function(key) {
            if( obj[key] === '' ) { obj[key] = null; }
        });
    }

    $scope.save_membership = function(m) {
      _handle_upload_field(m,'coc');
      _handle_upload_field(m,'smime');

      // sms alert mobile validation
      if (m.sms_alerting && !m.mobile) {
        notifications.showError('mobile number is required if SMS Alerting is activated.');
        return;
      }

      if(m.id) {
        emptyToNull(m);
        Membership.update({'id':m.id}, m, function(resp) {
          notifications.showSuccess(resp);
        }, function(){});
      }
      else {
        Membership.create({}, m, function(resp) {
          m.id = resp.organization_membership.id;
          notifications.showSuccess(resp);
        }, function(){});
      }
    };

    $scope.create_user = function(){
      _handle_upload_field($scope.user,'picture');
      var data = { user: $scope.user, organization_membership: $scope.memberships[0] };
      User.create({}, data, function(resp){
        $state.go('user_edit', {id: resp.user.id});
        notifications.showSuccess('User created.');
      }, function(){});
    };

    $scope.update_user = function(){
      var u = $scope.user;
      _handle_upload_field(u,'picture');
      User.update({'id':u.id}, u, function(resp){
        notifications.showSuccess(resp);
      }, function(){});
    };

    $scope.delete_user = function(){
      if( window.confirm('Do you really want to delete this user?') ) {
        User.delete({'id':$scope.user.id}, function(resp){
          $state.go('user_list');
          notifications.showSuccess(resp);
        }, function(){});
      }
    };

    $scope.delete_membership = function(m_id, index){
      if( window.confirm('Do you really want to delete this membership?') ) {

        if (!m_id) {
          $scope.memberships.splice(index, 1);
        }
        else {
          // only delete if at least one membership exists on the server
          var count = 0;
          $scope.memberships.forEach(function(m) {
            if (m.id) { count++; }
          });
          if (count < 2) {
            notifications.showError('Cannot delete membership. A user needs at least 1 membership!');
            return;
          }

          Membership.delete({'id':m_id},
              function(resp){
                notifications.showSuccess(resp);
                $scope.memberships.splice(index, 1);
              }, function(){});

        }
      }
    };

    $scope.add_membership = function(){ $scope.memberships.push({ user_id: $scope.user.id }); };

    loadParallel();

    // adds an inputfile to the membership.
    // example: <input type="file" cp-file-select data-key="smime">
    // result: { ..., m.smime: "data:text/plain;base64,iVB... }
    $scope.getFile = function (file, inputscope, element) {
      FileReader.readAsDataUrl(file, $scope)
        .then(function (result) {
          var key = element.data('key');
          var obj;
          if (key === 'picture') {
            obj = inputscope.user;
            if ( file.size > 1024*1024 ) {
              notifications.showError('picture size exceeded 1MB');
              return;
            }
          }
          else {
            obj = inputscope.m;
          }
          obj[key] = result;
          obj[key+'_filename'] = file.name;
        });
    };

    $scope.deleteFile = function(obj, key) {
      if (window.confirm('Do you really want to delete this file?')) {
        obj[key]             = '';
        obj[key+'_filename'] = '';
      }
    };

    $scope.birthdate = {
      options: {
        startingDay: 1,
        showWeeks: false,
      },
      popup: { opened: false },
      open: function() { $scope.birthdate.popup.opened = true; }
    };

  });
