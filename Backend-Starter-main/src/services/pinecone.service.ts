import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "",
});

const indexName = process.env.PINECONE_INDEX_NAME || "trivalent-rag";
const index = pinecone.Index(indexName);

export class PineconeService {
    /**
     * Upserts a candidate's vector embedding into Pinecone.
     * @param userId The MongoDB _id of the user
     * @param vector The vector embedding array (e.g., from Gemini or OpenAI)
     */
    static async upsertVector(id: string, vector: number[], metadata: any = { type: "candidate" }): Promise<void> {
        try {
            await index.upsert({
                records: [{
                    id: id,
                    values: vector,
                    metadata: metadata
                }]
            });
            console.log(`Successfully upserted vector for id ${id}`);
        } catch (error) {
            console.error(`Error upserting vector for id ${id}:`, error);
        }
    }

    /**
     * Searches for the closest matching vectors.
     * @param queryVector The vector embedding of the search query
     * @param topK Number of results to return
     * @param filter Optional metadata filter (e.g. { type: { $eq: "job" } })
     * @returns Array of matching IDs
     */
    static async searchVectors(queryVector: number[], topK: number = 5, filter: any = { type: { $eq: "candidate" } }): Promise<string[]> {
        try {
            const queryResponse = await index.query({
                vector: queryVector,
                topK: topK,
                includeMetadata: true,
                filter: filter
            });

            return queryResponse.matches.map(match => match.id);
        } catch (error) {
            console.error("Error querying Pinecone:", error);
            return [];
        }
    }
}
