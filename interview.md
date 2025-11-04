# DSA Search Engine Project - Interview Preparation Guide

## Project Overview
This project is a Data Structures and Algorithms (DSA) problem search engine built using Node.js, Express, and web scraping techniques. It allows users to search through over 3500+ coding problems from platforms like LeetCode, CodeForces, and CodeChef. The system uses TF-IDF (Term Frequency-Inverse Document Frequency) for relevance ranking and provides a simple web interface for querying.

The project demonstrates full-stack development skills, including backend API development, web scraping, natural language processing, and frontend integration. It's designed as a portfolio project to showcase problem-solving, data processing, and search algorithm implementation.

## Project Structure
```
az-dsa-search-engine/
├── index.js                 # Main Express server
├── scrape.js                # Web scraping script
├── script.js                # Frontend JavaScript
├── styles.css               # CSS styles
├── index.html               # Main HTML page
├── package.json             # Node.js dependencies
├── package-lock.json        # Dependency lock file
├── .gitignore               # Git ignore rules
├── corpus/
│   └── all_problems.json    # Merged problem data
├── problems/
│   ├── leetcode_problems.json
│   └── codeforces_problems.json
├── assets/
│   └── logos/
│       ├── leetcode.png
│       ├── codeforces.png
│       └── codechef.png
├── utils/
│   ├── preprocess.js        # Text preprocessing utility
│   └── merge.js             # Data merging script
└── node_modules/            # Dependencies
```

## Detailed File Explanations

### 1. package.json
**Purpose:** Defines the Node.js project metadata, dependencies, and scripts.

**Content:**
- Project name: "az-dsa-search-engine"
- Version: 1.0.0
- Description: Explains the project's functionality
- Scripts: scrape, merge, dev, start
- Dependencies: express, natural, puppeteer, stopword
- DevDependencies: nodemon

**Why this way:**
- Express: Lightweight web framework for the API
- Natural: Provides TF-IDF implementation for search relevance
- Puppeteer: Headless browser for web scraping (handles dynamic content)
- Stopword: Removes common words for better search accuracy
- Nodemon: Auto-restarts server during development

### 2. index.js (Main Server)
**Purpose:** The core Express server that handles API requests and serves the frontend.

**Key Components:**
- Express app setup with JSON middleware and static file serving
- TF-IDF index building from corpus data
- /search POST endpoint for query processing
- Cosine similarity calculation for result ranking

**Why this implementation:**
- File-based storage (JSON) instead of database: Keeps it simple for a demo project, avoids complexity of DB setup
- TF-IDF with cosine similarity: Industry-standard for text search relevance
- Preprocessing: Improves search quality by normalizing text
- Top 10 results: Balances performance and user experience

### 3. scrape.js
**Purpose:** Web scraping script to collect problem data from coding platforms.

**Functionality:**
- Uses Puppeteer to navigate and extract data
- Scrapes LeetCode and CodeForces problems
- Saves data to JSON files in problems/ directory

**Why Puppeteer:**
- Handles JavaScript-rendered content
- Provides browser automation capabilities
- More reliable than simple HTTP requests for modern websites

### 4. utils/preprocess.js
**Purpose:** Text preprocessing utility for search optimization.

**Functionality:**
- Converts to lowercase
- Removes special characters
- Applies stopword removal
- Returns cleaned text

**Why this approach:**
- Stopword removal improves TF-IDF accuracy
- Normalization ensures consistent search behavior
- Simple regex for character removal keeps it lightweight

### 5. utils/merge.js
**Purpose:** Combines scraped data from multiple platforms into a single corpus.

**Functionality:**
- Reads individual platform JSON files
- Merges arrays into all_problems.json
- Creates corpus directory if needed

**Why separate merge step:**
- Allows independent scraping of platforms
- Enables easy updates without re-scraping everything
- Maintains data integrity

### 6. index.html
**Purpose:** Main web interface for the search engine.

**Structure:**
- Semantic HTML5 with proper meta tags
- Hero section with title and search form
- Results display area with loading spinner
- Platform logos for visual appeal

**Why this design:**
- Single-page application approach for simplicity
- Responsive design with mobile considerations
- Clean, professional UI matching the technical nature

### 7. styles.css
**Purpose:** CSS styling for the web interface.

**Key Features:**
- Responsive grid layout for results
- Hover effects and animations
- Platform-specific styling
- Mobile-first approach with media queries

**Design Choices:**
- Blue color scheme for tech/trust feel
- Card-based layout for easy scanning
- Featured result highlighting for top match

### 8. script.js
**Purpose:** Frontend JavaScript for user interaction.

**Functionality:**
- Form submission handling
- AJAX request to /search endpoint
- Dynamic result rendering
- Loading state management

**Why vanilla JS:**
- No framework needed for this simple app
- Demonstrates core JavaScript skills
- Faster load times without heavy dependencies

## Technologies Used and Rationale

### Backend
- **Node.js:** JavaScript runtime for server-side development
- **Express:** Minimal web framework for API routes
- **Natural:** NLP library for TF-IDF implementation

### Frontend
- **Vanilla HTML/CSS/JS:** No frameworks to keep it lightweight
- **Fetch API:** Modern browser API for AJAX requests

### Data Processing
- **Puppeteer:** For reliable web scraping
- **Stopword:** For text preprocessing

### Why not use a database?
- **Simplicity:** JSON files are sufficient for this scale (~3500 problems)
- **No complex queries:** Simple search doesn't require SQL/NoSQL features
- **Deployment ease:** No database setup required
- **Performance:** File I/O is fast enough for this use case

## How the System Works

1. **Data Collection:**
   - scrape.js runs periodically to fetch new problems
   - Data saved as JSON in problems/ directory

2. **Data Processing:**
   - merge.js combines platform data into corpus
   - index.js loads and builds TF-IDF index on startup

3. **Search Process:**
   - User submits query via web form
   - Query preprocessed and converted to TF-IDF vector
   - Cosine similarity calculated against all documents
   - Top 10 results returned and displayed

4. **Indexing:**
   - Documents: Problem title (duplicated for weight) + description
   - Query: User input after preprocessing
   - Similarity: Cosine similarity for relevance scoring

## Potential Interview Questions and Answers

### Database and Data Storage
**Q: Why didn't you use MongoDB or another database?**
A: For this project, JSON files provide sufficient performance and simplicity. With ~3500 documents, file I/O is fast and doesn't require database management overhead. In a production environment, I'd consider MongoDB for scalability, but for a portfolio project demonstrating search algorithms, this approach keeps the focus on the core functionality.

**Q: How would you handle data persistence and updates?**
A: Currently, data is scraped periodically and stored as files. For production, I'd implement:
- Database storage (MongoDB/PostgreSQL)
- Incremental updates instead of full rescrapes
- Caching layer (Redis) for frequently accessed data
- Data validation and sanitization

### Authentication and Security
**Q: There's no authentication - how would you secure this?**
A: This is a demo project, so authentication wasn't implemented. For production:
- JWT-based authentication for API access
- OAuth integration for social login
- Rate limiting to prevent abuse
- API key authentication for programmatic access

**Q: What about network security?**
A: Current implementation lacks security measures:
- No HTTPS enforcement
- No input validation/sanitization
- No CORS configuration
- No rate limiting

For production, I'd add:
- HTTPS with SSL certificates
- Input validation using libraries like Joi
- CORS middleware
- Helmet.js for security headers
- Rate limiting with express-rate-limit

### Data Security
**Q: How secure is the data storage?**
A: JSON files are not secure:
- No encryption at rest
- Vulnerable to unauthorized access
- No backup strategy

Improvements:
- Encrypt sensitive data
- Use environment variables for secrets
- Implement proper backup/restore
- Database with access controls

### Scalability and Performance
**Q: How would this scale to millions of problems?**
A: Current approach has limitations:
- TF-IDF index loaded entirely in memory
- File-based storage doesn't scale well
- No caching or optimization

Solutions:
- Database with indexing
- Elasticsearch for full-text search
- Redis caching
- CDN for static assets
- Horizontal scaling with load balancers

### Web Scraping Concerns
**Q: Is web scraping ethical/legal?**
A: Depends on platform terms of service. For this project:
- Used for educational purposes
- Respects robots.txt
- Implements delays to avoid overloading servers
- In production, I'd use official APIs when available

### Algorithm Choices
**Q: Why TF-IDF and cosine similarity?**
A: TF-IDF is the standard for text search relevance:
- Term Frequency: How often a term appears in document
- Inverse Document Frequency: How rare the term is across corpus
- Cosine similarity: Measures angle between vectors (better than dot product for normalization)

Alternatives considered:
- BM25: More sophisticated ranking
- Neural embeddings: For semantic search (but overkill for this)

## Improvements and Future Enhancements

1. **Database Integration:** Migrate to MongoDB for better scalability
2. **Real-time Updates:** WebSocket for live scraping status
3. **Advanced Search:** Filters by difficulty, tags, platform
4. **User Accounts:** Save search history, favorites
5. **API Documentation:** Swagger/OpenAPI specs
6. **Testing:** Unit tests with Jest, integration tests
7. **Deployment:** Docker containerization, CI/CD pipeline
8. **Monitoring:** Logging, error tracking, performance metrics

## Conclusion
This project demonstrates a complete full-stack application with modern JavaScript technologies. It showcases skills in web scraping, natural language processing, search algorithms, and web development. While simplified for demonstration purposes, it provides a solid foundation that can be extended with production-ready features like databases, authentication, and security measures.

The design choices prioritize simplicity and focus on core functionality, making it an excellent portfolio piece for explaining technical decision-making and system architecture to interviewers.
