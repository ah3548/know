var wordnet = require('wordnet'),
    know = require('./index'),
    server = require('websocket').server,
    http = require('http'),
    winston = require('winston');

winston.add(winston.transports.File, { filename: 'know.log' });
winston.remove(winston.transports.Console);

/*var app = express();

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/', function (req, res) {

    res.send(JSON.stringify(test));
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});*/


function ledge (thesis, connection) {
    var map = null, promises = [], result = know.getLDA(thesis, 5, 5);
    map = know.getLDASubjects(result);
    var subject = 'Unknown';
    for (var key in map) {
        promises.push(know.getArticle(key));
    }
    return Promise.all(promises)
        .then(() => {
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
            var similarities = {};
            for (var key1 in map) {
                for (var key2 in map) {
                    if (key1 != key2) {
                        var sim = model.similarity(key1, key2);
                        if (sim && similarities[key1]) {
                            if (sim > similarities[key1]) {
                                similarities[key1] = sim;
                            }
                        }
                        else {
                            if (sim) {
                                similarities[key1] = sim;
                            }
                        }
                    }
                }
                if (similarities[key1] == null) {
                    delete similarities[key1];
                }
            }
            connection.send({
                'type': 'similarities',
                'similarities': similarities
            });
            var promises = [];
            for (var key in similarities) {
                var prom = know.getArticleWithSubject(key).then((result) => {
                    if (result.body) {
                        var sentences = know.getSentences(result.body);
                        var related = [];
                        if (sentences && sentences.length > 0) {
                            related = sentences.filter((value) => {
                                if (value.toLowerCase().includes(subject.toLowerCase())) {
                                    return true;
                                }
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
                connection.send({
                    type: 'values',
                    values: values
                });
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

