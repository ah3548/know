/**
 * Created by Amir on 10/31/2016.
 */
var fs = require('fs'),
    cheerio = require('cheerio'),
    wikiE = require('./wiki-extract'),
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

var subject = 'Azerbaijan',
    inputFile = 'w2vecP.txt',
    outputFile = 'word2vec.txt';

//getArticle(subject)
//getArticleFromFile(inputFile)
//    .then(wikiE.extractText)
//runWord2VecPharses(inputFile)
//runWord2VecPharses(inputFile)
 /*   .then((body) => {
        fs.writeFile(outputFile, body);
    });*/

 runWord2Vec()
     .then(getWord2VecModel)
     .then( () => {
        console.log(
            globalModel.mostSimilar(subject,20)
        );
     });

