var cheerio = require('cheerio'),
    htt = require('html-to-text');
//natural = require('natural');


function removeComments(body) {
    var $ = cheerio.load(body);

    $.root()
        .contents()
        .filter(function() {
            return this.type === 'comment';
        })
        .remove();

    return $.root().html();
}

function removeMetaData(body) {
    var $ = cheerio.load(body);

    $.root()
        .contents()
        .filter(function() {
            var c = $(this).attr('class');
            if (c != undefined) {
                return isMetaDataClass(c);
            }
            else {
                return false;
            }
        })
        .remove();

    $('sup').remove();

    return $.root().html();
}

function linkToCallback(body) {
    var $ = cheerio.load(body);
    $('a').each(
        function(i, element) {
            var href = $(this).attr('href');
            $(this).attr('href',"#Guides");
            //$(this).attr('ng-href',"#");
            $(this).attr("ng-click","appIntercept(\"" + href + "\")");
        }
    )
    return $.root().html();
}

function isMetaDataClass(c) {
    var metaData = false;
    var metaClasses = [
        'infobox',
        'toc',
        'navbox',
        'reflist',
        'hatnote',
        'thumb',
        'm-box',
        'metadata'
    ];
    metaClasses.forEach(
        function(entry) {
            if (c.indexOf(entry) != -1) {
                metaData = true;
            }
        }

    );

    return metaData;
}

function getAllLinks(body) {
    $ = cheerio.load(body);
    links = $('a'); //jquery get all hyperlinks
    var result = [];
    $(links).each(function(i, link){
        var t = $(link).text(),
            l = $(link).attr('href');
        if (l.indexOf('/wiki/') != -1 &&
            t !== 'ISBN' &&
            t != '') {
            result.push(
                {title:t, link:l}
            );
        }
    });
    return result;
}

function extractText(body) {
    var text = htt.fromString(body, {
        wordwrap: 130,
        ignoreHref: true,
        ignoreImage: true,
        preserveNewlines: true
    });
    return text;
}

function removeReferences(body) {
    $ = cheerio.load(body);

    var badWord="External_links";

    $('h2')
        .filter(isBadRef).remove();

    $('div')
        .filter(isBadId).remove();

    return $.root().html();
}

var badSections = [
    "External_links",
    "Further_reading",
    "Notes",
    "References",
    "See_also"
];

function isBadRef() {
    var ref = $(this).attr('href');
    for (var i = 0; i < badSections.length; i++) {
        if (ref === '#' + badSections[i]) {
            return true;
        }
    }
}

function isBadId() {
    var id = $(this).attr('id');
    for (var i = 0; i < badSections.length; i++) {
        if (id === badSections[i]) {
            return true;
        }
    }
}

/* Come back to at later point, not relevant right now */
/*
 function getImportance(body, word) {
 var TfIdf = natural.TfIdf,
 tfidf = new TfIdf();

 tfidf.addDocument(body);
 tfidf.tfidfs('Bhubaneswar, India', function(i, measure) {
 console.log('document #' + i + ' is ' + measure);
 });
 tfidf.listTerms(0).forEach(function(item) {
 console.log(item.term + ': ' + item.tfidf);
 });
 }*/

/*orm.getWikiEntry('Bud_Mishra')
 .then(removeComments)
 .then(removeMetaData)
 .then(extractText)
 .then(content => console.log(content));*/


/*orm.getWikiEntry('Linear_Algebra')
 .then(removeComments)
 .then(removeMetaData)
 .then(removeEditLinks)
 .then(removeReferences)
 .then(content => {
 console.log(content);
 });*/

module.exports = {
    extractText,
    removeMetaData,
    linkToCallback,
    getAllLinks,
    removeReferences
}