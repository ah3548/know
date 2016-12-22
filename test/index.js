var expect = require("chai").expect, index = require("../index");

describe("index", function() {
    describe.only("getArticleFromWiki", function() {
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

    describe("getSentences", function() {
        var thesis = 'The civil war was waged between two opposing groups, Irish republicans and Irish nationalists, over the Anglo-Irish Treaty. The forces of the Provisional Government (which became the Free State in December 1922) supported the Treaty, while the Republican opposition saw it as a betrayal of the Irish Republic (which had been proclaimed during the Easter Rising). Many of those who fought in the conflict had been members of the Irish Republican Army (IRA) during the War of Independence.';
        it("thesis", function() {
            console.log(index.getSentences(thesis));
        });
    });

    describe("getArticle.getSentences", function() {
        it("1991", function() {
            return index.getArticle('1991')
                .then( (article) => {
                    console.log(index.getSentences(article));
                })
        });
    });

    describe("getLDA", function() {
        var thesis = 'The thesis will analyze the involvement and role of the EU in the conflict in Nagorno-Karabakh. It will begin with a summary of the history of the conflict, noting that the Nagorno-Karabakh conflict has its own special historical background. The South Caucasus, including the territory of Azerbaijan and Nagorno-Karabakh as integral parts, has been through ethnic and demographic change due to the process of the disintegration of the USSR, followed by ethnic conflicts in the country akin to civil war, and finally the beginnings of territorial problems associated with its status as a post-Soviet state. All of these influences have affected the demography and geopolitics of the wider region. However, these problems did not come from nowhere and they have a historical background, for example the conflict between Armenia and Azerbaijan that emerged after territorial claims by Armenia on the territory of Nagorno-Karabakh.';
        it("thesis", function() {
            var LDA = index.getLDA(thesis);
            console.log(LDA);
            return LDA;
        });
        var subject = 'Ireland Civil War';
        it("subject", function() {
            var LDA = index.getLDA(subject);
            console.log(LDA);
            return LDA;
        });
    });

    describe("getSubjects", function() {
        var subject = 'Ireland Civil War';
        it("thesis", function() {
            var subjects = index.getSubjects(subject);
            console.log(subjects);
            return subjects;
        });
    });

    describe("getSubjects", function() {
        var subject = 'Irish Civil War';
        it("thesis", function() {
            var subjects = index.getSubjects(subject);
            console.log(subjects);
            return subjects;
        });
    });

    /*describe.only("ledge", function() {
        var subject = 'Irish Civil War';
        var thesis = 'The civil war was waged between two opposing groups, Irish republicans and Irish nationalists, over the Anglo-Irish Treaty. The forces of the Provisional Government (which became the Free State in December 1922) supported the Treaty, while the Republican opposition saw it as a betrayal of the Irish Republic (which had been proclaimed during the Easter Rising). Many of those who fought in the conflict had been members of the Irish Republican Army (IRA) during the War of Independence.';
        it("Irish Civil War thesis", function() {
            return index.ledge(subject, thesis)
                .then((result) => {
                    console.log(result);
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    });*/
});
