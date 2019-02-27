'use strict';

/**
 * @ngdoc function
 * @name cpApp.controller:UserListCtrl
 * @description
 * # UserListCtrl
 * List Controller of the cpApp
 */

function _array2hash(arr) {
    if(!arr) {return {};}
    var hash = {};
    arr.forEach(function(i) { hash[i.id] = i; });
    return hash;
}

angular.module('cpApp')
  .controller('UserListCtrl', function ($scope, $filter, $uibModal, User, Membership, Organization, Auth, GridData, $q, uiGridConstants) {

    var loadUsers = function() {
      return User.query_list().$promise
                .then(function(resp){
                    return resp.users;
                  }, function(){});
    };

    var loadMemberships = function(){
      return Membership.query().$promise
                .then(function(resp){
                    return resp.organization_memberships;
                  }, function(){});
    };

    var loadRoles = function(){
      return Membership.roles().$promise
                .then(function(resp){
                    return resp.membership_roles;
                  }, function(){});
    };

    var loadOrganizations = function(){
      return Organization.query_list().$promise
                .then(function(resp){
                    return resp.organizations;
                  }, function(){});
    };

    var loadParallel = function() {
        return $q.all([ loadUsers(), loadMemberships(), loadRoles(), loadOrganizations() ])
            .then( function( result ) {
              $scope.users         = _array2hash(result.shift());
              $scope.memberships   = result.shift();
              $scope.roles         = result.shift();
              $scope.organizations = _array2hash(result.shift());

              $scope.memberships.forEach(function(m) {
                var u = $scope.users[m.user_id];
                if (!u.hasOwnProperty('memberships')) {
                  u.memberships = [];
                }
                u.memberships.push(m);

                if (!u.hasOwnProperty('organizations')) {
                  u.organizations = [];
                }
                u.organizations[m.organization_id] = $scope.organizations[m.organization_id];
              });

              // prepare grid data
              var memberships = [];
              var users_arr = [];
              for (var key in $scope.users) {
                if ($scope.users.hasOwnProperty(key)) {
                  users_arr.push($scope.users[key]);
                }
              }
              var roles = _array2hash($scope.roles);
              users_arr.forEach(function(u) {
                u.memberships.forEach(function(m) {
                  memberships.push({
                     id: u.id,
                     name: u.name,
                     organization_id: m.organization_id,
                     organization: $scope.organizations[m.organization_id].full_name,
                     role: roles[m.membership_role_id].display_name,
                     email: m.email,
                     phone: m.phone,
                     mobile: m.mobile,
                     street: m.street,
                     zip: m.zip,
                     city: m.city
                    }
                  );
                });
              });
              $scope.gridOptions.data = memberships;
              var roleOptions = [];
              $scope.roles.forEach(function(r){
                roleOptions.push({value: r.display_name, label: r.display_name});
              });
              $scope.roleColumnDef.filter.selectOptions = roleOptions.sort(function(a,b){
		var nameA = a.label.toUpperCase();
		var nameB = b.label.toUpperCase();
		if (nameA < nameB) { return -1; }
		if (nameA > nameB) { return 1; }
		return 0;
              });
            }
        );
    };

    loadParallel();
    $scope.roleColumnDef = {
           name: 'role',
           filter: {
                   type: uiGridConstants.filter.SELECT,
                   condition: uiGridConstants.filter.EXACT,
                   selectOptions: []
           }
    };

    $scope.gridOptions = {
        enableFiltering: true,
        enableGridMenu: true,
        exporterMenuPdf: false,
        exporterMenuExcel: false,
        exporterCsvFilename: 'users.csv',
        columnDefs: [
          { field: 'id', visible: false },
          { field: 'name',
            cellTemplate: '<div class="ui-grid-cell-contents"><a ui-sref="user_edit({id:row.entity.id})">{{row.entity.name}}</a></div>',
          },
          { field: 'organization_id', visible: false },
          { field: 'organization',
            cellTemplate: '<div class="ui-grid-cell-contents"><a ui-sref="organizations({id:row.entity.organization_id})">{{row.entity.organization}}</a></div>',
          },
          $scope.roleColumnDef,
          { field: 'email' },
          { field: 'phone' },
          { field: 'mobile' },
          { field: 'street' },
          { field: 'zip' },
          { field: 'city' },
        ],
        onRegisterApi: function(gridApi) {
          $scope.gridApi = gridApi;

          // resize grid table height according to visible rows
          $scope.$watch(
              function() { return $scope.gridApi.core.getVisibleRows().length; },
              function(newValue) {
                  var scrollbarWidth = 15;
                  var headerHeight   = 55;
                  var rowHeight      = 30;
                  $scope.gridHeight  = (newValue * rowHeight + headerHeight + scrollbarWidth) + 'px';
              }
          );
        }
    };
  });
