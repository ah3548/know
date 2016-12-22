**GOAL**: A person types a paragraph of a thesis and the system finds supporting documents as links, with full citations

## Steps
1. (ANALYZE STEP) Use Latent Dirichlet allocation to find underlying topics and branch on that
1. (LOAD STEP) Use Wikipedia Api (as a first example) for a source
1. (TRANSFORM STEP)
    * join words that frequently appear next to each other to not lose their associativity
    * remove stop words
1. (EXTRACT STEP)
    * use node-word2vec (underlying technology to google knowledge graph) to determine which information is most relevant and important

## Important Files
1. **index.html**: contains all web code. It uses [knockout](http://knockoutjs.com/) for data binding and [bootstrap](http://getbootstrap.com/) for styling.
1. **server.js**: contains code for [websockets](https://www.npmjs.com/package/websocket) and [webserver](http://expressjs.com/). Here you can service any received messages with functions you have defined in index.js.
1. **index.js**: contains all functional methods (including [lda](https://github.com/primaryobjects/lda) and [word2vec]()). You can defined new functions here and then [export](http://openmymind.net/2012/2/3/Node-Require-and-Exports/) them.
1. **package.json**: lists all dependencies managed by [npm](https://www.npmjs.com/)

## Important Functions
#### (found in index.js)
1. **getArticle**: gets article from wikipedia, or cached version on filesystem
1. **getSentences**: parses text into sentences and does some basic sanitization
1. **getLDA**: does lda topic analysis
1. **runW2VAndGetModel**: takes in corpus, returns model for further anaylsis
1. **getWord2VecModel**: reads in existing corpus model

## How to Run
```javascript
/* ssh into the linux proxy server */
ssh <nyu_id>@access.cim.nyu.edu

/* ssh into the hosting server */
ssh linserv2

/* Clone the project to your local directory (i.e. for example the server) */
git clone https://github.com/ah3548/know.git

/* 
Change to project directory
On linserv2 @ ~/public_html/know
*/
cd know

/* Install All Dependencies */
npm install

/* To run the server side code, will also host your web application */
node server 

/* view last 50 lines in log file */
watch tail -n 50 know-server.log
```

## How to Enhance
#### (outline of function ledge in server.js)
1. Run LDA (Here you can substitute you own analysis function to get a list of terms)
1. For each term in lda get wikipedia article (Here you can call your own datasource per term)
1. When all articles retrieved merge articles into 1 file for analysis (Here you can limit which articles to merge)
1. Run word2vec which removes stopwords and returns a model (Here you can run your own term relevance analysis)
1. Filter out terms with <= 0 similarity (Here you can choose your own threshold for filtering)
1. Filter articles for each term for sentences containing 2 similar terms. (Here you can return only sentences that match your own criteria)
1. Return to user in the same object format as specified in the client, for example index.html. (Here you can specify the format to return data to the user over the websocket)

## Case Study of How to Enhance
1. Instead of LDA I want to use TF/IDF to get list of terms
* Write a function in index.js that runs TF/IDF and returns a map of terms (call it tfidf)
* Call tfidf in server.js and use the map to pass to next part
1. Instead of Wikipedia I want to use Stack Overflow
* Write a function in index.js that queries Stack Overflow using a term and returns an article (call it getStackOverflow)
* Call getStackOverflow per term returned by tfidf
1. Instead of merging all the articles I only choose the ones with a length of greater than 10 sentences
* Write a function in index.js that merges the files only if article long enough (call it concatSelective)
* Call concatSelective on articles returned by every call to getStackOverflow
1. Instead of Word2Vec for relationship analysis, I use an ontology to define relationships
* Write a function in index.js that checks to see if two terms belong to the same category (call it isSimilarCategory)
* Call isSimilarCategory on corpus created by concatSelective
1. Instead of filtering on ranking similarity of word2vec, I use the fact that they are in the same category
* Write a filter function in server.js that filters the original articles based on this criteria
1. Instead of returning the entire sentence that matches the filter, I only want the first 20 words followed by ellipses
* Write a mapping function in server.js that against each sentence returned performs the transformation above

## Useful Links
1. [Installing Bash on Windows](
http://www.windowscentral.com/how-install-bash-shell-command-line-windows-10)
1. [Git Tutorial](https://www.atlassian.com/git/tutorials/what-is-version-control)
1. [word2vec](https://en.wikipedia.org/wiki/Word2vec)
