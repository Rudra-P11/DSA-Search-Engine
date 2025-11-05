import express from "express";
import fs from "fs/promises";
import pkg from "natural";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import preprocess from "./utils/preprocess.js";

const { TfIdf } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.get("/styles.css", (_, res) => {
  res.sendFile(path.join(__dirname, "styles.css"));
});
app.get("/script.js", (_, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

let problems = [];
let tfidf = new TfIdf();

// store each document’s tf-idf vector and its magnitude
let docVectors = [];
let docMagnitudes = [];

async function loadProblemsAndBuildIndex() {
  try {
    const corpusPath = path.join(__dirname, "corpus", "all_problems.json");
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
}

app.post("/search", async (req, res) => {
  const rawQuery = req.body.query;
  const sortOrder = req.body.sort;
  const page = Math.max(1, parseInt(req.body.page) || 1);
  const perPage = Math.max(1, parseInt(req.body.perPage) || 10);

  if (!rawQuery || typeof rawQuery !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'query'" });
  }

  // Preprocess query and tokenize
  const query = preprocess(rawQuery);
  const tokens = query.split(" ").filter(Boolean);

  // Build the query TF×IDF vector
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

  // Compute cosine similarity against each document
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

  // Get all non-zero scores and sort by relevance
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

  // Apply secondary sorting if needed
  if (sortOrder === "title_asc") {
    allResults.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortOrder === "title_desc") {
    allResults.sort((a, b) => b.title.localeCompare(a.title));
  }

  // Paginate results
  const totalResults = allResults.length;
  const totalPages = Math.ceil(totalResults / perPage);
  const startIdx = (page - 1) * perPage;
  const endIdx = startIdx + perPage;
  const paginatedResults = allResults.slice(startIdx, endIdx);

  res.json({
    results: paginatedResults,
    pagination: {
      currentPage: page,
      perPage,
      totalResults,
      totalPages,
    },
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception", err);
  process.exit(1);
});

loadProblemsAndBuildIndex()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize search index", err);
    process.exit(1);
  });
