import fs from "fs/promises";
import path from "path";
import pkg from "natural";
import { removeStopwords } from "stopword";
import { fileURLToPath } from "url";

const { TfIdf } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function preprocess(text) {
  return removeStopwords(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
  ).join(" ");
}

async function buildIndex() {
  try {
    console.log("Loading corpus...");
    const corpusPath = path.join(__dirname, "corpus/all_problems.json");
    const data = await fs.readFile(corpusPath, "utf-8");
    const problems = JSON.parse(data);
    console.log(`Loaded ${problems.length} problems`);

    console.log("Building TF-IDF index...");
    const tfidf = new TfIdf();

    problems.forEach((problem, idx) => {
      const text = preprocess(
        `${problem.title ?? ""} ${problem.title ?? ""} ${problem.description ?? ""}`
      );
      tfidf.addDocument(text, idx.toString());
    });

    console.log("Computing document vectors...");
    const docVectors = [];
    const docMagnitudes = [];

    problems.forEach((_, idx) => {
      const vector = {};
      let sumSquares = 0;

      tfidf.listTerms(idx).forEach(({ term, tfidf: weight }) => {
        vector[term] = weight;
        sumSquares += weight * weight;
      });

      docVectors[idx] = vector;
      docMagnitudes[idx] = Math.sqrt(sumSquares);
    });

    const indexData = {
      problems,
      docVectors,
      docMagnitudes,
      timestamp: new Date().toISOString(),
    };

    const outputPath = path.join(__dirname, "netlify/functions/index-data.json");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(indexData));

    console.log(`✓ Index built and saved to ${outputPath}`);
    console.log(
      `  - Problems: ${problems.length}`
    );
    console.log(
      `  - Doc vectors: ${docVectors.length}`
    );
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

buildIndex();
