var express = require('express')

var app = express();

app.use(express.static(__dirname + '/app'));

exports.run = function(port) {
  app.listen(port, function() {
    console.log('HTTP Server listening on port ' + port);
  });
};
