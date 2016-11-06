/**
 * Created by Amir on 10/31/2016.
 */
var fs = require('fs'),
    cheerio = require('cheerio'),
    wikiE = require('./wiki-extract'),
    sw = require('stopword'),
    w2v = require('word2vec');

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
        obj[id] = sw.removeStopwords(sent.split(' ')).join(' ');
    });
    return sentences;
}

function runWord2VecPhases(input) {
    var output = "w2vStep1.txt";
    return new Promise( function(resolve, reject) {
            w2v.word2phrase(input, output, {}, () => {
                resolve(output);
            });
        }
    );
}

function removeSWFromFile(inputFile) {
    var output = "w2vecStep2.txt";
    return getArticleFromFile(inputFile)
        .then((text) => {
            text = removeSW(text);
            fs.writeFile(output, text);
            return "woSW" + inputFile;
        })
}

function runWord2Vec(inputFileName,outputFileName) {
    var input = "w2vStep1.txt", output = "w2vStep2.txt";
    if (inputFileName != null) {
        input = './' + inputFileName;
    }
    else if (outputFileName != null) {
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
    var input = "w2vStep2.txt";
    if (fileName != null) {
        input = './' + fileName;
    }
    return new Promise( (resolve, reject) => {
        w2v.loadModel(input, (error,model) => {
            resolve(model);
        });
    });
};

function runW2VAndGetModel(inputFile) {
    return removeSWFromFile(inputFile)
                .then(runWord2VecPhases)
                .then(runWord2Vec)
                .then(getWord2VecModel);
}

function getMostSimilar(model, subject, num) {
    return model.mostSimilar(subject,num);
}

var subject = 'Azerbaijan',
    inputFile = 'sample3.html',
    outputFile = 'sentences.txt';

runW2VAndGetModel(inputFile)
//getWord2VecModel('w2vStep2.txt')
    .then((model) => {
        var result = getMostSimilar(model, subject, 20);
        console.log(result);
    });

