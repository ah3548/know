var expect = require("chai").expect;
var index = require("../index");

describe("index", function() {
    describe("getArticleFromWiki", function() {
        it("religious", function() {
            return index.articleToTextFile('religious', false)
                .then((result) => {
                    console.log(result);
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    });

    describe.only("getArticle.getSentences", function() {
        it("1991", function() {
            return index.getArticle('1991')
                .then( (article) => {
                    console.log(index.getSentences(article));
                })
        });
    });
});