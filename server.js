var express = require('express');
var path = require ('path');
var mongoose = require('mongoose');
var Bing = require('node-bing-api')({ accKey: "51f5ca5af5d746268180bcbc545d4e92" });
var router = express.Router();

// Setup and connect to mongoDB
var mongourl = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
mongoose.Promise = global.Promise;
mongoose.connect(mongourl);

// Initialize app
var app = express();

app.use(router);

// Create DB Schema
var recentSchema = mongoose.Schema({
  phrase: String,
  timestamp: String
});
recentSchema.index({ timestamp: 1 });
var Recent = mongoose.model('Recent', recentSchema);

// Define routes
app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/:query', function(req, res){
  var query = req.params.query;
  var offset = req.query.offset || 10;
  var timestamp = new Date().toLocaleString();

  Bing.images(query, { top: offset, skip: 0 }, function(error, results, body){
    if (error) {
      res.status(500).json(error);
    } else {
      res.status(200).json(body.value.map(getData));
    }
  });
  var store = new Recent ({
    phrase: query,
    timestamp: timestamp });
  store.save();
});

router.get('/latest', function(req, res){
  Recent
    .find()
    .select({ _id: 1, phrase: 1, timestamp: 1 })
    .sort( {timestamp: -1 })
    .limit(10)
    .then(function(results){
      res.status(200).json(results);
    });
});

function getData(image){
  return{
      url: image.webSearchUrl,
      title: image.name,
      thumbnail: image.thumbnailUrl,
      source: image.hostPageUrl,
      type: image.encodingFormat
  }
}


var port = process.env.PORT || 3000;
app.listen (port, function(){
  console.log('Server listening on port '+ port)
});
