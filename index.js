/**
 * Created by Amir on 10/31/2016.
 */
var fs = require('fs'),
    cheerio = require('cheerio'),
    sw = require('stopword'),
    w2v = require('word2vec'),
    concat = require('concat-files'),
    lda = require('./nodelda'),
    moment = require('moment'),
    natural = require('natural');

var englishStopWords = require('stopword/lib/stopwords_en').words;
englishStopWords = englishStopWords.concat([
    'retrieved',
    'isbn',
    'archived',
    'original',
    'however',
    'officially'
]);
var months =  moment.months('MMMM').map((s) => { return String.prototype.toLowerCase.call(s)});
englishStopWords = englishStopWords.concat( months );

/* WIKIPEDIA */
function getWiki(page, onlySummary) {
    var request = require('request-promise-native'),
        urlparse = require('url'),
        params = {
            action: "query",
            titles: page.replace(/[-]/g, '_'),
            format: 'json',
            prop: 'extracts',
            explaintext: '',
            indexpageids: '',
            redirects: ''

        };
    if (onlySummary) {
        params.exintro ='';
    }
    var url = "http://en.wikipedia.org/w/api.php" + urlparse.format({ query: params });
    return request({
        uri: url,
        json: true
    }).then( (body) => {
        var article = body.query.pages[body.query.pageids[0]].extract;
        return article;
    });
}

function getArticleFromFile(fileName) {
    return new Promise( (resolve, reject) => {
        fs.readFile(fileName, 'utf8', (err, body) => {
            resolve(body);
        });
    });

};

function getWikiFilePath(onlySummary) {
    var path = 'articles/';
    if (onlySummary) {
        path = 'summaries/';
    }
    return path;
}
function getArticle(subject, onlySummary) {
    var fileName = getWikiFilePath(onlySummary) + subject;
    return new Promise((resolve, reject) => {
        fs.access(fileName, fs.constants.R_OK, (err) => {
            if (err) {
                return articleToTextFile(subject, onlySummary)
                        .then(getArticleFromFile)
                        .catch((err) => {
                                console.log(subject + ": " + err);
                                resolve();
                        })
                        .then(resolve);
            }
            else {
                return getArticleFromFile(getWikiFilePath(onlySummary) + subject).then(resolve);
            }
        })});
}

function articleToTextFile(subject, onlySummary) {
    return getWiki(subject, onlySummary)
        .then( (article) => {
            var filePath = getWikiFilePath(onlySummary) + subject;
            fs.writeFileSync( filePath, article);
            return filePath;
        });
}

/* W2Vec */

function getSentences(text) {
    text = text.replace(/\r\n{1}/g, ' '); // remove windows newlines
    text = text.replace(/[\n]/g,' '); // remove normal newlines
    text = text.replace(/[=]+[^=]+[=]+/g, ''); // remove headers
    text = text.replace(/[\s]{2,}/gi, ' '); // remove extra spaces

    /*text = text.replace(/\[\d\]/g, ' '); // remove references
    text = text.replace(/[0-9]+\.[0-9]+|[0-9]+/g,' '); // remove numbers
    text = text.replace(/[`°•~@#$%^&*()|+\=;:",<>\{\}\[\]\\\/]/gi, ' '); // remove special characters
    text = text.replace(/Main articles|Main article/gi, '');
    text = text.replace(/www/gi,'')*/
    //var documents = text.match( /[^\.!\?]+[\.!\?]+/g );
    var documents = text.match( /.*?(?:\.|!|\?)(?:(?= [A-Z0-9])|$)/g );
    return documents;
}

function removeSW(text) {
    var sentences = getSentences(text);
    sentences.forEach( (sent, id, obj) => {
        var words = sent.trim().split(' ');
        words.forEach( (word, i, o) => {
            if (word.trim()) {
                o[i] = word.trim();
            }
            if (o[i] && (o[i].length <= 3 || o[i].length > 50)) {
                o[i] = '';
            }
        });
        words = words.filter( (value) => {
            return value !== '';
        } );
        obj[id] = sw.removeStopwords(words, englishStopWords).join(' ');
    });
    sentences = sentences.filter( (value) => {
        return value !== '' && value.split(' ').length > 2; // remove empty and short sentences
    } );
    return sentences;
}

function removeSWFromFile(inputFile) {
    var output = 'w2vfiles/step1.txt';
    return getArticleFromFile(inputFile)
        .then((text) => {
            text = removeSW(text).join(' ');
            fs.writeFile(output, text);
            return output;
        })
}

function runWord2VecPhases(input) {
    var output = "step2.txt";
    return new Promise( function(resolve, reject) {
            w2v.word2phrase(input, 'w2vfiles/' + output, {silent:true}, () => {
                fs.readFile('w2vfiles/' + output, 'utf8', function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                    var result = data.toLowerCase();

                    fs.writeFile('w2vfiles/' + output, result, 'utf8', function (err) {
                        if (err) return console.log(err);
                    });
                });
                resolve('w2vfiles/' + output);
            });
        }
    );
}

function runWord2Vec(inputFileName,outputFileName) {
    var input = 'w2vfiles/step2.txt', output = 'w2vfiles/step3.txt';
    if (inputFileName != null) {
        input = inputFileName;
    }
    if (outputFileName != null) {
        output = outputFileName;
    }
    return new Promise( function(resolve, reject) {
            w2v.word2vec(input, output, {silent:true}, () => {
                resolve(output);
            });
        }
    );
}

function getWord2VecModel(fileName) {
    var input = 'w2vfiles/step3.txt';
    if (fileName != null) {
        input = fileName;
    }
    return new Promise( (resolve, reject) => {
        w2v.loadModel(input, (error,model) => {
            resolve(model);
        });
    });
};

function runW2VAndGetModel(inputFile, subject) {
    return removeSWFromFile(inputFile)
                .then(runWord2VecPhases)
                .then((inputFile) => {
                    return runWord2Vec(inputFile, 'w2vfiles/' + subject + '-w2v.txt');
                })
                .then(getWord2VecModel);
}

function getMostSimilar(model, subject, num) {
    return model.mostSimilar(subject,num);
}

/* W2V COMPARISON */
function compareTwoArticles(subjects, onlySummaryForFirst) {
    return new Promise((resolve, reject) => {
        var fName = 'corpus.txt';
        articleToTextFile(subjects[0], onlySummaryForFirst)
            .then((firstFileName) => {
                articleToTextFile(subjects[1]).then((secondFileName) => {
                    concat([firstFileName, secondFileName], 'w2vfiles/' + fName, runAlg);
                });
            });

        var runAlg = () => {
            return runW2VAndGetModel(fName, subjects[0])
                .then((model) => {
                    var result = model.similarity(subjects[0], subjects[1])
                    console.log(result);
                    resolve();
                });
        }
    });
}


/* LDA */
function getLDA(text, numTopics, numTerms) {
    var sent = removeSW(text);
    var alphaValue = null, betaValue = null;
    if (numTopics === undefined) {
        numTopics = 1;
    }
    if (numTerms === undefined) {
        numTerms = 5;
    }
    return lda(sent, numTopics, numTerms, null, alphaValue, betaValue, null);
}

function printLDA(result) {
    for (var i in result) {
        var row = result[i];
        console.log('Topic ' + (parseInt(i) + 1));

        // For each term.
        for (var j in row) {
            var term = row[j];
            console.log(term.term + ' (' + term.probability + '%)');
        }

        console.log('');
    }
}

function getTerms(result, subject) {
    var map = {};
    for (var i in result) {
        var row = result[i], addToMap = false, localMap = {};
        for (var j in row) {
            if (row[j].term === subject.toLowerCase()) {
                addToMap = true;
            }
            localMap[row[j].term] = true;
        }
        if (addToMap) {
            Object.assign(map, localMap);
        }
    }
    return map;
}

function getLDAForSubjects(subjects, print) {
    var ldas = [];
    return getArticle(subjects[0])
        .then( (text) => {
            ldas[0] = getLDA(text);
            if (print) {
                printLDA(ldas[0]);
            }
            return subjects[1];
        })
        .then(getArticle)
        .then( (text) => {
            ldas[1] = getLDA(text);
            if (print) {
                printLDA(ldas[1]);
            }
            return ldas;
        });
}

/* TF-IDF */
function getTFIDF(text, numTopics) {
    var TfIdf = natural.TfIdf, tfidf = new TfIdf();
    var thesis = removeSW(text).join(' ');
    tfidf.addDocument(thesis);
    return tfidf.listTerms(0).splice(0,numTopics);
}


var relatedSubjects = [
    'Azerbaijan',
    'Russia'
];

var semiRelatedSubjects = [
    'Azerbaijan',
    'Baku'
];

var unrelatedSubjects = [
    'Azerbaijan',
    'Algebra'
];

function getArticleWithSubject(subject) {
    return getArticle(subject).then((body) => {
        return {
            body: body,
            subject: subject
        }
    })
}

function ledge (subject, thesis) {
    /*getTFIDF(thesis, 20).forEach(function(item) {
        console.log(item.term + ': ' + item.tfidf);
    });*/

    var map = null, promises = [], result = getLDA(thesis, 5, 5);
    printLDA(result);
    map = getTerms(result, subject);
    for (key in map) {
        promises.push(getArticle(key));
    }
    return Promise.all(promises)
        .then(() => {
            return new Promise((resolve, reject) => {
                var filePaths = Object.keys(map).map((value) => {
                    return getWikiFilePath(false) + value;
                });
                concat(filePaths, 'w2vfiles/' + subject + '-corpus', resolve);
            })
            .then(() => {
                return 'w2vfiles/' + subject + '-corpus';
            })
        })
        .then((fName) => {
            //return getWord2VecModel('w2vfiles/' + subject + '-w2v.txt');
            return runW2VAndGetModel(fName, subject);
        })
        .then((model) => {
            var similarities = {};
            for (key in map) {
                similarities[key] = model.similarity(subject.toLowerCase(), key);
                if (similarities[key] == null) {
                    delete similarities[key];
                }
            }
            //console.log(similarities);
            var promises = [];
            for (key in similarities) {
                var prom = getArticleWithSubject(key).then((result) => {
                    var sentences = getSentences(result.body);
                    var related = [];
                    if (sentences && sentences.length > 0) {
                        related = sentences.filter((value) => {
                            if (value.toLowerCase().includes(subject.toLowerCase())) {
                                return true;
                            }
                        });
                    }

                    /*if (related && related.length > 0) {
                        console.log(result.subject + ": " + related);
                    }*/
                    return {
                        subject: result.subject,
                        sentences: related ? related : []
                    };
                });
                promises.push(prom);
            }

            return Promise.all(promises).then((values) => {
                return values;
            })
        });
}


/*compareTwoArticles(relatedSubjects, true) // 0.998
   .then( () => {
            compareTwoArticles(semiRelatedSubjects) // 0.183
                .then ( () => {
                    compareTwoArticles(unrelatedSubjects); // -0.005
                });
    });*/

//getLDAForSubjects(relatedSubjects, true);

module.exports = {
    articleToTextFile,
    getArticle,
    getSentences,
    ledge
};
