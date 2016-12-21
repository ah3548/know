**GOAL**: A person types a paragraph of a thesis and the system finds supporting documents as links, with full citations

## Steps
1. (ANALYZE STEP) Use Latent Dirichlet allocation to find underlying topics and branch on that
1. (LOAD STEP) Use Wikipedia Api (as a first example) for a source
1. (TRANSFORM STEP)
    * join words that frequently appear next to each other to not lose their associativity
    * remove stop words
1. (EXTRACT STEP)
    * use node-word2vec (underlying technology to google knowledge graph) to determine which information is most relevant and important
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

## Useful Links
[Installing Bash on Windows](
http://www.windowscentral.com/how-install-bash-shell-command-line-windows-10)
[Git Tutorial](https://www.atlassian.com/git/tutorials/what-is-version-control)
[word2vec](https://en.wikipedia.org/wiki/Word2vec)
