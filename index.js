/**
 * Created by Amir on 10/31/2016.
 */
var fs = require('fs'),
    cheerio = require('cheerio'),
    wikiE = require('./wiki-extract'),
    sw = require('stopword'),
    w2v = require('word2vec'),
    concat = require('concat-files'),
    lda = require('lda');

var englishStopWords = require('stopword/lib/stopwords_en').words;
englishStopWords = englishStopWords.concat([
    'retrieved'
]);

var results = {
    subject1: {
        title: '',
        lda: ''
    },
    subject2: {
        title: '',
        lda: ''
    },
    similarity: 0
};

var queries = []; // list of results

/* WIKIPEDIA */
function getArticle(page) {
    var request = require('request-promise-native'),
        urlparse = require('url'),
        params = {
            action: "parse",
            page: page,
            prop: "text",
            format: 'json',
            redirect: true,
            noimages: true,
            disabletoc: true,
            disableeditsection: true,
            disablelimitreport: true
        },
        url = "http://en.wikipedia.org/w/api.php" + urlparse.format({ query: params });
        console.log(url);

        return request({
            uri: url,
            json: true
        }).then( (body) => {
            var article = body.parse.text['*'];
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

function sanitizeArticle(article) {
    var f = require('html-flatten/build/flatten-html');
    f = new Flatten();
    return f.flattenItem(article);
}

function articleToTextFile(subject) {
    return getArticle(subject).then( (article) => {
        var text = wikiE.extractText(article);
        fs.writeFile(subject + '.txt', text);
        return subject + '.txt';
    })
}

/* W2Vec */

function getSentences(text) {
    text = text.replace(/\r\n{1}/g, ' ');
    text = text.replace(/[^\w\s\.?!_]/g,'');
    var documents = text.match( /[^\.!\?]+[\.!\?]+/g );
    return documents;
}

function removeSW(text) {
    var sentences = getSentences(text);
    sentences.forEach( (sent, id, obj) => {
        var words = sent.replace(/[\,\(\)\n0-9]/g, ' ').trim().split(' ');
        words.forEach( (word, i, o) => {
            if (word.trim()) {
                o[i] = word.trim();
            }
            if (o[i] && o[i].length < 3) {
                o[i] = '';
            }
        });
        words = words.filter( (value) => { return value !== ''; } );
        obj[id] = sw.removeStopwords(words, englishStopWords).join(' ');
    });
    sentences = sentences.filter( (value) => { return value !== ''; } );
    return sentences;
}

function removeSWFromFile(inputFile) {
    var output = "w2vStep1.txt";
    return getArticleFromFile(inputFile)
        .then((text) => {
            text = removeSW(text).join(' ');
            fs.writeFile(output, text);
            return output;
        })
}

function runWord2VecPhases(input) {
    var output = "w2vStep2.txt";
    return new Promise( function(resolve, reject) {
            w2v.word2phrase(input, output, {}, () => {
                resolve(output);
            });
        }
    );
}

function runWord2Vec(inputFileName,outputFileName) {
    var input = "w2vStep2.txt", output = "w2vStep3.txt";
    if (inputFileName != null) {
        input = './' + inputFileName;
    }
    if (outputFileName != null) {
        output = './' + outputFileName;
    }
    return new Promise( function(resolve, reject) {
            w2v.word2vec(input, output, {}, () => {
                resolve(output);
            });
        }
    );
}

function getWord2VecModel(fileName) {
    var input = "w2vStep3.txt";
    if (fileName != null) {
        input = './' + fileName;
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
                    return runWord2Vec(inputFile, subject + '-w2v.txt');
                })
                .then(getWord2VecModel);
}

function getMostSimilar(model, subject, num) {
    return model.mostSimilar(subject,num);
}

/* W2V COMPARISON */
function compareTwoArticles(subjects) {
    return new Promise((resolve, reject) => {
        var fName = 'corpus.txt';
        articleToTextFile(subjects[0])
            .then((firstFileName) => {
                articleToTextFile(subjects[1]).then((secondFileName) => {
                    concat([firstFileName, secondFileName], fName, runAlg);
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
function getLDA(text) {
    var sent = removeSW(text);
    return lda(sent, 2, 3);
}

function getLDAForSubjects(subjects) {
    var ldas = [];
    return getArticle(subjects[0])
        .then(wikiE.extractText)
        .then( (text) => {
            ldas[0] = getLDA(text);
            return subjects[1];
        })
        .then(getArticle)
        .then(wikiE.extractText)
        .then( (text) => {
            ldas[1] = getLDA(text);
            return ldas;
        });
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

/*compareTwoArticles(relatedSubjects) // 0.998
    .then( () => {
            compareTwoArticles(semiRelatedSubjects) // 0.183
                .then ( () => {
                    compareTwoArticles(unrelatedSubjects); // -0.005
                });
    });*/

getLDAForSubjects(relatedSubjects)
    .then( (ldas) => {
        console.log(JSON.stringify(ldas));
    });



