angular.module('goodVibrations', []);
angular.module('goodVibrations').config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);

angular.module('goodVibrations').service('socket', [function() {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function(data) {
        callback(data);
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data);
    }
  };
}]);

angular.module('goodVibrations').controller('PageCtrl', ['$scope', 'socket', function($scope, socket) {
  socket.on('connect', function(data) {
    console.log("got", data);
  });
}]);

angular.module('goodVibrations').controller('UserParamsCtrl', ['$scope', 'socket', function($scope, socket) {
  $scope.beatCount = 8;
  $scope.tempo = 120;
  $scope.maxLoops = 4;
  $scope.notes = [];
  $scope.durations = [];

  $scope.started = false;

  $scope.start = function() {
    if(!$scope.started) {
      socket.emit('setup', {
        beatCount: $scope.beatCount,
        duration: ((64 * 60) / $scope.tempo) >> 0,
        maxLoops: $scope.maxLoops,
        notes: $scope.notes,
        durations: $scope.durations
      });
      $scope.started = true;
    }
  };
}]);
