var express = require('express');
var fetchUrl = require('fetch').fetchUrl;
var nunjucks = require('nunjucks');
var lru = require('lru-cache');
var mappingsURL = 'http://bertha.ig.ft.com/view/publish/gss/1ZtEKq3aZXdzV0WCt0u0hm0OR1jz_eWzsnHmJ_GyIJ7s/mapping';
var cacheOptions = { 
    max: 500, 
    length: function (n, key) { return n * 2 + key.length }, 
    dispose: function (key, n) { n.close() }, 
    maxAge: 1000 * 60 * 60 
};
var cache = lru(cacheOptions);
var app = express();
var port = (process.env.PORT || 3000)

var berthakeys = {};

fetchUrl(mappingsURL, function(error, meta, body){
    berthakeys = JSON.parse(body).reduce(function(lookup,current){
        lookup[current.uuid] = current.google;
        return lookup;
    },{});
});

app.get('/', function (req, res) {
    res.status(404)
        .send('<h1>Q1. Did you supply a UUID in your URL?</h1>');
});

app.get('/:id', function (req, res) {
    var uuid = req.params.id;
    var frame = 'false';
    if(req.query.frame){
        frame = req.query.frame;
        console.log(frame);
    }
    var berthaID = berthakeys[uuid];
    if(berthaID){
        var cached = cache.get(String(frame) + berthaID);
        if(cached) {
            res.send( cached ); 
        } else {
            fetchUrl(`http://bertha.ig.ft.com/republish/publish/ig/${berthaID}/basic`, function(error, meta, body){
                var data = JSON.parse( body );
                if(data.credits){
                    data.credits.people = [];
                    data.credits.sources = [];
                    data.credits.forEach(function(d){
                        if(d.type === 'credit'){
                            data.credits.people.push({ name:d.name, url:d.url,});
                        }
                        else if(d.type === 'source'){
                            data.credits.sources.push({ name:d.name, url:d.url,})
                        }else if(d.type === 'date'){
                            data.credits.date = d.name;
                        }
                    });
                }
                if(data.options === undefined) data.options = {};
                data.uuid = uuid;
                data.options.frame = frame;
                if(data.options.headerimage){
                    data.options.imageServiceURL = `https://www.ft.com/__origami/service/image/v2/images/raw/ftcms%3A${data.options.headerimage}?source=ig&width=675&height=380`
                }
                var html = nunjucks.render('templates/index.html', data);
                cache.set(String(frame) + berthaID, html);
                res.send( html );
            });
        }
    }else{
        res.status(404)
            .send('<h1>Q1. Did you supply a valid UUID your URL?</h1>');
    }
});

app.listen(port , function () {
    console.log('Quiz app on port: '+ port +' !');
})