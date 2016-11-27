var expect    = require("chai").expect;
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
});