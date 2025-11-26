const { useState, useEffect, useMemo, useRef } = React;
const { createRoot } = ReactDOM;

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
];

const RESULTS_PER_PAGE_OPTIONS = [
  { value: 5, label: "5 per page" },
  { value: 10, label: "10 per page" },
  { value: 15, label: "15 per page" },
];

const PLATFORM_META = {
  LeetCode: {
    label: "LeetCode",
    accent: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    logo: "assets/logos/leetcode.png",
  },
  Codeforces: {
    label: "Codeforces",
    accent: "bg-sky-500/15 text-sky-200 ring-sky-400/30",
    logo: "assets/logos/codeforces.png",
  },
  CodeChef: {
    label: "CodeChef",
    accent: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
    logo: "assets/logos/codechef.png",
  },
};

const classNames = (...classes) => classes.filter(Boolean).join(" ");

const PlatformBadge = ({ platform }) => {
  const meta = PLATFORM_META[platform] ?? {
    label: platform,
    accent: "bg-violet-500/15 text-violet-200 ring-violet-400/30",
    logo: "assets/logos/codeforces.png",
  };
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        meta.accent
      )}
    >
      <img
        src={meta.logo}
        alt={`${meta.label} logo`}
        className="h-5 w-5 rounded-full bg-white/5 object-contain"
      />
      {meta.label}
    </span>
  );
};

const SortMenu = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointer);
    return () => {
      window.removeEventListener("pointerdown", handlePointer);
    };
  }, [open]);
  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);
  const activeOption =
    SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0];
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        data-testid="sort-select"
        className={classNames(
          "flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          disabled && "opacity-50"
        )}
      >
        <span>{activeOption.label}</span>
        <svg
          className={classNames(
            "h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0"
          )}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-1 shadow-2xl backdrop-blur">
          {SORT_OPTIONS.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={classNames(
                  "flex w-full items-center justify-between rounded-xl px-4 py-2 text-sm transition",
                  isActive
                    ? "bg-primary-500/15 text-primary-200"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <span>{option.label}</span>
                {isActive && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/20 text-primary-200">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-4 w-4"
                    >
                      <path
                        d="M6 10l2 2 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PageSizeMenu = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointer);
    return () => {
      window.removeEventListener("pointerdown", handlePointer);
    };
  }, [open]);
  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);
  const activeOption =
    RESULTS_PER_PAGE_OPTIONS.find((option) => option.value === value) ??
    RESULTS_PER_PAGE_OPTIONS[1];
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        data-testid="results-per-page-select"
        className={classNames(
          "flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          disabled && "opacity-50"
        )}
      >
        <span>{activeOption.label}</span>
        <svg
          className={classNames(
            "h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0"
          )}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-1 shadow-2xl backdrop-blur">
          {RESULTS_PER_PAGE_OPTIONS.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={classNames(
                  "flex w-full items-center justify-between rounded-xl px-4 py-2 text-sm transition",
                  isActive
                    ? "bg-primary-500/15 text-primary-200"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <span>{option.label}</span>
                {isActive && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/20 text-primary-200">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-4 w-4"
                    >
                      <path
                        d="M6 10l2 2 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    pageNumbers.push(1);
    if (startPage > 2) {
      pageNumbers.push("...");
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push("...");
    }
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2" data-testid="pagination-container">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        data-testid="prev-page-button"
        className={classNames(
          "rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm font-medium transition",
          disabled || currentPage === 1
            ? "cursor-not-allowed text-slate-500 opacity-50"
            : "text-slate-200 hover:border-white/20 hover:text-white"
        )}
      >
        ← Previous
      </button>

      <div className="flex flex-wrap items-center justify-center gap-1">
        {pageNumbers.map((pageNum, idx) => {
          if (pageNum === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                …
              </span>
            );
          }
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              disabled={disabled}
              className={classNames(
                "min-w-10 rounded-lg border px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "border-primary-500/50 bg-primary-500/15 text-primary-200"
                  : "border-white/10 bg-slate-900/70 text-slate-200 hover:border-white/20 hover:text-white",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        data-testid="next-page-button"
        className={classNames(
          "rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm font-medium transition",
          disabled || currentPage === totalPages
            ? "cursor-not-allowed text-slate-500 opacity-50"
            : "text-slate-200 hover:border-white/20 hover:text-white"
        )}
      >
        Next →
      </button>
    </div>
  );
};

const LoadingIndicator = () => (
  <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></span>
    </span>
    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
      Searching
    </p>
  </div>
);

const StatePanel = ({ tone = "neutral", title, description }) => {
  const palette =
    tone === "error"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
      : "border-white/10 bg-slate-900/40 text-slate-300";
  const iconStroke = tone === "error" ? "currentColor" : "#38bdf8";
  return (
    <div className={classNames("rounded-3xl border p-10 text-center backdrop-blur", palette)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStroke}
          strokeWidth="1.5"
        >
          {tone === "error" ? (
            <path
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M8.757 15.243l-2.121 2.121m0-12.728l2.121 2.121m8.486 8.486l2.121 2.121"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm text-slate-300/80">{description}</p>
    </div>
  );
};

const ResultCard = ({ problem, index }) => {
  const isTop = index === 0;
  return (
    <article
      data-testid="result-card"
      className={classNames(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 transition duration-300",
        isTop
          ? "border-primary-500/50 shadow-glow"
          : "hover:border-white/20 hover:shadow-[0_20px_45px_-30px_rgba(56,189,248,0.35)]"
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl transition duration-500 group-hover:opacity-80" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
            <span className="rounded-full bg-white/5 px-3 py-1 text-[0.7rem] font-semibold text-white/90" data-testid="result-number">
              #{String(index + 1).padStart(2, "0")}
            </span>
            <PlatformBadge platform={problem.platform} />
          </div>
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="font-display text-xl font-semibold text-white transition group-hover:text-primary-100 md:text-2xl" data-testid="result-title">
              {problem.title}
            </h3>
          </a>
          {problem.description && (
            <p className="line-clamp-3 text-sm text-slate-300/80 md:text-base">
              {problem.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 self-end lg:self-start">
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            View problem
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <path d="M7 13l6-6M9 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
};

const App = () => {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [request, setRequest] = useState(null);
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalResults: 0,
    totalPages: 0,
  });
  const [error, setError] = useState("");

  const activeQuery = request?.query ?? "";

  useEffect(() => {
    if (!request) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setStatus("loading");
      setResults([]);
      setError("");
      try {
        const payload = {
          query: request.query,
          page: currentPage,
          perPage: resultsPerPage,
        };
        if (sort !== "relevance") {
          payload.sort = sort;
        }
        const response = await fetch("/.netlify/functions/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`Server error ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) {
          return;
        }
        const items = data.results ?? [];
        setResults(items);
        setPagination(data.pagination ?? {});
        setStatus(items.length ? "success" : "empty");
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err.message ?? "Unexpected error");
        setStatus("error");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [request, sort, currentPage, resultsPerPage]);

  const headline = useMemo(() => {
    if (status !== "success") {
      return "";
    }
    const count = results.length;
    const label = count === 1 ? "match" : "matches";
    return `${count} ${label} for “${activeQuery}”`;
  }, [results, status, activeQuery]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Enter a problem title, topic, or tag to search.");
      return;
    }
    setCurrentPage(1);
    setRequest({ query: trimmed, timestamp: Date.now() });
    setQuery(trimmed);
  };

  const handleResultsPerPageChange = (newPerPage) => {
    setResultsPerPage(newPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary-500/20 via-slate-900/40 to-slate-950" />
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <header className="space-y-6 text-center">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
            Search Intelligence ++
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Discover coding challenges in a single intelligent search
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-300 sm:text-lg">
            Query by pattern, technique, or title and instantly uncover curated problems sourced from LeetCode and Codeforces.
          </p>
        </header>
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_25px_60px_-35px_rgba(14,165,233,0.55)] backdrop-blur">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 md:flex-row md:items-center"
          >
            <div className="flex-1">
              <label htmlFor="query" className="sr-only">
                Search dataset
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-5 w-5"
                  >
                    <path
                      d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  id="query"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try “graph traversal”, “dynamic programming”, or “two pointers”"
                  className="w-full rounded-2xl border border-transparent bg-slate-950/60 py-4 pl-12 pr-4 text-base text-white placeholder:text-slate-500 shadow-inner shadow-black/20 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  autoComplete="off"
                />
              </div>
              {error && status !== "loading" && (
                <p className="mt-2 text-sm font-medium text-rose-300">{error}</p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
              >
                Search now
              </button>
            </div>
          </form>
        </section>
        <section className="space-y-6">
          {status === "idle" && (
            <StatePanel
              title="Start exploring the problem universe"
              description="Enter a topic or title above to surface the most relevant competitive programming challenges."
            />
          )}
          {status === "loading" && <LoadingIndicator />}
          {status === "error" && (
            <StatePanel
              tone="error"
              title="We couldn’t complete the search"
              description={error}
            />
          )}
          {status === "empty" && (
            <StatePanel
              title="No matches found yet"
              description="Try a broader concept, alternate keyword, or different difficulty to uncover more problems."
            />
          )}
          {status === "success" && (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  {headline}
                </h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <PageSizeMenu
                    value={resultsPerPage}
                    onChange={handleResultsPerPageChange}
                    disabled={status === "loading"}
                  />
                  <SortMenu
                    value={sort}
                    onChange={setSort}
                    disabled={status === "loading"}
                  />
                </div>
              </div>
              <div className="grid gap-5">
                {results.map((problem, index) => (
                  <ResultCard
                    key={problem.url}
                    problem={problem}
                    index={(pagination.currentPage - 1) * pagination.perPage + index}
                  />
                ))}
              </div>
              <div className="space-y-4">
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-xs text-slate-400" data-testid="pagination-info">
                      Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalResults} total results)
                    </p>
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={setCurrentPage}
                      disabled={status === "loading"}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </section>
        <footer className="pb-6 text-center text-xs text-slate-500">
          Crafted for ambitious engineers seeking faster practice discovery.
        </footer>
      </div>
    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
