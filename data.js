/* ============================================================
   IBlog — Global State & Data Store
   Central data source imported by all pages
   ============================================================ */

window.IBlog = window.IBlog || {};

// ─── State ───────────────────────────────────────────────
IBlog.state = {
  currentUser: null,
  articles: [],
  savedArticles: [],
  accentKey: 'gold',
  darkMode: false,
  podStates: {},
  podTimers: {},
  podVoicePrefs: {},
  joinedCommunities: new Set(),
};

// ─── Accent Themes ───────────────────────────────────────
IBlog.ACCENTS = [
  {key:'gold',   name:'Gold',       r:184, g:150, b:12,  hex:'#b8960c', a2:'#d4780a'},
  {key:'amber',  name:'Amber',      r:200, g:146, b:42,  hex:'#c8922a', a2:'#e85d3a'},
  {key:'sage',   name:'Sage',       r:76,  g:140, b:95,  hex:'#4c8c5f', a2:'#3a7fa0'},
  {key:'blue',   name:'Blue',       r:60,  g:100, b:180, hex:'#3c64b4', a2:'#7c6eff'},
  {key:'rose',   name:'Rose',       r:190, g:70,  b:100, hex:'#be4664', a2:'#e85d3a'},
  {key:'terra',  name:'Terracotta', r:185, g:95,  b:60,  hex:'#b95f3c', a2:'#d4a017'},
];

// ─── Categories ──────────────────────────────────────────
IBlog.CATEGORIES = [
  'AI','Technology','Science','Culture','Startups','Health',
  'Philosophy','Finance','Climate','Education','Psychology',
  'Design','Politics','Sports','Travel','Food','History',
  'Literature','Music','Gaming','Crypto','Space','Law',
  'Architecture','Environment','Neuroscience','Sociology'
];

// ─── Topics (for chips) ───────────────────────────────────
IBlog.TOPICS = [
  'AI workflows',
  'Product design',
  'Remote teams',
  'Creator economy',
  'Climate reporting',
  'Startup playbooks',
  'Writing systems',
  'Travel culture'
];

// ─── Authors ─────────────────────────────────────────────
IBlog.AUTHORS = [];

// ─── Articles ────────────────────────────────────────────
IBlog.SEED_ARTICLES = [
  {
    id: 9001,
    authorId: 0,
    author: 'Olfa Ben Salem',
    authorInitial: 'O',
    authorEmail: 'olfa.editor@example.com',
    authorAvatar: '',
    cat: 'Technology',
    category: 'Technology',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    title: 'How Small Editorial Teams Use AI Without Losing Their Voice',
    excerpt: 'A practical guide to using AI as an assistant for research, outlines, and production while keeping the human tone readers trust.',
    body: `Small editorial teams rarely need more tools. They need more clarity.\n\nThe best AI workflows do not replace a writer's voice. They shorten repetitive work, preserve research trails, and help teams spend more time shaping ideas readers actually remember.\n\nThe most reliable setup is simple: use AI to collect references, organize messy notes, and draft first-pass structures. Then let the writer rebuild the piece with real judgment, examples, and point of view.\n\nThat balance is what separates useful publishing systems from noisy content mills.`,
    readTime: '6 min',
    likes: 148,
    comments: [],
    reposts: 19,
    bookmarked: false,
    liked: false,
    quality: 'high',
    isPremiumAuthor: false,
    tags: ['AI', 'Writing', 'Editorial'],
    date: 'Apr 24, 2026',
    status: 'published',
    views: 1320
  },
  {
    id: 9002,
    authorId: 0,
    author: 'Farid Gharbi',
    authorInitial: 'F',
    authorEmail: 'farid.product@example.com',
    authorAvatar: '',
    cat: 'Design',
    category: 'Design',
    img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80',
    cover: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80',
    title: 'Design Systems Grow Faster When Writers Sit in the Review Loop',
    excerpt: 'Documentation quality changes adoption speed. Here is why content design belongs inside component reviews, not after them.',
    body: `A design system is not only a collection of components. It is a shared language.\n\nWhen writers join the review loop, labels improve, empty states become clearer, and documentation starts answering the questions teams actually ask. Adoption goes up because the system feels easier to trust.\n\nStrong systems reduce ambiguity. That means naming patterns carefully, writing examples that feel real, and treating microcopy as part of the product architecture.`,
    readTime: '5 min',
    likes: 102,
    comments: [],
    reposts: 14,
    bookmarked: false,
    liked: false,
    quality: 'high',
    isPremiumAuthor: false,
    tags: ['Design', 'Systems', 'Product'],
    date: 'Apr 22, 2026',
    status: 'published',
    views: 970
  },
  {
    id: 9003,
    authorId: 0,
    author: 'Maya Stone',
    authorInitial: 'M',
    authorEmail: 'maya.remote@example.com',
    authorAvatar: '',
    cat: 'Startups',
    category: 'Startups',
    img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80',
    cover: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80',
    title: 'The Remote Team Playbook That Keeps Weekly Publishing on Schedule',
    excerpt: 'A lightweight operating rhythm for small startup teams that want consistent articles, clean approvals, and fewer publishing delays.',
    body: `Consistency is usually a scheduling problem before it is a talent problem.\n\nTeams that publish every week tend to use the same lightweight structure: one owner, one reviewer, one deadline for facts, and one deadline for edits. That rhythm reduces last-minute rewriting and keeps content from disappearing into chat threads.\n\nA simple cadence beats a complicated tool stack. If everyone knows what "ready for review" means, publishing starts feeling calm again.`,
    readTime: '7 min',
    likes: 176,
    comments: [],
    reposts: 23,
    bookmarked: false,
    liked: false,
    quality: 'high',
    isPremiumAuthor: true,
    tags: ['Startups', 'Remote Work', 'Operations'],
    date: 'Apr 20, 2026',
    status: 'published',
    views: 1560
  },
  {
    id: 9004,
    authorId: 0,
    author: 'Nour Ben Ali',
    authorInitial: 'N',
    authorEmail: 'nour.travel@example.com',
    authorAvatar: '',
    cat: 'Travel',
    category: 'Travel',
    img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    title: 'Why Local Travel Stories Convert Better Than Generic City Guides',
    excerpt: 'Readers trust articles that feel lived-in. These small editorial choices make destination writing more useful and more believable.',
    body: `The strongest travel writing feels specific.\n\nReaders remember the bakery queue before sunrise, the honest warning about taxi routes, and the neighborhood that changes its mood after dark. Those details do more than add charm. They create trust.\n\nLocal stories also travel farther because they feel personal instead of copied. That makes them more shareable, more searchable, and easier to revisit later.`,
    readTime: '4 min',
    likes: 89,
    comments: [],
    reposts: 9,
    bookmarked: false,
    liked: false,
    quality: 'high',
    isPremiumAuthor: false,
    tags: ['Travel', 'Culture', 'Storytelling'],
    date: 'Apr 18, 2026',
    status: 'published',
    views: 760
  },
  {
    id: 9005,
    authorId: 0,
    author: 'Jordan Lee',
    authorInitial: 'J',
    authorEmail: 'jordan.creators@example.com',
    authorAvatar: '',
    cat: 'Culture',
    category: 'Culture',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    cover: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    title: 'Creators Keep Winning When Communities Feel Smaller Than They Are',
    excerpt: 'The most engaging platforms create intimacy at scale. Here is how small signals make large communities feel human.',
    body: `Community design is often a question of emotional distance.\n\nWhen people feel seen, they stay. That can come from simple things: clearer replies, better author pages, and recommendations that reflect real participation instead of pure volume.\n\nThe strongest communities do not only grow. They keep shrinking the feeling of distance between a person and the platform.`,
    readTime: '5 min',
    likes: 121,
    comments: [],
    reposts: 17,
    bookmarked: false,
    liked: false,
    quality: 'high',
    isPremiumAuthor: false,
    tags: ['Culture', 'Community', 'Creators'],
    date: 'Apr 16, 2026',
    status: 'published',
    views: 1110
  }
];

// ─── Communities ─────────────────────────────────────────
IBlog.COMMUNITIES = [];

// ─── Country Data for Map ─────────────────────────────────
IBlog.COUNTRY_DATA = (() => {
  const makeCountry = (flag, coords, summary, topics, articles) => ({
    flag,
    coords,
    summary,
    topics,
    articles: articles.map(([title, author, readTime = '5 min']) => ({
      title,
      author,
      readTime,
      img: '',
    })),
  });

  return {
    World: makeCountry('🌐', [20, 10], 'A fast global pulse built from the most active reading regions.', ['Global', 'Trending', 'Editors Pick'], [
      ['What People Are Reading This Week', 'IBlog Editors'],
      ['The Global Knowledge Shift', 'IBlog Data Desk'],
      ['Why Local Stories Travel Farther Than Ever', 'IBlog Insight Team'],
    ]),
    USA: makeCountry('🇺🇸', [39, -98], 'Startup culture, AI product launches, and creator economy momentum.', ['AI', 'Startups', 'Design'], [
      ['AI Product Teams Are Rewriting the Roadmap', 'Maya Stone'],
      ['Creator Tools That Turn Ideas Into Revenue', 'Jordan Lee'],
    ]),
    UK: makeCountry('🇬🇧', [54, -2], 'Policy, design systems, and investigative long-form reporting.', ['Politics', 'Design', 'Finance'], [
      ['The New City Media Playbook', 'Alice Reed'],
      ['How Designers Are Shaping Public Services', 'Noah Grant'],
    ]),
    France: makeCountry('🇫🇷', [46.2, 2.2], 'Culture, philosophy, and premium editorial storytelling.', ['Culture', 'Philosophy', 'Art'], [
      ['Why Essays Are Winning Back Attention', 'Claire Martin'],
      ['The Return of Slow Journalism', 'Julien Moreau'],
    ]),
    Germany: makeCountry('🇩🇪', [51, 10], 'Deep technical writing and clean product thinking.', ['Technology', 'Science', 'Architecture'], [
      ['What Solid Engineering Looks Like in 2026', 'Lena Vogel'],
      ['Industrial Design Meets Sustainable Systems', 'Tom Becker'],
    ]),
    India: makeCountry('🇮🇳', [21, 78], 'Scale, education, and mobile-first publishing habits.', ['Education', 'Technology', 'Crypto'], [
      ['Learning Platforms Built for the Next Billion Readers', 'Anika Sharma'],
      ['Why Mobile Storytelling Dominates in India', 'Rohit Verma'],
    ]),
    Japan: makeCountry('🇯🇵', [36, 138], 'Precision, product craft, and future-facing culture pieces.', ['Gaming', 'Design', 'Space'], [
      ['Minimal Interfaces, Maximum Trust', 'Haruka Sato'],
      ['From Tokyo Labs to Global Products', 'Kenji Tanaka'],
    ]),
    Brazil: makeCountry('🇧🇷', [-14, -52], 'Music, creator communities, and social storytelling.', ['Music', 'Culture', 'Sports'], [
      ['The Rise of Community-Driven Media', 'Ana Costa'],
      ['How Music Scenes Build New Audiences', 'Lucas Pereira'],
    ]),
    UAE: makeCountry('🇦🇪', [24.4, 54.4], 'Premium entrepreneurship, finance, and future cities.', ['Finance', 'Startups', 'Travel'], [
      ['Future Cities and the Newsroom of Tomorrow', 'Sara Al Nuaimi'],
      ['Capital, Culture, and the New Gulf Audience', 'Omar Khalid'],
    ]),
    Singapore: makeCountry('🇸🇬', [1.35, 103.8], 'Regional tech, logistics, and cross-border knowledge flows.', ['Technology', 'Finance', 'Law'], [
      ['How Small Markets Influence Big Products', 'Wei Chen'],
      ['Cross-Border Readers Want Clarity, Not Noise', 'Priya Nair'],
    ]),
    Tunisia: makeCountry('🇹🇳', [34, 9], 'North African innovation, culture, and bilingual publishing.', ['Travel', 'Culture', 'Education'], [
      ['Creators Building Bilingual Audiences', 'Nour Ben Ali'],
      ['From Tunis to the World: Local Ideas With Reach', 'Youssef Haddad'],
    ]),
    Canada: makeCountry('🇨🇦', [56.1, -106.3], 'Research, climate, and thoughtful long-form analysis.', ['Climate', 'Science', 'Health'], [
      ['The Climate Story Readers Keep Returning To', 'Emily Clarke'],
      ['Research Notes That Feel Human', 'Oliver Bennett'],
    ]),
    Australia: makeCountry('🇦🇺', [-25, 133], 'Remote work, design, and the next generation of communities.', ['Travel', 'Design', 'Environment'], [
      ['Distributed Teams Are Changing Publishing', 'Grace Wilson'],
      ['Why Outdoor Culture Shifts Digital Habits', 'Mason Taylor'],
    ]),
    'South Korea': makeCountry('🇰🇷', [36.5, 127.9], 'Fast product cycles, entertainment, and audience velocity.', ['Gaming', 'Technology', 'Music'], [
      ['Fast Iteration, Clear Identity', 'Minji Park'],
      ['Entertainment Platforms as Knowledge Engines', 'Joon Kim'],
    ]),
    Morocco: makeCountry('🇲🇦', [31.8, -7.1], 'Tourism, creators, and regional business growth.', ['Travel', 'Culture', 'Startups'], [
      ['Local Travel Stories That Sell the Destination', 'Salma El Idrissi'],
      ['How Founders Are Building for the Region', 'Yassine El Amrani'],
    ]),
    'Saudi Arabia': makeCountry('🇸🇦', [23.9, 45.1], 'Investment, future cities, and large-scale transformation.', ['Politics', 'Finance', 'Space'], [
      ['Big Infrastructure, Bigger Audience Expectations', 'Leen Alharbi'],
      ['What Readers Want From a Rapidly Changing Gulf', 'Fahad Alqahtani'],
    ]),
    Spain: makeCountry('🇪🇸', [40.4, -3.7], 'Creative media, architecture, and reflective long-form culture writing.', ['Culture', 'Architecture', 'Travel'], [
      ['How Editorial Design Shapes City Stories', 'Lucia Navarro'],
      ['Mediterranean Storytelling in a Digital Era', 'Javier Ortiz'],
    ]),
    Italy: makeCountry('🇮🇹', [41.9, 12.5], 'Heritage, design, and modern craftsmanship in publishing.', ['Design', 'History', 'Food'], [
      ['Craft, Taste, and the Future of Lifestyle Writing', 'Giulia Conti'],
      ['Why Beautiful Interfaces Still Matter', 'Marco Bellini'],
    ]),
    Portugal: makeCountry('🇵🇹', [39.4, -8.2], 'Remote work, ocean economy, and human-centered travel narratives.', ['Travel', 'Startups', 'Environment'], [
      ['The Atlantic Coast as a Creative Workspace', 'Ines Duarte'],
      ['Small Countries, Global Creative Reach', 'Rui Matos'],
    ]),
    Mexico: makeCountry('🇲🇽', [23.6, -102.5], 'Culture, entrepreneurship, and strong community-led storytelling.', ['Culture', 'Business', 'Food'], [
      ['How Community Media Builds Trust Faster', 'Andrea Solis'],
      ['Food Writing That Carries Identity', 'Diego Herrera'],
    ]),
    Argentina: makeCountry('🇦🇷', [-38.4, -63.6], 'Economics, long-form essays, and emerging creator circles.', ['Economics', 'Culture', 'Writing'], [
      ['Why Essays Still Move Audiences', 'Valentina Rios'],
      ['Creator Economies During Uncertain Times', 'Nicolas Vega'],
    ]),
    Chile: makeCountry('🇨🇱', [-35.7, -71.5], 'Climate, science, and careful policy analysis.', ['Climate', 'Science', 'Politics'], [
      ['What Coastal Cities Teach Us About Climate Adaptation', 'Camila Fuentes'],
      ['Science Writing With Civic Impact', 'Tomas Araya'],
    ]),
    Nigeria: makeCountry('🇳🇬', [9.1, 8.7], 'Fintech, youth media, and bold entrepreneurial momentum.', ['Finance', 'Startups', 'Technology'], [
      ['Fintech Stories People Actually Finish Reading', 'Amina Yusuf'],
      ['The New Confidence of African Product Writing', 'Chinedu Okafor'],
    ]),
    Kenya: makeCountry('🇰🇪', [-0.1, 37.9], 'Climate innovation, agriculture, and regional entrepreneurship.', ['Environment', 'Business', 'Education'], [
      ['How Climate Startups Earn Public Trust', 'Wanjiku Njeri'],
      ['Agritech Narratives That Change Behavior', 'Brian Otieno'],
    ]),
    Egypt: makeCountry('🇪🇬', [26.8, 30.8], 'History, civic writing, and high-interest educational content.', ['History', 'Education', 'Politics'], [
      ['Why Historical Writing Feels New Again', 'Laila Hassan'],
      ['Learning Content That Travels Beyond the Classroom', 'Karim Adel'],
    ]),
    Algeria: makeCountry('🇩🇿', [28, 1.6], 'Energy, regional policy, and thoughtful social commentary.', ['Politics', 'Energy', 'Culture'], [
      ['Energy Reporting Readers Can Actually Understand', 'Sofiane Meziane'],
      ['Regional Commentary Without the Noise', 'Amel Benyahia'],
    ]),
    Turkey: makeCountry('🇹🇷', [39, 35.2], 'Geopolitics, design culture, and audience-rich explanatory writing.', ['Politics', 'Design', 'Travel'], [
      ['Explainers That Make Complex Regions Legible', 'Ece Demir'],
      ['Where Design and Journalism Meet', 'Mert Kaya'],
    ]),
    Qatar: makeCountry('🇶🇦', [25.3, 51.2], 'Global business, sports media, and polished premium editorial.', ['Sports', 'Finance', 'Media'], [
      ['Premium Sports Coverage Beyond the Headlines', 'Noor Al Thani'],
      ['What Business Readers Want From Fast News', 'Hamad Jaber'],
    ]),
    Indonesia: makeCountry('🇮🇩', [-2.5, 118], 'Mobile-first audiences, creator education, and social media insight.', ['Technology', 'Education', 'Culture'], [
      ['What Mobile Readers Reward With Attention', 'Ayu Prasetyo'],
      ['Creator Education for Massive Audiences', 'Rizky Mahendra'],
    ]),
    Malaysia: makeCountry('🇲🇾', [4.2, 102], 'Cross-border business, AI operations, and multilingual media.', ['Business', 'AI', 'Culture'], [
      ['How Multilingual Publishing Changes Product Decisions', 'Nadia Rahman'],
      ['Operational AI With Real Business Value', 'Farid Iskandar'],
    ]),
    Thailand: makeCountry('🇹🇭', [15.8, 101], 'Hospitality, creator-led commerce, and design-aware storytelling.', ['Travel', 'Design', 'Business'], [
      ['When Hospitality Becomes a Content Advantage', 'Narin Chaiyo'],
      ['The New Aesthetic of Commerce Media', 'Pimlada Sae-Lim'],
    ]),
    Philippines: makeCountry('🇵🇭', [12.8, 121.8], 'Community reporting, education, and resilient digital audiences.', ['Education', 'Culture', 'Media'], [
      ['Community Journalism That Feels Close to Home', 'Mika Santos'],
      ['Education Creators Building Real Trust', 'Paolo Reyes'],
    ]),
    China: makeCountry('🇨🇳', [35.8, 104.2], 'Manufacturing insight, product strategy, and deep technology coverage.', ['Technology', 'Business', 'Science'], [
      ['What Manufacturing Teaches Product Teams', 'Lin Zhao'],
      ['Deep Tech Writing With Global Reach', 'Qian Xu'],
    ]),
    'South Africa': makeCountry('🇿🇦', [-30.6, 22.9], 'Climate justice, business writing, and powerful cultural reporting.', ['Climate', 'Business', 'Culture'], [
      ['Climate Justice Stories People Share', 'Thandi Mokoena'],
      ['Business Writing With Real Local Stakes', 'Kagiso Dlamini'],
    ]),
    'New Zealand': makeCountry('🇳🇿', [-40.9, 174.9], 'Environmental reporting, design, and quiet long-form excellence.', ['Environment', 'Design', 'Travel'], [
      ['Nature Reporting With Emotional Clarity', 'Aria Thompson'],
      ['Why Calm Design Wins Reader Loyalty', 'Ethan McKenzie'],
    ]),
  };
})();

// ─── Trends ───────────────────────────────────────────────
IBlog.TRENDS = [
  { rank: 1, topic: 'AI workflows', searches: '12.4k', spike: '+38%', icon: 'AI' },
  { rank: 2, topic: 'Remote teams', searches: '9.1k', spike: '+24%', icon: 'RM' },
  { rank: 3, topic: 'Design systems', searches: '8.7k', spike: '+19%', icon: 'DS' },
  { rank: 4, topic: 'Creator economy', searches: '7.8k', spike: '+17%', icon: 'CE' },
  { rank: 5, topic: 'Local travel', searches: '6.9k', spike: '+14%', icon: 'TR' }
];

// ─── Templates ────────────────────────────────────────────
IBlog.TEMPLATES = [
  {icon:"📋",name:"Listicle",desc:"Numbered insights",structure:["Intro — Why This List Matters","Point 1 with Context","Point 2 with Context","Points 3–N…","Takeaway Summary"]},
  {icon:"🎓",name:"Tutorial",desc:"Step-by-step guide",structure:["Prerequisites & Overview","Step 1 — Setup","Step 2 — Core Logic","Step 3 — Testing","Troubleshooting & Next Steps"]},
  {icon:"📊",name:"Case Study",desc:"Real-world analysis",structure:["The Challenge","Context & Background","Solution Implemented","Results & Metrics","Lessons Learned"]},
  {icon:"🔭",name:"Trend Report",desc:"Emerging topic deep-dive",structure:["Signal — What's Changing","Data & Evidence","Expert Perspectives","Implications for You","What to Watch Next"]},
  {icon:"💡",name:"Explainer",desc:"Concept breakdown",structure:["The Question / Concept","Why It Matters","Plain-English Explanation","Real-World Examples","Further Reading"]},
  {icon:"🗣️",name:"Interview",desc:"Q&A format",structure:["Guest Introduction","Topic 1 Q&A","Topic 2 Q&A","Topic 3 Q&A","Key Takeaways"]},
  {icon:"📖",name:"Narrative",desc:"Story-driven piece",structure:["Scene Setting / Hook","Rising Tension / Problem","Turning Point","Resolution","Reflection & Meaning"]},
  {icon:"⚔️",name:"Comparison",desc:"X vs Y breakdown",structure:["Introduction — The Stakes","Option A — Strengths & Weaknesses","Option B — Strengths & Weaknesses","Head-to-Head Matrix","Verdict & Recommendation"]},
  {icon:"🧵",name:"Thread",desc:"Twitter-style breakdown",structure:["Hook — The Big Idea","1/ First key point","2/ Second key point","3/ Third key point","🧵 Final thread summary"]},
];

// ─── Utility: shared functions ────────────────────────────
IBlog.utils = {
  randomDate(){
    const m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
    return `${m[Math.floor(Math.random()*8)]} ${Math.floor(Math.random()*28)+1}, 2026`;
  },
  toInitial(name){ return name?name[0].toUpperCase():'?'; },
  timeAgo(d){ return '5 min ago'; },
  toast(msg, type=''){
    const t = document.getElementById('global-toast');
    if(!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove('show'), 2800);
  },
  applyAccent(key){
    const ac = IBlog.ACCENTS.find(a=>a.key===key) || IBlog.ACCENTS[0];
    const r = document.documentElement;
    r.style.setProperty('--accent', ac.hex);
    r.style.setProperty('--accent-r', ac.r);
    r.style.setProperty('--accent-g', ac.g);
    r.style.setProperty('--accent-b', ac.b);
    r.style.setProperty('--accent2', ac.a2);
    IBlog.state.accentKey = key;
    document.querySelectorAll('.accent-dot').forEach(d=>{
      d.classList.toggle('active', d.dataset.key===key);
    });
  },
  applyDark(dark){
    document.body.classList.toggle('dark', dark);
    IBlog.state.darkMode = dark;
    const toggle = document.getElementById('darkToggleInput');
    if(toggle) toggle.checked = dark;
    const label = document.getElementById('darkToggleLabel');
    if(label) label.textContent = dark ? '🌙 Dark' : '☀️ Light';
  },
  formatNumber(n){ return n >= 1000 ? (n/1000).toFixed(1)+'k' : n; }
};

// ─── Init state from seed ─────────────────────────────────
IBlog.state.articles = [];

/* ============================================================
   Auth Component — signup, signin, premium gate, plan picker
   ============================================================ */

