import fs from "fs/promises";
import path from "path";
import { removeStopwords } from "stopword";

let problems = [];
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

function idf(term) {
  let matches = 0;
  for (let i = 0; i < docVectors.length; i++) {
    if (docVectors[i][term]) {
      matches++;
    }
  }
  if (matches === 0) return -Infinity;
  return Math.log(docVectors.length / matches);
}

async function loadPrebuiltIndex() {
  if (isInitialized) {
    return;
  }

  try {
    let indexPath;
    let data;
    
    if (process.env.LAMBDA_TASK_ROOT) {
      const possiblePaths = [
        path.join(process.env.LAMBDA_TASK_ROOT, "netlify/functions/index-data.json"),
        path.join(process.env.LAMBDA_TASK_ROOT, "index-data.json"),
      ];
      
      console.log("LAMBDA_TASK_ROOT:", process.env.LAMBDA_TASK_ROOT);
      console.log("Checking paths:", possiblePaths);
      
      for (const p of possiblePaths) {
        try {
          console.log("Trying:", p);
          data = await fs.readFile(p, "utf-8");
          indexPath = p;
          break;
        } catch (e) {
          console.log("Not found:", p);
        }
      }
    } else {
      indexPath = path.resolve("netlify/functions/index-data.json");
      data = await fs.readFile(indexPath, "utf-8");
    }
    
    if (!data) {
      throw new Error("Could not find index-data.json in any expected location");
    }
    
    console.log("Loading pre-built index from:", indexPath);
    const indexData = JSON.parse(data);
    
    problems = indexData.problems;
    docVectors = indexData.docVectors;
    docMagnitudes = indexData.docMagnitudes;
    
    console.log("Loaded", problems.length, "problems from pre-built index");
  } catch (err) {
    console.error("Failed to load pre-built index:", err);
    throw err;
  }

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
    await loadPrebuiltIndex();

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
      const idfValue = idf(term);
      if (!Number.isFinite(idfValue) || idfValue <= 0) {
        return;
      }
      const w = tf * idfValue;
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
