**GOAL**: Summarized data excerpt with cited sources

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

