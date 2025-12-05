Mission Brief
Your mission is to build an automated price intelligence dashboard that tracks competitors’ pricing and surfaces actionable insights: who’s cheaper, who’s discounting, and when GoRocky should react.

Think of it as a command center for pricing strategy, starting from simple scrapers and growing into a daily “market radar.”

Inputs
Create a competitor configuration flow that captures:

Competitor URLs (aim for 2–5 to start)
Product mappings (which competitor products match which internal products)
Alert thresholds (e.g. “alert if price drops >10%”)

You can seed this with mock URLs/products if needed, but the structure should be real. 


Core Logic
Use web scraping tooling such as:
Puppeteer / Playwright for JavaScript-heavy sites
Cheerio / BeautifulSoup / Scrapy for simpler HTML.
Run scrapes on a schedule (or manual trigger for the demo).
Extract:
Product names
Current prices
Discounts / promotions
Store historical data (JSON, CSV, or a database like PostgreSQL/Supabase).
Compute:
Price trends
Competitive position
Alert conditions (e.g. big price drops).

Expected Output / UX
Build a pricing intelligence dashboard that shows:

Current price comparison table (all competitors side-by-side)
Price history charts (e.g. last 30 days)
A “competitive position” indicator (e.g. above/below market average)
Recent alerts (e.g. “Competitor X dropped ED price by 12%”)
Suggested actions (e.g. “Consider lowering price by 5% for Product Y”)

Design for fast executive decision-making: clear tables and charts, minimal friction.

To Complete This Bounty
To count as "solved", your submission must include:

A way to configure at least 2 competitors and mapped products.
A working scraper or mock-scrape pipeline that:
Pulls real or realistically structured pricing data.
Storage of scraped data over time (even if just multiple runs in JSON).
A dashboard that shows:
Current price comparison
At least one time-series chart.
At least one example alert and a corresponding suggested action.

Bonus / Advanced
Bonus points for:

Proper cron-style scheduling (e.g. daily at a set time).
Handling JavaScript-rendered pages with headless browsers.
A real database schema (products, prices, competitors, scraping_logs).
Ethical scraping practices:
Respect robots.txt
Throttling / delays
Reasonable user agents.
Site change detection:
Notify when selectors break or layout changes.
Basic price forecasting or trend prediction.
Slack/email/webhook alerts for significant price moves.
Screenshot capture for verification.

Additional Details
24h feasibility:
Start with 2–3 competitors and simple HTML pages or mocks.
Use JSON, Google Sheets, or Supabase for storage if DB is too heavy.
Focus first on:
Clean comparison table
One meaningful chart
One useful alert.