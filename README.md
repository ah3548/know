**GOAL**: A person types a paragraph of a thesis and the system finds supporting documents as links, with full citations
 
1. (LOAD STEP) Use Wikipedia Api (as a first example) for a source
2. (TRANSFORM STEP)
    a) remove stop words
    b) join words that frequently appear next to each other to not lose their associativity
3. (EXTRACT STEP)
    a) use node-word2vec (underlying technology to google knowledge graph) to determine which information is most relevant and important
    b) use Latent Dirichlet allocation to find underlying topics and branch on that
4. Crawl N levels to increase corpus for analysis
5. Repeat 1-3 stack overflow
6. Enhance results with data gathered from opencyc


/* 
- Instructions for installing bash on your windows machine 
http://www.windowscentral.com/how-install-bash-shell-command-line-windows-10
- Git Tutorial
https://www.atlassian.com/git/tutorials/what-is-version-control
- Word2 Vec
https://en.wikipedia.org/wiki/Word2vec
*/

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