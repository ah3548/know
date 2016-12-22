var wordnet = require('wordnet'),
    express = require('express'),
    know = require('./index'), // This file contains all custom functions (i.e. LDA, word2vec, etc)
    server = require('websocket').server,
    http = require('http'),
    winston = require('winston'),
    concat = require('concat-files');

winston.add(winston.transports.File, { filename: 'know.log' });
winston.remove(winston.transports.Console);

/* Web Server */
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
    /*
    know.getLDA returns the results of LDA.
    Here you can substitute any sort of function to do analysis.
     */
    var subject = 'Unknown', map = null, promises = [], result = know.getLDA(thesis, 4, 5);
    connection.send(JSON.stringify({
        type: 'LDA',
        LDA: know.getLDATopics(result)
    }));
    /*
    This function returns the list of subjects to analyze.
    Here you can substitute any map (list of unique properties) to do analysis on.
     */
    map = know.getLDASubjects(result);
    for (var key in map) {
        /*
        know.getArticle returns a promise that one can wait to resolve.
        When the promise resolves you either have gotten the article from wikipedia or cached version on the filesystem.
        Here you can substitute any data source request, and write the data to a file for further analysis.
         */
        promises.push(know.getArticle(key));
    }
    return Promise.all(promises)
        .then(() => {
        /*
        This block of code generates the corpus to analyze by aggregating all files fetched by your data source requests.
         */
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
        /*
        This function takes the filename generated from the last part and runs word2vec to generate a model to query against.
         */
            //return know.getWord2VecModel('w2vfiles/step2.txt-w2v.txt');
            return know.runW2VAndGetModel(fName);
        })
        .then((model) => {
        /*
        This block is to use the results from the Word2Vec Analysis to limit the data being returned to the website.
        Steps
        1. For each pair of keys returned from LDA make a list of combinations
        2. For each combination get a similarity score
        3. Filter the list for only positive similarities
        4. Sort the list with highest similarity in the beginning
         */
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
                /*
                This block takes the original article and filters the text for sentences containing terms with high similarity.
                Here you can substitute your own filtering technique of the original corpus.
                 */
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
                            sentences: related ? related : [],
                            url: know.getUrlForTerm(result.subject)
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

        /*
        This is the main function. You can substitute your own function that uses the connection to send data.
         */
        ledge(messageObj.thesis, connection);

    });
});

