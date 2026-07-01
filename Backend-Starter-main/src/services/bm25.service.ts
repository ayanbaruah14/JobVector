export class BM25 {
    private documents: string[][] = [];
    private termFrequencies: Map<string, number>[] = [];
    private documentLengths: number[] = [];
    private averageDocumentLength: number = 0;
    private documentFrequencies: Map<string, number> = new Map();
    private totalDocuments: number = 0;
    
    private readonly k1: number = 1.5;
    private readonly b: number = 0.75;

    constructor(corpus: string[]) {
        this.totalDocuments = corpus.length;
        let totalLength = 0;

        for (let i = 0; i < corpus.length; i++) {
            const tokens = this.tokenize(corpus[i] || "");
            this.documents.push(tokens);
            this.documentLengths.push(tokens.length);
            totalLength += tokens.length;

            const termFreq = new Map<string, number>();
            const uniqueTerms = new Set<string>();

            for (const token of tokens) {
                termFreq.set(token, (termFreq.get(token) || 0) + 1);
                uniqueTerms.add(token);
            }

            this.termFrequencies.push(termFreq);

            for (const term of uniqueTerms) {
                this.documentFrequencies.set(term, (this.documentFrequencies.get(term) || 0) + 1);
            }
        }

        this.averageDocumentLength = this.totalDocuments > 0 ? totalLength / this.totalDocuments : 0;
    }

    private tokenize(text: string): string[] {
        if (!text) return [];
        // Convert to lowercase and split by non-alphanumeric characters, keeping words and common tech tokens (like c++, c#, .net) intact
        const sanitized = text.toLowerCase().replace(/[^a-z0-9+#.\-]/g, ' ');
        return sanitized.split(/\s+/).filter(token => token.length > 0);
    }

    private calculateIDF(term: string): number {
        const df = this.documentFrequencies.get(term) || 0;
        // Standard Okapi BM25 IDF formula
        return Math.log(1 + (this.totalDocuments - df + 0.5) / (df + 0.5));
    }

    public search(query: string): number[] {
        const queryTokens = this.tokenize(query);
        const scores: number[] = new Array(this.totalDocuments).fill(0);

        if (this.totalDocuments === 0 || queryTokens.length === 0) {
            return scores;
        }

        for (const queryToken of queryTokens) {
            const idf = this.calculateIDF(queryToken);
            if (idf <= 0) continue; // Skip terms that are too common

            for (let i = 0; i < this.totalDocuments; i++) {
                const docFreq = this.termFrequencies[i]?.get(queryToken) || 0;
                if (docFreq === 0) continue;

                const docLength = this.documentLengths[i] || 0;
                const numerator = docFreq * (this.k1 + 1);
                const denominator = docFreq + this.k1 * (1 - this.b + this.b * (docLength / this.averageDocumentLength));
                
                scores[i] = (scores[i] || 0) + idf * (numerator / denominator);
            }
        }

        return scores;
    }
}
