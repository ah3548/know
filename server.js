var wordnet = require('wordnet'),
    express = require('express'),
    know = require('./index'),
    server = require('websocket').server,
    http = require('http'),
    winston = require('winston'),
    concat = require('concat-files');

winston.add(winston.transports.File, { filename: 'know.log' });
winston.remove(winston.transports.Console);

var app = express();
app.use(express.static('./'))

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});


function ledge (thesis, connection) {
    var subject = 'Unknown', map = null, promises = [], result = know.getLDA(thesis, 4, 5);
    connection.send(JSON.stringify({
        type: 'LDA',
        LDA: know.getLDATopics(result)
    }));
    map = know.getLDASubjects(result);
    for (var key in map) {
        promises.push(know.getArticle(key));
    }
    return Promise.all(promises)
        .then(() => { // Generate Corpus
            return new Promise((resolve, reject) => {
                var filePaths = Object.keys(map).map((value) => {
                    return 'articles/' + value;
                });
                concat(filePaths, 'w2vfiles/' + subject + '-corpus', resolve);
            })
            .then(() => {
                return 'w2vfiles/' + subject + '-corpus';
            })
        })
        .then((fName) => {
            return know.runW2VAndGetModel(fName);
        })
        .then((model) => {
            var keys = Object.keys(map);
            var combOfKeys = know.getCombinations(keys);
            var graph = [];
            combOfKeys.forEach((myKeys) => {
                graph.push({
                    node1: myKeys[0],
                    node2: myKeys[1],
                    sim: model.similarity(myKeys[0],myKeys[1])
                })
            });
            graph = graph.filter( (obj) => {
                if (obj.sim && obj.sim > 0) {
                    return true;
                }
                return false;
            })
            graph = graph.sort( (obj1, obj2) => {
                if (obj1.sim < obj2.sim) {
                    return -1;
                }
                else if (obj1.sim > obj2.sim) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            connection.send(JSON.stringify({
                'type': 'graph',
                'graph': graph
            }));
            var promises = [];
            for (var key in map) {
                var prom = know.getArticleWithSubject(key).then((result) => {
                    if (result.body) {
                        var sentences = know.getSentences(result.body);
                        var related = [];
                        if (sentences && sentences.length > 0) {
                            related = sentences.filter((value) => {
                                var count = 0;
                                graph.forEach((obj) => {
                                    if (value.toLowerCase().includes(obj.node1) &&
                                        value.toLowerCase().includes(obj.node2)) {
                                        count++;
                                    }
                                });
                                if (count > 0) {
                                    return true;
                                }
                                return false;
                            });
                        }
                        return {
                            subject: result.subject,
                            sentences: related ? related : []
                        };
                    }
                });
                promises.push(prom);
            }

            return Promise.all(promises).then((values) => {
                connection.send(JSON.stringify({
                    type: 'values',
                    values: values
                }));
            })
        });
}

var socket = new server({
    httpServer: http.createServer().listen(19909)
   
});

var connection = null;
socket.on('request', function(request) {
    connection = request.accept(null, request.origin);
    connection.on('message', function(message) {
        var messageObj = JSON.parse(message.utf8Data);
        console.log(messageObj);
        console.log("info", messageObj.subject + ": " + messageObj.thesis);
        connection.send(JSON.stringify(messageObj.subject));
        ledge(messageObj.thesis, connection);
        /*know.ledge(message.subject, message.thesis)
            .then( (result) => {
                    connection.send(JSON.stringify(result));
                }
            );*/
    });
});

