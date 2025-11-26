import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "natural";
import { removeStopwords } from "stopword";

const { TfIdf } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let problems = [];
let tfidf = new TfIdf();
let docVectors = [];
let docMagnitudes = [];
let isInitialized = false;

function preprocess(text) {
  return removeStopwords(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
  ).join(" ");
}

async function loadProblemsAndBuildIndex() {
  if (isInitialized) {
    return;
  }

  try {
    const corpusPath = path.join(__dirname, "../../corpus/all_problems.json");
    const data = await fs.readFile(corpusPath, "utf-8");
    problems = JSON.parse(data);
  } catch (err) {
    console.error("Failed to load corpus", err);
    throw err;
  }

  tfidf = new TfIdf();

  problems.forEach((problem, idx) => {
    const text = preprocess(
      `${problem.title ?? ""} ${problem.title ?? ""} ${problem.description ?? ""}`
    );
    tfidf.addDocument(text, idx.toString());
  });

  docVectors = [];
  docMagnitudes = [];
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

  isInitialized = true;
}

export const handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    await loadProblemsAndBuildIndex();

    const body = JSON.parse(event.body);
    const rawQuery = body.query;
    const sortOrder = body.sort;
    const page = Math.max(1, parseInt(body.page) || 1);
    const perPage = Math.max(1, parseInt(body.perPage) || 10);

    if (!rawQuery || typeof rawQuery !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing or invalid 'query'" }),
      };
    }

    const query = preprocess(rawQuery);
    const tokens = query.split(" ").filter(Boolean);

    const termFreq = {};
    tokens.forEach((t) => {
      termFreq[t] = (termFreq[t] || 0) + 1;
    });

    const queryVector = {};
    let sumSqQ = 0;
    const N = tokens.length;
    Object.entries(termFreq).forEach(([term, count]) => {
      const tf = count / N;
      const idf = tfidf.idf(term);
      if (!Number.isFinite(idf) || idf <= 0) {
        return;
      }
      const w = tf * idf;
      queryVector[term] = w;
      sumSqQ += w * w;
    });
    const queryMag = Math.sqrt(sumSqQ) || 1;

    const scores = problems.map((_, idx) => {
      const docVec = docVectors[idx];
      const docMag = docMagnitudes[idx] || 1;
      let dot = 0;

      for (const [term, wq] of Object.entries(queryVector)) {
        if (docVec[term]) {
          dot += wq * docVec[term];
        }
      }

      const cosine = dot / (queryMag * docMag);
      return { idx, score: cosine };
    });

    const allResults = scores
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ idx }) => {
        const p = problems[idx];
        const platform = p.url.includes("leetcode.com")
          ? "LeetCode"
          : "Codeforces";
        return { ...p, platform };
      });

    if (sortOrder === "title_asc") {
      allResults.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "title_desc") {
      allResults.sort((a, b) => b.title.localeCompare(a.title));
    }

    const totalResults = allResults.length;
    const totalPages = Math.ceil(totalResults / perPage);
    const startIdx = (page - 1) * perPage;
    const endIdx = startIdx + perPage;
    const paginatedResults = allResults.slice(startIdx, endIdx);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results: paginatedResults,
        pagination: {
          currentPage: page,
          perPage,
          totalResults,
          totalPages,
        },
      }),
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
