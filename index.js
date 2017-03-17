var express = require('express');
var fetchUrl = require('fetch').fetchUrl;
var nunjucks = require('nunjucks');

var app = express();

app.get('/', function (req, res) {
  res.send('Q1. did you supply a quiz id in your URL?');
});

app.get('/:id', function (req, res) {
    //get that bertha spreadsheet (id e.g. 10IF5-QsauRkFBtPYNl7mtfA2kHAn-n9C8SSO5VJjwI8)
    fetchUrl(`http://bertha.ig.ft.com/republish/publish/ig/${req.params.id}/basic`, function(error, meta, body){
        console.log('rendering' + req.params.id);
        res.send( nunjucks.render('index.html', JSON.parse( body )) );
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
})