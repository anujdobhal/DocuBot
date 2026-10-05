"""
GEHU (Graphic Era Hill University) Advanced Data Collection & Document Scraper

Engineered specifically to collect official student-related public information from
https://gehu.ac.in/ (HTML pages and downloadable PDF documents) for RAG dataset preparation.

Key Capabilities:
1. Discovers and downloads official PDF documents (academic calendars, date sheets, fee structures,
   hostel fees, anti-ragging regulations, exam notices, course brochures, RTI disclosures).
2. Deep notice archive pagination (/dehradun/notices-and-events/ and /dehradun/exam-portal/).
3. Extracts rich metadata: academic_year, semester, department, program, date, source_url, document_url.
4. Generates:
   - gehu_data/html/
   - gehu_data/pdf/
   - gehu_data/text/
   - gehu_data/dataset.json
   - gehu_data/errors.json
   - gehu_data/missing_data.json
   - gehu_data/collection_report.json

Usage:
    python crawler.py --max-pages 100
    python crawler.py --max-pages 300
"""

import os
import sys
import re
import json
import time
import argparse
import hashlib
from urllib.parse import urljoin, urlparse, unquote
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup
import pymupdf

BASE_URL = "https://gehu.ac.in/"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (GEHU Research Scraper)"

SITEMAP_URLS = [
    "https://gehu.ac.in/sitemap.xml",
    "https://gehu.ac.in/dehradun/sitemap.xml",
    "https://gehu.ac.in/bhimtal/sitemap.xml",
    "https://gehu.ac.in/haldwani/sitemap.xml",
]

# Targeted seed URLs covering all sections A through P
SEED_URLS = [
    # Core & About
    "https://gehu.ac.in/",
    "https://gehu.ac.in/dehradun/",
    "https://gehu.ac.in/dehradun/about-us/",
    # Academic Calendars
    "https://gehu.ac.in/dehradun/academic-calendar-for-the-even-semester-ii-iv-vi-viii-x-january-july-2026/",
    "https://gehu.ac.in/dehradun/academic-calendar-2025-26-july-december-i-semester/",
    "https://gehu.ac.in/dehradun/academics/calendar/",
    # Admissions & Brochures
    "https://gehu.ac.in/dehradun/admissions/",
    "https://gehu.ac.in/dehradun/admissions/brochure/",
    # Fees & Scholarships
    "https://gehu.ac.in/dehradun/academic-fee-structures/",
    "https://gehu.ac.in/dehradun/hostel-fee/",
    "https://gehu.ac.in/dehradun/scholarships/",
    "https://gehu.ac.in/dehradun/finance/",
    "https://gehu.ac.in/fee/ddn/btech-cse",
    "https://gehu.ac.in/fee/ddn/btech-ce",
    "https://gehu.ac.in/fee/ddn/btech-me",
    # Exam Portal & Notices
    "https://gehu.ac.in/dehradun/exam-portal/",
    "https://gehu.ac.in/dehradun/notices-and-events/",
    "https://gehu.ac.in/dehradun/notices-and-events/page/2/",
    "https://gehu.ac.in/dehradun/notices-and-events/page/3/",
    "https://gehu.ac.in/dehradun/notices-and-events/page/4/",
    # Departments
    "https://gehu.ac.in/dehradun/computer-science-and-engineering/",
    "https://gehu.ac.in/dehradun/electronics-and-communication-engineering/",
    "https://gehu.ac.in/dehradun/mechanical-engineering/",
    "https://gehu.ac.in/dehradun/civil-engineering/",
    "https://gehu.ac.in/dehradun/management/",
    "https://gehu.ac.in/dehradun/computer-application/",
    "https://gehu.ac.in/dehradun/english/",
    "https://gehu.ac.in/dehradun/commerce/",
    "https://gehu.ac.in/dehradun/pharmacy/",
    "https://gehu.ac.in/dehradun/allied-sciences/",
    "https://gehu.ac.in/dehradun/agriculture/",
    "https://gehu.ac.in/dehradun/law/",
    "https://gehu.ac.in/dehradun/school-design/",
    # Placements & Careers
    "https://gehu.ac.in/dehradun/placements/",
    # Policies & Student Life
    "https://gehu.ac.in/dehradun/anti-ragging/",
    "https://gehu.ac.in/dehradun/grievance-redressal-form/",
    "https://gehu.ac.in/dehradun/student-area/",
    "https://gehu.ac.in/dehradun/university-life/sports/",
    "https://gehu.ac.in/dehradun/university-life/transport/",
    "https://gehu.ac.in/dehradun/transport/",
    "https://gehu.ac.in/dehradun/contact/",
    "https://gehu.ac.in/dehradun/rti/",
    "https://gehu.ac.in/dehradun/campus-tour/",
]

# Trackable target topics for collection_report.json
TARGET_TOPICS = [
    "syllabus",
    "courses",
    "exam schedules",
    "course registration",
    "electives",
    "course structures",
    "attendance",
    "regulations",
    "grading",
    "CGPA",
    "timetable",
    "faculty",
    "hostel",
    "bus",
    "library",
    "scholarships",
    "anti-ragging",
    "grievance",
    "medical",
    "sports",
    "clubs",
    "admission",
    "departments",
    "contacts",
    "certificates",
    "academic calendar",
    "examinations",
    "placements",
    "internship",
    "history",
]


def is_allowed_web_url(url: str) -> bool:
    """Ensure HTML pages belong strictly to GEHU domain hierarchy."""
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        if not (netloc == "gehu.ac.in" or netloc.endswith(".gehu.ac.in")):
            return False
        if parsed.scheme not in ["http", "https"]:
            return False
        path = parsed.path.lower()
        excluded_exts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".mp4", ".mp3", ".zip", ".tar", ".gz", ".exe", ".css", ".js"]
        if any(path.endswith(ext) for ext in excluded_exts):
            return False
        if any(p in path for p in ["/wp-json/", "/wp-admin/", "/feed/", "/xmlrpc.php", "/cdn-cgi/"]):
            return False
        return True
    except Exception:
        return False


def is_allowed_document_url(url: str) -> bool:
    """
    Allow downloadable documents (PDFs) from official GEHU domains or GEHU AWS S3 storage.
    """
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        # Direct GEHU domain or subdomain
        if netloc == "gehu.ac.in" or netloc.endswith(".gehu.ac.in"):
            return True
        # GEHU AWS S3 storage buckets
        if "amazonaws.com" in netloc and ("gehu" in netloc or "ddn-gehu" in netloc):
            return True
        return False
    except Exception:
        return False


def normalize_url(url: str) -> str:
    """Normalize URL by stripping fragments and trailing query noise."""
    try:
        parsed = urlparse(url)
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if parsed.query:
            clean += f"?{parsed.query}"
        return clean.strip()
    except Exception:
        return url.strip()


def safe_filename(url: str, ext: str = "txt") -> str:
    """Generate a safe, unique filename based on the URL path and hash."""
    parsed = urlparse(url)
    clean_path = re.sub(r"[^a-zA-Z0-9_\-]", "_", parsed.path.strip("/"))
    if not clean_path:
        clean_path = "home"
    if len(clean_path) > 60:
        clean_path = clean_path[:60]
    url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()[:8]
    return f"{clean_path}_{url_hash}.{ext}"


def classify_category(url: str, title: str = "", text_snippet: str = "") -> str:
    """Categorize content into one of the designated categories."""
    combined = f"{url.lower()} {title.lower()} {text_snippet[:400].lower()}"

    if any(k in combined for k in ["hostel", "mess", "boarding", "accommodation"]):
        return "hostel"
    if any(k in combined for k in ["fee", "tuition", "refund-policy", "fee-structure", "hostel fee", "payment"]):
        return "fees"
    if any(k in combined for k in ["scholarship", "financial-aid", "merit scholarship", "concession"]):
        return "scholarship"
    if any(k in combined for k in ["exam", "examination", "date-sheet", "datesheet", "back-paper", "result", "admit-card", "seating-plan", "sessional"]):
        return "examination"
    if any(k in combined for k in ["placement", "recruiter", "corporate resource", "highest package", "average package", "internship", "training"]):
        return "placement"
    if any(k in combined for k in ["admission", "apply-now", "eligibility", "brochure", "intake"]):
        return "admissions"
    if any(k in combined for k in ["notice", "circular", "announcement", "orders"]):
        return "notice"
    if any(k in combined for k in ["event", "workshop", "seminar", "conference", "fest", "webinar", "hackathon"]):
        return "event"
    if any(k in combined for k in ["library", "e-resources", "ndli", "delnet", "journals"]):
        return "library"
    if any(k in combined for k in ["faculty", "/faculty/", "prof-", "dr-", "faculty-members"]):
        return "faculty"
    if any(k in combined for k in ["department-of", "school-of", "department", "school of design", "school of management"]):
        return "department"
    if any(k in combined for k in ["b-tech", "btech", "m-tech", "mtech", "mba", "mca", "bca", "bba", "b-sc", "m-sc", "b-pharm", "phd", "curriculum", "syllabus"]):
        return "course"
    if any(k in combined for k in ["academic calendar", "academics", "semester", "academic-regulations"]):
        return "academics"
    if any(k in combined for k in ["anti-ragging", "rti", "regulation", "code-of-conduct", "grievance", "ordinance", "policy"]):
        return "regulation"
    if any(k in combined for k in ["contact", "reach-us", "how-to-reach", "location", "enquiry"]):
        return "contact"
    if any(k in combined for k in ["transport", "bus route", "bus timing"]):
        return "facility"
    if any(k in combined for k in ["facility", "sports", "gym", "campus-tour", "canteen", "infrastructure", "medical"]):
        return "facility"
    if any(k in combined for k in ["about-us", "about gehu", "vision", "mission", "chancellor", "president", "vice chancellor", "about"]):
        return "about"

    return "other"


def extract_metadata(url: str, title: str, text: str) -> dict:
    """Extract academic_year, semester, department, program, date without hallucinating."""
    combined = f"{url} {title} {text[:600]}"

    # Academic Year
    year_match = re.search(r"\b(202\d[-–\/](?:20)?2\d)\b", combined)
    academic_year = year_match.group(1).replace("–", "-") if year_match else None

    # Semester
    sem_match = re.search(
        r"\b(?:Semester|Sem|Trimester)\s*[-–]?\s*([I|V|X]+|\d+|odd|even)\b",
        combined,
        re.IGNORECASE,
    )
    semester = sem_match.group(0).strip() if sem_match else None

    # Department
    dept_names = [
        "Computer Science and Engineering",
        "Electronics and Communication Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Management",
        "Computer Application",
        "Commerce",
        "Pharmacy",
        "Law",
        "Agriculture",
        "Design",
        "English",
        "Allied Sciences",
        "Media and Mass Communication",
        "Hospitality Management",
    ]
    department = None
    for d in dept_names:
        if d.lower() in combined.lower():
            department = d
            break

    # Program
    prog_patterns = [
        (r"\bB\.?Tech\s+CSE\s*\([^)]+\)", "B.Tech CSE Specialization"),
        (r"\bB\.?Tech\s+CSE\b", "B.Tech Computer Science and Engineering"),
        (r"\bB\.?Tech\s+(?:Mechanical|Civil|ECE|Biotechnology)\b", "B.Tech Engineering"),
        (r"\bBCA\b", "BCA"),
        (r"\bMCA\b", "MCA"),
        (r"\bBBA\b", "BBA"),
        (r"\bMBA\b", "MBA"),
        (r"\bB\.?Com\b", "B.Com"),
        (r"\bB\.?Pharm\b", "B.Pharm"),
        (r"\bD\.?Pharm\b", "D.Pharm"),
        (r"\bPh\.?D\.?\b", "Ph.D."),
        (r"\bDiploma\s+in\s+[A-Za-z ]+\b", "Diploma"),
    ]
    program = None
    for pat, name in prog_patterns:
        if re.search(pat, combined, re.IGNORECASE):
            program = name
            break

    # Date
    date_match = re.search(
        r"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+202\d)\b",
        combined,
        re.IGNORECASE,
    )
    date = date_match.group(1) if date_match else None
    if not date:
        # Check URL for date like /2026/09/16/
        url_date = re.search(r"/(202\d)/(\d{2})/(\d{2})/", url)
        if url_date:
            date = f"{url_date.group(1)}-{url_date.group(2)}-{url_date.group(3)}"

    return {
        "academic_year": academic_year,
        "semester": semester,
        "department": department,
        "program": program,
        "date": date,
    }


def match_target_topics(title: str, text: str, url: str) -> list[str]:
    """Identify which target items (A to P) are satisfied by this document."""
    combined = f"{url.lower()} {title.lower()} {text.lower()}"
    matched = []

    topic_checks = {
        "syllabus": ["syllabus", "curriculum", "course structure"],
        "courses": ["course/", "programs offered", "btech", "mca", "bca", "mba"],
        "exam schedules": ["exam schedule", "examination schedule", "term evaluation theory", "datesheet", "date sheet"],
        "course registration": ["course registration", "registration form", "registration guidelines"],
        "electives": ["elective course", "open elective", "departmental elective", "elective list"],
        "course structures": ["course structure", "curriculum structure", "scheme of examination"],
        "attendance": ["attendance", "75% attendance", "attendance requirement", "debarred"],
        "regulations": ["academic regulations", "regulations", "code of conduct", "ordinance"],
        "grading": ["grading system", "grading rules", "letter grade", "grade point"],
        "CGPA": ["cgpa", "sgpa", "cumulative grade point"],
        "timetable": ["time table", "timetable", "class schedule"],
        "faculty": ["faculty/", "faculty member", "designation", "assistant professor", "associate professor"],
        "hostel": ["hostel", "mess fee", "hostel fee", "hostel room", "hostel rules"],
        "bus": ["transport", "bus route", "bus timing", "bus fee"],
        "library": ["library", "knimbus", "e-resources", "reading room"],
        "scholarships": ["scholarship", "merit scholarship", "financial aid", "concession"],
        "anti-ragging": ["anti-ragging", "anti ragging", "prohibition of ragging", "punishment for ragging"],
        "grievance": ["grievance", "grievance redressal", "internal complaint committee"],
        "medical": ["medical", "health center", "emergency", "doctor", "dispensary"],
        "sports": ["sports", "badminton", "cricket", "basketball", "gym", "football"],
        "clubs": ["club", "student activity", "society", "acm student chapter", "cultural fest"],
        "admission": ["admission", "eligibility criteria", "apply now", "intake", "application procedure"],
        "departments": ["department of", "school of", "cse", "mechanical", "management", "pharmacy"],
        "contacts": ["contact us", "toll-free", "enquiry@", "admissions@", "phone number"],
        "certificates": ["certificate", "transcript", "degree", "migration", "provisional certificate", "bonafide"],
        "academic calendar": ["academic calendar", "calendar for the even semester", "calendar for the odd semester"],
        "examinations": ["examination", "exam cell", "back paper", "supplementary", "re-examination"],
        "placements": ["placement", "recruiter", "highest package", "training and placement"],
        "internship": ["internship", "internship guidelines", "noc students"],
        "history": ["graphic era hill university is the culmination", "visionary founder", "founded in 2011", "milestones"],
    }

    for topic, words in topic_checks.items():
        if any(w in combined for w in words):
            matched.append(topic)

    return matched


def clean_html_content(html_str: str, current_url: str) -> tuple[str, str, set[str], list[tuple[str, str]]]:
    """
    Extract meaningful visible content from HTML and discover internal and downloadable PDF links.
    Returns: (title, cleaned_text, discovered_pages, discovered_download_links)
    """
    soup = BeautifulSoup(html_str, "html.parser")

    # Title
    title = soup.title.string.strip() if (soup.title and soup.title.string) else ""
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text().strip()

    discovered_pages = set()
    discovered_downloads = []  # (doc_url, link_text)

    # Scrape all <a> tags for navigation and download links
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        link_text = a.get_text().strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue

        full_url = normalize_url(urljoin(current_url, href))

        # Check if it's a PDF / downloadable document
        is_doc = (
            full_url.lower().endswith((".pdf", ".doc", ".docx"))
            or ".pdf?" in full_url.lower()
            or "/uploads/doc/" in full_url.lower()
            or any(k in link_text.lower() for k in ["download", "view pdf", "download pdf", "brochure", "date sheet", "schedule", "syllabus"])
        )

        if is_doc and is_allowed_document_url(full_url):
            discovered_downloads.append((full_url, link_text))
        elif is_allowed_web_url(full_url):
            discovered_pages.add(full_url)

    # Decompose noise elements
    for tag in soup(["script", "style", "noscript", "svg", "iframe", "header", "footer", "nav"]):
        tag.decompose()

    noise_selectors = [
        ".kingster-header-container",
        ".kingster-mobile-header",
        ".kingster-top-bar",
        ".kingster-navigation",
        ".kingster-footer-wrapper",
        ".kingster-copyright-wrapper",
        ".kingster-breadcrumbs",
        ".gdlr-core-breadcrumbs",
        ".mobile-menu",
        ".cookie-banner",
        ".cookie-notice",
        "#comments",
        ".widget_nav_menu",
    ]
    for sel in noise_selectors:
        for match in soup.select(sel):
            match.decompose()

    content_root = (
        soup.find(class_="gdlr-core-page-builder-body")
        or soup.find(class_="kingster-content-area")
        or soup.find("main")
        or soup.find("article")
        or soup.body
    )

    if not content_root:
        return title, "", discovered_pages, discovered_downloads

    # Extract clean text preserving structure
    lines = []
    for elem in content_root.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "tr"]):
        txt = " ".join(elem.stripped_strings)
        if txt and len(txt) > 2:
            lines.append(txt)

    if not lines:
        lines = [s for s in content_root.stripped_strings if len(s) > 2]

    cleaned_text = "\n".join(lines).strip()
    return title, cleaned_text, discovered_pages, discovered_downloads


def extract_pdf_content(pdf_bytes: bytes) -> tuple[str, str]:
    """Extract text from raw PDF bytes using PyMuPDF."""
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    meta = doc.metadata or {}
    title = meta.get("title", "").strip()

    pages_text = []
    for i, page in enumerate(doc):
        t = page.get_text()
        if t and t.strip():
            pages_text.append(f"--- Page {i + 1} ---\n{t.strip()}")

    doc.close()
    full_text = "\n\n".join(pages_text).strip()
    return title, full_text


def fetch_sitemap_urls(session: requests.Session) -> tuple[set[str], set[str]]:
    """Fetch and parse available sitemaps for initial URLs and PDF documents."""
    page_urls = set()
    pdf_urls = set()

    for sitemap_url in SITEMAP_URLS:
        try:
            r = session.get(sitemap_url, timeout=12)
            if r.status_code == 200:
                root = ET.fromstring(r.content)
                for elem in root.iter():
                    if elem.tag.endswith("loc") and elem.text:
                        u = normalize_url(elem.text.strip())
                        if is_allowed_document_url(u) and (u.lower().endswith(".pdf") or ".pdf?" in u.lower()):
                            pdf_urls.add(u)
                        elif is_allowed_web_url(u):
                            page_urls.add(u)
        except Exception as e:
            print(f"[Notice] Sitemap {sitemap_url} fetch notice: {e}")

    return page_urls, pdf_urls


def crawl_gehu(max_pages: int = 100, output_dir: str = "gehu_data", request_delay: float = 0.3):
    """
    Main targeted crawler for collecting HTML pages and PDF documents from GEHU.
    """
    html_dir = os.path.join(output_dir, "html")
    pdf_dir = os.path.join(output_dir, "pdf")
    text_dir = os.path.join(output_dir, "text")

    os.makedirs(html_dir, exist_ok=True)
    os.makedirs(pdf_dir, exist_ok=True)
    os.makedirs(text_dir, exist_ok=True)

    dataset_path = os.path.join(output_dir, "dataset.json")
    errors_path = os.path.join(output_dir, "errors.json")
    missing_data_path = os.path.join(output_dir, "missing_data.json")
    collection_report_path = os.path.join(output_dir, "collection_report.json")

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    print("==================================================")
    print(f"STARTING ADVANCED GEHU DATA & DOCUMENT CRAWLER")
    print(f"Target Max Items: {max_pages}")
    print(f"Output Directory: {os.path.abspath(output_dir)}")
    print("==================================================")

    # 1. Discover URLs from Sitemaps
    print("\n[Phase 1] Discovering URLs from official sitemaps...")
    sitemap_pages, sitemap_pdfs = fetch_sitemap_urls(session)
    print(f"Discovered {len(sitemap_pages)} HTML pages and {len(sitemap_pdfs)} PDFs from sitemaps.")

    # 2. Build High-Priority Queues
    # Separate priority queues: (url, source_url, link_context)
    pdf_queue = []
    page_queue = []

    # Add sitemap PDFs to PDF queue
    for p_url in sitemap_pdfs:
        pdf_queue.append((p_url, None, "Sitemap PDF"))

    # Seed URLs always go first
    for s_url in SEED_URLS:
        page_queue.append((s_url, None))

    # Prioritize key academic, fee, notice, and course pages
    priority_terms = [
        "fee",
        "scholarship",
        "calendar",
        "exam",
        "schedule",
        "hostel",
        "anti-ragging",
        "grievance",
        "syllabus",
        "curriculum",
        "course",
        "placement",
        "btech",
        "cse",
        "mca",
        "bca",
        "mba",
        "pharmacy",
        "law",
        "agriculture",
    ]

    priority_sitemap_pages = []
    normal_sitemap_pages = []

    for url in sitemap_pages:
        if any(term in url.lower() for term in priority_terms):
            priority_sitemap_pages.append((url, None))
        else:
            normal_sitemap_pages.append((url, None))

    page_queue.extend(priority_sitemap_pages)
    page_queue.extend(normal_sitemap_pages)

    visited_urls = set()
    seen_content_hashes = set()
    collected_records = []
    errors = []

    # Topic coverage tracker: { topic: [url, ...] }
    topic_matches = {topic: [] for topic in TARGET_TOPICS}

    pages_found_total = len(page_queue) + len(pdf_queue)
    pages_collected = 0
    pdfs_collected = 0
    duplicate_count = 0

    print(f"\n[Phase 2] Executing targeted crawl & document downloads (Goal: {max_pages} items)...")

    # Main crawl loop: ensures healthy ratio of PDFs and HTML pages
    while (page_queue or pdf_queue) and (pages_collected + pdfs_collected) < max_pages:
        # Prioritize downloading PDFs whenever available (every 2-3 items)
        if pdf_queue and (len(collected_records) % 3 == 0 or not page_queue):
            target_url, source_url, link_context = pdf_queue.pop(0)
            is_pdf_item = True
        else:
            target_url, source_url = page_queue.pop(0)
            link_context = None
            is_pdf_item = False

        norm_url = normalize_url(target_url)
        if norm_url in visited_urls:
            duplicate_count += 1
            continue

        visited_urls.add(norm_url)
        time.sleep(request_delay)

        try:
            response = session.get(norm_url, timeout=15)
            if response.status_code != 200:
                errors.append({"url": norm_url, "error": f"HTTP {response.status_code}"})
                continue

            content_type = response.headers.get("Content-Type", "").lower()
            is_pdf = is_pdf_item or "application/pdf" in content_type or norm_url.lower().endswith(".pdf") or ".pdf?" in norm_url.lower()

            if is_pdf:
                # ---------------------------------------------
                # DOWNLOAD & PROCESS PDF DOCUMENT
                # ---------------------------------------------
                pdf_bytes = response.content
                if len(pdf_bytes) < 100:
                    errors.append({"url": norm_url, "error": "Empty or corrupted PDF payload"})
                    continue

                pdf_file_name = safe_filename(norm_url, "pdf")
                pdf_file_path = os.path.join(pdf_dir, pdf_file_name)

                # Save raw original PDF
                with open(pdf_file_path, "wb") as f:
                    f.write(pdf_bytes)

                pdf_title, pdf_text = extract_pdf_content(pdf_bytes)
                if not pdf_title or len(pdf_title) < 3:
                    pdf_title = link_context if (link_context and len(link_context) > 3) else (os.path.basename(urlparse(norm_url).path) or "GEHU Document")

                if not pdf_text or len(pdf_text.strip()) < 20:
                    # PDF contains scanned images without selectable text stream
                    errors.append({"url": norm_url, "error": "No selectable text stream in PDF (scanned/image only)"})
                    # Save placeholder with referring context so document metadata is preserved
                    pdf_text = f"Title: {pdf_title}\nSource Document URL: {norm_url}\nNotice: Scanned official GEHU document (saved as {pdf_file_name})."

                # Check duplicate content hash
                c_hash = hashlib.md5(pdf_text.encode("utf-8")).hexdigest()
                if c_hash in seen_content_hashes:
                    duplicate_count += 1
                    continue
                seen_content_hashes.add(c_hash)

                # Save extracted text
                text_file_name = safe_filename(norm_url, "txt")
                text_file_path = os.path.join(text_dir, text_file_name)
                with open(text_file_path, "w", encoding="utf-8") as f:
                    f.write(pdf_text)

                category = classify_category(norm_url, pdf_title, pdf_text)
                metadata = extract_metadata(norm_url, pdf_title, pdf_text)

                record = {
                    "title": pdf_title,
                    "url": norm_url,
                    "type": "pdf",
                    "category": category,
                    "source_url": source_url,
                    "document_url": norm_url,
                    "academic_year": metadata["academic_year"],
                    "semester": metadata["semester"],
                    "department": metadata["department"],
                    "program": metadata["program"],
                    "date": metadata["date"],
                    "fileName": pdf_file_name,
                    "content": pdf_text,
                }
                collected_records.append(record)
                pdfs_collected += 1

                # Update topic matches
                topics = match_target_topics(pdf_title, pdf_text, norm_url)
                for t in topics:
                    topic_matches[t].append(norm_url)

                print(f"[{pages_collected + pdfs_collected}/{max_pages}] [PDF] ({category}) {pdf_title[:45]} -> {norm_url[:65]}")

            else:
                # ---------------------------------------------
                # PROCESS HTML WEBPAGE & DISCOVER DOWNLOADS
                # ---------------------------------------------
                html_text = response.text
                html_file_name = safe_filename(norm_url, "html")
                html_file_path = os.path.join(html_dir, html_file_name)

                # Save raw HTML
                with open(html_file_path, "w", encoding="utf-8") as f:
                    f.write(html_text)

                title, clean_text, disc_pages, disc_downloads = clean_html_content(html_text, norm_url)

                # Queue newly discovered download links (PDFs) immediately
                for d_url, d_text in disc_downloads:
                    if d_url not in visited_urls:
                        pdf_queue.append((d_url, norm_url, d_text))

                # Queue newly discovered pages
                for p_url in disc_pages:
                    if p_url not in visited_urls:
                        page_queue.append((p_url, norm_url))

                if not clean_text or len(clean_text.strip()) < 40:
                    errors.append({"url": norm_url, "error": "Minimal or empty usable content"})
                    continue

                c_hash = hashlib.md5(clean_text.encode("utf-8")).hexdigest()
                if c_hash in seen_content_hashes:
                    duplicate_count += 1
                    continue
                seen_content_hashes.add(c_hash)

                # Save clean text
                text_file_name = safe_filename(norm_url, "txt")
                text_file_path = os.path.join(text_dir, text_file_name)
                with open(text_file_path, "w", encoding="utf-8") as f:
                    f.write(clean_text)

                category = classify_category(norm_url, title, clean_text)
                metadata = extract_metadata(norm_url, title, clean_text)

                # Associate first discovered download URL if relevant
                associated_doc_url = disc_downloads[0][0] if disc_downloads else None

                record = {
                    "title": title or "Graphic Era Hill University",
                    "url": norm_url,
                    "type": "html",
                    "category": category,
                    "source_url": source_url,
                    "document_url": associated_doc_url,
                    "academic_year": metadata["academic_year"],
                    "semester": metadata["semester"],
                    "department": metadata["department"],
                    "program": metadata["program"],
                    "date": metadata["date"],
                    "content": clean_text,
                }
                collected_records.append(record)
                pages_collected += 1

                # Update topic matches
                topics = match_target_topics(title, clean_text, norm_url)
                for t in topics:
                    topic_matches[t].append(norm_url)

                print(f"[{pages_collected + pdfs_collected}/{max_pages}] [HTML] ({category}) {title[:45]} -> {norm_url[:65]}")

        except requests.exceptions.Timeout:
            errors.append({"url": norm_url, "error": "Request Timeout"})
        except requests.exceptions.RequestException as e:
            errors.append({"url": norm_url, "error": str(e)})
        except Exception as e:
            errors.append({"url": norm_url, "error": f"Exception: {e}"})

    # Save primary dataset.json & errors.json
    print("\n[Phase 3] Generating final structured datasets and reports...")
    with open(dataset_path, "w", encoding="utf-8") as f:
        json.dump(collected_records, f, indent=4, ensure_ascii=False)

    with open(errors_path, "w", encoding="utf-8") as f:
        json.dump(errors, f, indent=4, ensure_ascii=False)

    # 4. Generate collection_report.json
    collection_report = {}
    missing_items = []

    for topic in TARGET_TOPICS:
        matched_urls = list(dict.fromkeys(topic_matches[topic]))
        count = len(matched_urls)

        if count >= 3:
            status = "FOUND"
        elif count >= 1:
            status = "PARTIAL"
        else:
            status = "NOT_FOUND"

        collection_report[topic] = {
            "status": status,
            "number_of_documents": count,
            "URLs": matched_urls[:10],  # show top 10 URLs
        }

        # If not found or partial, document in missing_data.json
        if status == "NOT_FOUND":
            missing_items.append({
                "item": topic,
                "status": "not_found",
                "searched_locations": ["academics", "departments", "notices-and-events", "exam-portal", "sitemaps"],
                "notes": "No publicly accessible standalone document found on official public website (may be restricted to internal ERP student.gehu.ac.in).",
            })

    with open(collection_report_path, "w", encoding="utf-8") as f:
        json.dump(collection_report, f, indent=4, ensure_ascii=False)

    with open(missing_data_path, "w", encoding="utf-8") as f:
        json.dump(missing_items, f, indent=4, ensure_ascii=False)

    # Category summary
    cat_counts = {}
    for r in collected_records:
        cat_counts[r["category"]] = cat_counts.get(r["category"], 0) + 1

    return {
        "pages_found_total": pages_found_total + len(visited_urls),
        "pages_collected": pages_collected,
        "pdfs_collected": pdfs_collected,
        "total_collected": len(collected_records),
        "failed_urls": len(errors),
        "duplicate_count": duplicate_count,
        "categories": cat_counts,
        "collection_report": collection_report,
        "dataset_path": os.path.abspath(dataset_path),
        "errors_path": os.path.abspath(errors_path),
        "missing_data_path": os.path.abspath(missing_data_path),
        "collection_report_path": os.path.abspath(collection_report_path),
    }


def main():
    parser = argparse.ArgumentParser(description="Advanced GEHU College RAG Data Collection & Scraping Tool")
    parser.add_argument(
        "--max-pages",
        type=int,
        default=100,
        help="Maximum number of items (HTML pages + PDFs) to collect. (Default: 100)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="gehu_data",
        help="Target folder for scraped files (Default: gehu_data)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.3,
        help="Polite request delay in seconds between downloads (Default: 0.3s)",
    )

    args = parser.parse_args()
    summary = crawl_gehu(max_pages=args.max_pages, output_dir=args.output_dir, request_delay=args.delay)

    print("\n==================================================")
    print("ADVANCED CRAWL COMPLETE SUMMARY")
    print("==================================================")
    print(f"• Total Records Collected: {summary['total_collected']}")
    print(f"  - HTML Webpages: {summary['pages_collected']}")
    print(f"  - Downloaded PDFs: {summary['pdfs_collected']}")
    print(f"• Failed / Scanned URLs Logged: {summary['failed_urls']}")
    print(f"• Duplicates Filtered: {summary['duplicate_count']}")
    print(f"• Categories Collected: {json.dumps(summary['categories'], indent=2)}")
    print(f"• Dataset Location: {summary['dataset_path']}")
    print(f"• Collection Report: {summary['collection_report_path']}")
    print(f"• Missing Data Log: {summary['missing_data_path']}")
    print("==================================================")


if __name__ == "__main__":
    main()
