angular.module('goodVibrations', []);
angular.module('goodVibrations').config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);

angular.module('goodVibrations').controller('PageCtrl', ['$scope', function($scope) {
  $scope.hello = 'world';
}]);
