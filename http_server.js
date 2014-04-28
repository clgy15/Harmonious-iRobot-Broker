var express = require('express');

var port = 3000;
var app = express();

app.use(express.static(__dirname + '/app'));

var io = require('socket.io').listen(app.listen(port));

var start_function;
var start_function_called = false;

var update_settings_function;

// Setting Function:
//   {
//      syncopation: false,
//      octave_freq: 50,
//      third_freq: 50,
//      fifth_freq: 50,
//      seventh_freq: 50
//   }
//
//

// $scope.robots.push({
//   ip: info.ip,
//   notes: [],
//   state: 0   <- 0 = Connection, 1 = Waiting, 2 = Listening, 3 = Playing
// });

var state = {
  beatCount: 8,
  tempo: 120,
  maxLoops: 5,
  patternNotes: [],
  started: false,
  robots: [],
  octave_freq: 50,
  third_freq: 50,
  fifth_freq: 50,
  seventh_freq: 50,
  syncopation: false
};

io.sockets.on('connection', function(socket) {
  socket.emit('connect', state);
  socket.on('setup', function(data) {
    console.log(data);
    if (!start_function_called) {
      state.tempo = data.tempo;
      state.maxLoops = data.maxLoops;
      state.started = true;
      state.patternNotes = data.notes;
      data.system_initialized = false;

      start_function(data);
      start_function_called = true;
    } else {
      state.tempo = data.tempo;
      state.maxLoops = data.maxLoops;
      state.patternNotes = data.notes;
      data.system_initialized = true;

      start_function(data);
    }
  });

  socket.on('settings', function(data) {
    console.log(data);
    update_settings_function(data);

    state.octave_freq = data.octave_freq;
    state.third_freq = data.third_freq;
    state.fifth_freq = data.fifth_freq;
    state.seventh_freq = data.seventh_freq;
    state.syncopation = data.syncopation;
  });
});

exports.startFunction = function(fnc) {
  start_function = fnc;
}

exports.settingsFunction = function(fnc) {
  update_settings_function = fnc;
}

exports.setBeatLength = function(length) {
  state.beatCount = length;
}

/*
 * Adds a new robot to the UI
 * Call when a new robot connection is created
 */
exports.addRobot = function(ip) {
  io.sockets.emit('newRobot', {
    ip: ip
  });

  state.robots.push({
    ip: ip,
    notes: [],
    state: 0
  });
};

/*
 * Sets the musical pattern for a robot
 * Call when a robot sends its pattern to the broker
 */
exports.setRobotPattern = function(ip, notes, durations) {
  var combinedNotes = [];
  notes.forEach(function(note, index) {
    combinedNotes.push({
      pitch: note,
      duration: durations[index]
    });
  });

  io.sockets.emit('setRobotPattern', {
    ip: ip,
    notes: combinedNotes
  });

  for (var i = 0; i < state.robots.length; i++) {
    if (state.robots[i].ip == ip) {
      state.robots[i].notes = combinedNotes;
      state.robots[i].state = 3;
      break;
    }
  }
  //state.robots[state.robots.indexOf(ip)]
};

/*
 * Clears the musical pattern for a robot
 * Call when a robot sends a stop playing signal to the broker
 */
exports.clearRobotPattern = function(ip) {
  io.sockets.emit('clearRobotPattern', {
    ip: ip
  });

  for (var i = 0; i < state.robots.length; i++) {
    if (state.robots[i].ip == ip) {
      state.robots[i].notes = [];
      state.robots[i].state = 0;
      break;
    }
  }
};

/*
 * Removes a robot completely from the UI.
 * Call when a connection to a robot is lost.
 */
exports.removeRobot = function(ip) {
  io.sockets.emit('removeRobot', {
    ip: ip
  });
  for (var i = 0; i < state.robots.length; i++) {
    if (state.robots[i].ip == ip) {
      state.robots.splice(i,1);
      break;
    }
  }
};

exports.robotWaiting = function(ip) {
  io.sockets.emit('waitingRobot', {
    ip: ip
  });
  for (var i = 0; i < state.robots.length; i++) {
    if (state.robots[i].ip == ip) {
      state.robots[i].state = 1;
      break;
    }
  }
};

exports.robotListening = function(ip) {
  io.sockets.emit('listeningRobot', {
    ip: ip
  });
  for (var i = 0; i < state.robots.length; i++) {
    if (state.robots[i].ip == ip) {
      state.robots[i].state = 2;
      break;
    }
  }
};

// Call when a loop is sent to the robots
exports.loop = function(beat_ms_time) {
  console.log("loop to http server");
  io.sockets.emit('loop', {
    beatTime: beat_ms_time
  });
};

exports.setState = function(state) {
  state = state;
};
