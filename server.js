var express = require('express'),
    wordnet = require('wordnet'),
    know = require('./index');

var app = express();

app.get('/', function (req, res) {
    know.ledge().then( (result) => {
        res.send(result);
    })
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});