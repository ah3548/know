/**
 * Created by Amir on 10/31/2016.
 */
var fs = require('fs'),
    cheerio = require('cheerio'),
    wikiE = require('./wiki-extract'),
    sw = require('stopword'),
    w2v = require('word2vec');

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

function runWord2VecPharses(input) {
    return new Promise( function(resolve, reject) {
            w2v.word2phrase(input, "w2vecP.txt", {}, resolve);
        }
    );
}

function runWord2Vec() {
    var input = 'w2vecP.txt', output = 'w2vecModel.txt';
    return new Promise( function(resolve, reject) {
            w2v.word2vec(input, output, {}, resolve);
        }
    );
}

var globalModel = null;
function getWord2VecModel() {
    var input = './w2vecModel.txt';
    return new Promise( (resolve, reject) => {
        w2v.loadModel(input, (error,model) => {
            globalModel = model;
            resolve();
        });
    });
};

function getMostSimilar(subject, num) {
    globalModel.mostSimilar(subject,num);
}

function getSentences(text) {
    var documents = text.match( /[^\.!\?]+[\.!\?]+/g );
    return documents;
}


var subject = 'Azerbaijan',
    inputFile = 'w2vecP.txt',
    outputFile = 'sentences.txt';

getArticleFromFile(inputFile)
    .then(function (text) {
        var sentences = getSentences(text);
        sentences.forEach( (sent, id, obj) => {
            obj[id] = sw.removeStopwords(sent.split(' ')).join(' ');
});
        fs.writeFile(outputFile, sentences);
    });

