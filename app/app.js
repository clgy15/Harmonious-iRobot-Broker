/*
To DO:
   1: Enter & Tab Key Functionality

*/

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

angular.module('goodVibrations').directive('noteSelect', [function() {
  return {
    restrict: 'E',
    scope: {
      noteOptions: '=',
      note: '=ngModel'
    },
    controller: function($scope) {
      $scope.currentIndex = 0;
      $scope.note = $scope.noteOptions[$scope.currentIndex];

      $scope.nextNoteOption = function() {
        if ($scope.currentIndex >= $scope.noteOptions.length - 1) {
          $scope.currentIndex = 0;
        } else {
          $scope.currentIndex++;
        }
        $scope.note = $scope.noteOptions[$scope.currentIndex];
      };

      $scope.prevNoteOption = function() {
        if ($scope.currentIndex <= 0) {
          $scope.currentIndex = $scope.noteOptions.length - 1;
        } else {
          $scope.currentIndex--;
        }
        $scope.note = $scope.noteOptions[$scope.currentIndex];
      };
    },
    replace: true,
    template: '<div class="note-select"><div class="left-toggle" ng-click="prevNoteOption()">&lt;</div><div class="note-display"><object type="image/svg+xml" width="50px" height="100px" data="{{note.path}}" /></div><div class="right-toggle" ng-click="nextNoteOption()">&gt;</div></div>'
  };
}]);

angular.module('goodVibrations').directive('note', [function() {
  return {
    restrict: 'E',
    scope: {
      url: '@',
      startBeat: '@',
      currentBeat: '=',
      duration: '@'
    },
    link: function(scope, elem, attrs) {
      scope.active = false;
      scope.$watch('currentBeat', function(newVal, oldVal) {
        if (!scope.active && scope.currentBeat >= scope.startBeat && scope.currentBeat < parseInt(scope.startBeat, 10) + parseInt(scope.duration, 10)) {
          var svgDoc = elem[0].getSVGDocument();
          if (svgDoc !== null) {
            var noteElem = angular.element(svgDoc.getElementById("svg-note"));
            noteElem.addClass("playing");
            scope.active = true;
          }
        } else if(scope.active && (scope.currentBeat < scope.startBeat || scope.currentBeat >= parseInt(scope.startBeat, 10) + parseInt(scope.duration, 10))) {
          var svgDoc = elem[0].getSVGDocument();
          if (svgDoc !== null) {
            var noteElem = angular.element(svgDoc.getElementById("svg-note"));
            noteElem.removeClass("playing");
            scope.active = false;
          }
        }
      });
    },
    replace: true,
    template: '<object type="image/svg+xml" width="50px" height="100px" data="{{url}}"></object>'
  }
}]);

angular.module('goodVibrations').controller('PageCtrl', ['$scope', 'socket', function($scope, socket) {
  socket.on('connect', function(data) {
    console.log("got", data);
  });

  $scope.getNoteName = function(pitch) {
    if (pitch === 0) {
      return "N/A"
    } else {
      var note = "";
      var octave = "";
      var notes = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
      return notes[pitch % 12] + (pitch / 12 >> 0);
    }
  };

  $scope.getNoteImage = function(duration, pitch) {
    if (pitch === 0) {
      switch (duration) {
      case 1:
        return "/icons/eighth_rest.svg";
        break;
      }
    } else {
      switch (duration) {
      case 1:
        return "/icons/eighth_note.svg";
        break;
      case 2:
        return "/icons/quarter_note.svg";
        break;
      case 3:
        return "/icons/dotted_quarter_note.svg";
        break;
      case 4:
        return "/icons/half_note.svg";
        break;
      case 6:
        return "/icons/dotted_half_note.svg";
        break;
      }
    }
  };
}]);

angular.module('goodVibrations').controller('UserParamsCtrl', ['$scope', 'socket', function($scope, socket) {
  $scope.beatCount = 8;
  $scope.tempo = 120;
  $scope.maxLoops = 4;
  $scope.notes = [];

  $scope.noteType = $scope.notes[0];
  $scope.pitch = 68;

  $scope.noteTypes = [
    {
      name: "Eighth Note",
      duration: 1,
      path: "/icons/eighth_note.svg",
      isRest: false
    }, {
      name: "Quarter Note",
      duration: 2,
      path: "/icons/quarter_note.svg",
      isRest: false
    }, {
      name: "Dotted Quarter Note",
      duration: 3,
      path: "/icons/dotted_quarter_note.svg"
    }, {
      name: "Half Note",
      duration: 4,
      path: "/icons/half_note.svg",
      isRest: false
    }, {
      name: "Dotted Half Note",
      duration: 6,
      path: "/icons/dotted_half_note.svg"
    }, {
      name: "Rest",
      duration: 1,
      path: "/icons/eighth_rest.svg",
      isRest: true
    }
  ];

  $scope.addNote = function(type, pitch) {
    if (type.duration + $scope.patternLength() <= $scope.beatCount) {
      if (type.isRest) {
        $scope.notes.push({
          duration: type.duration,
          pitch: 0
        });
      } else {
        $scope.notes.push({
          duration: type.duration,
          pitch: pitch
        });
      }
    } else {
      console.log("Max pattern length exceeded");
    }
  };

  $scope.patternLength = function() {
    var totalLength = 0;
    $scope.notes.forEach(function(note) {
      totalLength += note.duration;
    });
    return totalLength;
  };

  $scope.started = false;

  $scope.start = function() {
    console.log($scope.beatCount);
    console.log(((64 * 60) / $scope.tempo) >> 0);
    console.log($scope.maxLoops);
    console.log($scope.notes);
    if(!$scope.started) {
      socket.emit('setup', {
        beatCount: $scope.beatCount,
        duration: ((64 * 60) / $scope.tempo) >> 0,
        maxLoops: $scope.maxLoops,
        notes: $scope.notes
      });
      $scope.started = true;
    }
  };

  $scope.start_happy = function() {
    if(!$scope.started) {
      socket.emit('setup', {
        beatCount: 33,
        duration: 12,
        maxLoops: 5,
        notes: [ { duration: 1, pitch: 0 },
                 { duration: 1, pitch: 48 },
                 { duration: 2, pitch: 48 },
                 { duration: 2, pitch: 51 },
                 { duration: 2, pitch: 60 },
                 { duration: 1, pitch: 65 },
                 { duration: 1, pitch: 65 },
                 { duration: 1, pitch: 65 },
                 { duration: 2, pitch: 65 },
                 { duration: 2, pitch: 65 },
                 { duration: 2, pitch: 65 },
                 { duration: 1, pitch: 65 },
                 { duration: 2, pitch: 65 },
                 { duration: 1, pitch: 65 },
                 { duration: 1, pitch: 63 },
                 { duration: 2, pitch: 65 },
                 { duration: 2, pitch: 65 },
                 { duration: 2, pitch: 65 },
                 { duration: 1, pitch: 63 },
                 { duration: 4, pitch: 65 } ]
      });
      $scope.started = true;
    }
  };
}]);

angular.module('goodVibrations').controller('RobotsCtrl', ["$scope", "socket", function($scope, socket) {
  $scope.robots = [];
  $scope.beat = -1;

  socket.on('newRobot', function(info) {
    var notification = new Notification('New Robot Detected', {
      body: info.ip
    });
    $scope.$apply(function() {
      $scope.robots.push({
        ip: info.ip,
        notes: [],
        active: false
      });
    });
  });

  socket.on('setRobotPattern', function(info) {
    $scope.robots.forEach(function(robot) {
      if (robot.ip === info.ip) {
        $scope.$apply(function() {
          robot.notes = [];
          info.notes.forEach(function(note) {
            if (note.pitch != 1) {
              robot.notes.push(note);
            }
          })
          //robot.notes = info.notes;
          robot.active = true;
        });
      }
    });
  });

  socket.on('clearRobotPattern', function(info) {
    $scope.robots.forEach(function(robot) {
      if (robot.ip === info.ip) {
        $scope.$apply(function() {
          robot.notes = [];
          robot.active = false;
        });
      }
    });
  });

  socket.on('removeRobot', function(info) {
    $scope.robots.forEach(function(robot, index) {
      if (robot.ip === info.ip) {
        $scope.$apply(function() {
          $scope.robots.splice(index, 1);
        });
      }
    });
  });

  socket.on('beat', function() {
    console.log("beat")
    $scope.$apply(function() {
      if ($scope.beat >= 0) {
        $scope.beat++;
      }
    });
  });

  socket.on('loop', function() {
    console.log("loop");
    $scope.$apply(function() {
      $scope.beat = 0;
    });
  });
}]);

angular.module('goodVibrations').controller('RobotCtrl', ["$scope", function($scope) {
  $scope.startBeat = function(index) {
    var beatSum = 0;
    for (var i = 0; i < index; i++) {
      beatSum += $scope.robot.notes[i].duration;
    }
    return beatSum;
  };
}]);
