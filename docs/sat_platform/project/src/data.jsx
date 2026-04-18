// ------------------------------------------------------------
// SAT Analytics — mock data (one source of truth for the page)
// ------------------------------------------------------------

window.DATA = (() => {
  // 6 attempts — user is grinding and rising
  const attempts = [
    { n: 1, date: '12 Nov', total: 980,  rw: 490, math: 490, accuracy: 54, time: '2h 48m', timeMin: 168 },
    { n: 2, date: '04 Dec', total: 1050, rw: 520, math: 530, accuracy: 58, time: '2h 41m', timeMin: 161 },
    { n: 3, date: '28 Dec', total: 1130, rw: 570, math: 560, accuracy: 63, time: '2h 35m', timeMin: 155 },
    { n: 4, date: '18 Jan', total: 1200, rw: 600, math: 600, accuracy: 67, time: '2h 30m', timeMin: 150 },
    { n: 5, date: '09 Feb', total: 1270, rw: 630, math: 640, accuracy: 71, time: '2h 24m', timeMin: 144 },
    { n: 6, date: '14 Mar', total: 1340, rw: 670, math: 670, accuracy: 76, time: '2h 19m', timeMin: 139, latest: true },
  ];

  // Named US colleges with SAT 25th–75th percentile cutoffs (approximate, mock)
  // Tiers: reach (75th pct+), match (in range), safety (above 75th pct)
  const colleges = [
    { name: 'MIT',                 cutoff: 1540, tier: 'Elite',     flag: '🇺🇸', aidPct: 100, logo: 'MIT' },
    { name: 'Stanford',            cutoff: 1530, tier: 'Elite',     flag: '🇺🇸', aidPct: 100, logo: 'SU'  },
    { name: 'Princeton',           cutoff: 1520, tier: 'Elite',     flag: '🇺🇸', aidPct: 100, logo: 'P'   },
    { name: 'Columbia',            cutoff: 1510, tier: 'Elite',     flag: '🇺🇸', aidPct: 100, logo: 'C'   },
    { name: 'Cornell',             cutoff: 1480, tier: 'Top-20',    flag: '🇺🇸', aidPct: 60,  logo: 'C'   },
    { name: 'Carnegie Mellon',     cutoff: 1480, tier: 'Top-20',    flag: '🇺🇸', aidPct: 55,  logo: 'CMU' },
    { name: 'UC Berkeley',         cutoff: 1440, tier: 'Top-20',    flag: '🇺🇸', aidPct: 40,  logo: 'UCB' },
    { name: 'UCLA',                cutoff: 1410, tier: 'Top-50',    flag: '🇺🇸', aidPct: 35,  logo: 'UCLA'},
    { name: 'NYU',                 cutoff: 1400, tier: 'Top-50',    flag: '🇺🇸', aidPct: 45,  logo: 'NYU' },
    { name: 'U. Michigan',         cutoff: 1390, tier: 'Top-50',    flag: '🇺🇸', aidPct: 30,  logo: 'UM'  },
    { name: 'Purdue',              cutoff: 1350, tier: 'Top-50',    flag: '🇺🇸', aidPct: 40,  logo: 'P'   },
    { name: 'UT Austin',           cutoff: 1340, tier: 'Top-100',   flag: '🇺🇸', aidPct: 35,  logo: 'UT'  },
    { name: 'Boston University',   cutoff: 1340, tier: 'Top-100',   flag: '🇺🇸', aidPct: 50,  logo: 'BU'  },
    { name: 'Penn State',          cutoff: 1300, tier: 'Top-100',   flag: '🇺🇸', aidPct: 25,  logo: 'PSU' },
    { name: 'ASU',                 cutoff: 1260, tier: 'Top-100',   flag: '🇺🇸', aidPct: 40,  logo: 'ASU' },
    { name: 'BITS Pilani (US prog)',cutoff: 1250,tier: 'Top-100',   flag: '🇮🇳', aidPct: 20,  logo: 'BITS'},
    { name: 'Ashoka University',   cutoff: 1200, tier: 'Accessible',flag: '🇮🇳', aidPct: 50,  logo: 'A'   },
    { name: 'Flame University',    cutoff: 1150, tier: 'Accessible',flag: '🇮🇳', aidPct: 40,  logo: 'F'   },
    { name: 'Symbiosis SLS',       cutoff: 1100, tier: 'Accessible',flag: '🇮🇳', aidPct: 30,  logo: 'SSLS'},
  ];

  const tiers = [
    { key: 'Accessible', label: 'Accessible',  min: 1000, max: 1199, color: 'zinc'   },
    { key: 'Top-100',    label: 'Top-100',     min: 1200, max: 1349, color: 'teal'   },
    { key: 'Top-50',     label: 'Top-50',      min: 1350, max: 1429, color: 'blue'   },
    { key: 'Top-20',     label: 'Top-20',      min: 1430, max: 1499, color: 'violet' },
    { key: 'Elite',      label: 'Elite / Ivy', min: 1500, max: 1600, color: 'amber'  },
  ];

  // Concept mastery — weakest first on latest attempt
  // section: 'R&W' or 'Math'
  // impact = points potentially gained if this concept is fixed to 90% (rough heuristic for leverage)
  const concepts = [
    { concept: 'Systems of Linear Equations',   section:'Math', domain:'Algebra',        history:[30,42,50,55,58,62], mastery:62, missed:7, total:12, impact:22, avgTime: 92, targetTime: 75, youtube: { title:'Systems of Linear Equations — SAT Math', channel:'The Organic Chemistry Tutor', duration:'11:42', views:'2.1M', id:'V6Xynlqc_tc' } },
    { concept: 'Command of Evidence',           section:'R&W',  domain:'Information & Ideas', history:[40,48,54,58,62,65], mastery:65, missed:5, total:9, impact:18, avgTime:84, targetTime: 72, youtube: { title:'SAT Command of Evidence — walkthrough', channel:'Khan Academy', duration:'14:05', views:'884K', id:'s8zZjQEzPgo' } },
    { concept: 'Boundaries (punctuation)',       section:'R&W', domain:'Standard English',history:[38,45,55,62,66,68], mastery:68, missed:6, total:11, impact:16, avgTime:40, targetTime:35, youtube: { title:'SAT Punctuation Rules Mastered', channel:'SuperTutorTV', duration:'18:12', views:'523K', id:'Fh3Jxm3I3mk' } },
    { concept: 'Ratios, Rates & Proportions',   section:'Math', domain:'Problem Solving',history:[48,55,62,68,72,74], mastery:74, missed:4, total:10, impact:12, avgTime:78, targetTime:60, youtube: { title:'Ratios & Proportions — Digital SAT', channel:'Scalar Learning', duration:'9:48', views:'312K', id:'0yfpz-kW_8I' } },
    { concept: 'Central Ideas & Themes',        section:'R&W',  domain:'Information & Ideas', history:[55,62,70,76,80,82], mastery:82, missed:2, total:8,  impact:6, avgTime:68, targetTime:65, youtube: { title:'Central Ideas — SAT Reading', channel:'UWorld SAT', duration:'12:30', views:'198K', id:'8FgH9pQ6WnE' } },
    { concept: 'Nonlinear Functions',           section:'Math', domain:'Advanced Math',  history:[58,66,74,80,85,88], mastery:88, missed:1, total:9,  impact:3, avgTime:110,targetTime:100,youtube: { title:'Nonlinear Functions on Digital SAT', channel:'Scalar Learning', duration:'16:24', views:'142K', id:'ZRwCp0vg-LU' } },
    { concept: 'Transitions',                   section:'R&W',  domain:'Expression of Ideas', history:[50,58,64,70,74,77], mastery:77, missed:2, total:7,  impact:8, avgTime:42, targetTime:35, youtube: { title:'Transition Words — Digital SAT', channel:'The Tutorverse', duration:'8:10', views:'88K', id:'gGzPsC0sPgU' } },
    { concept: 'Geometry & Trigonometry',       section:'Math', domain:'Geometry',       history:[45,55,62,68,73,76], mastery:76, missed:3, total:8,  impact:10, avgTime:95, targetTime:80, youtube: { title:'Geometry on Digital SAT', channel:'Scalar Learning', duration:'21:05', views:'276K', id:'cMcMGQh-TQY' } },
  ];

  // Mistake taxonomy for latest attempt
  const mistakes = {
    total: 29,
    careless:   { count: 11, label: 'Careless',       color:'amber',   examples:['Sign error on −3x', 'Misread "NOT" in question', 'Ticked C meant to tick B'] },
    conceptual: { count: 9,  label: 'Conceptual gap', color:'rose',    examples:['Didn\'t know combining equations trick','Parabola vertex form unfamiliar','Gerund vs participle'] },
    timing:     { count: 6,  label: 'Time pressure',  color:'blue',    examples:['Last 4 Qs of Math Module 2 rushed','Ran out of time on Reading passage 3'] },
    strategy:   { count: 3,  label: 'Strategy',       color:'violet',  examples:['Spent 4 min on 1 hard Q — should have flagged','Didn\'t use process of elimination'] },
  };

  // Difficulty split
  const difficulty = [
    { tier:'Easy',   correct: 42, total: 48, color:'emerald' },
    { tier:'Medium', correct: 29, total: 44, color:'amber'   },
    { tier:'Hard',   correct: 12, total: 28, color:'rose'    },
  ];

  // Pacing — time spent per question, split by section, shown as per-question dots
  // Module 1 RW = 27, Module 2 RW = 27, Module 1 Math = 22, Module 2 Math = 22
  // avg target: RW ~71s, Math ~95s. values in seconds.
  const mkPace = (n, avgTarget, variance, wrongRate=0.2) => {
    const out = [];
    for (let i=0;i<n;i++){
      const noise = (Math.sin(i*1.7) + Math.cos(i*0.9)) * variance;
      const surge = (i > n-5) ? (i - (n-5)) * 12 : 0; // rush at end
      out.push({ i: i+1, sec: Math.max(15, Math.round(avgTarget + noise + surge)), correct: Math.random() > wrongRate });
    }
    return out;
  };
  const pacing = {
    modules: [
      { key:'rw1',   label:'R&W · Module 1',   target:71, data: mkPace(27, 62, 18, 0.18) },
      { key:'rw2',   label:'R&W · Module 2',   target:71, data: mkPace(27, 74, 22, 0.30) },
      { key:'math1', label:'Math · Module 1',  target:95, data: mkPace(22, 88, 25, 0.20) },
      { key:'math2', label:'Math · Module 2',  target:95, data: mkPace(22, 102,30, 0.35) },
    ],
  };

  // Peer percentile
  const peer = {
    percentileOverall: 78,   // among SAT repeaters on platform
    percentileRw: 82,
    percentileMath: 74,
    improvementPercentile: 92, // improvement rate (delta over attempts)
    cohortSize: 48210,
  };

  // Section breakdown (latest attempt)
  const sectionBreakdown = [
    { label:'R&W · Module 1', correct: 19, total: 27, time: '30:12', color:'emerald' },
    { label:'R&W · Module 2', correct: 18, total: 27, time: '32:48', color:'amber'   },
    { label:'Math · Module 1',correct: 18, total: 22, time: '33:05', color:'emerald' },
    { label:'Math · Module 2',correct: 17, total: 22, time: '34:55', color:'amber'   },
  ];

  // Study plan — curated this week, built from leverage weaknesses
  const studyPlan = {
    weekLabel: 'Week of 17 Mar',
    projectedGain: 48,
    days: [
      { day:'Mon', focus:'Systems of Linear Eq.', videoId:'V6Xynlqc_tc', minutes:35, drills:12 },
      { day:'Tue', focus:'Command of Evidence',   videoId:'s8zZjQEzPgo', minutes:30, drills:10 },
      { day:'Wed', focus:'Boundaries · Commas',   videoId:'Fh3Jxm3I3mk', minutes:25, drills:15 },
      { day:'Thu', focus:'Systems (review)',       videoId:'V6Xynlqc_tc', minutes:20, drills:8  },
      { day:'Fri', focus:'Ratios · Word Problems', videoId:'0yfpz-kW_8I', minutes:30, drills:12 },
      { day:'Sat', focus:'Mixed timed drill',      videoId:null,          minutes:45, drills:20 },
      { day:'Sun', focus:'Rest + review mistakes', videoId:null,          minutes:20, drills:0  },
    ],
  };

  // Solutions — 12 sample questions for review tabs
  const questions = [
    { n:1, section:'R&W',  module:1, concept:'Word choice',        status:'correct', difficulty:'easy',   time:52,  flagged:false },
    { n:2, section:'R&W',  module:1, concept:'Word choice',        status:'correct', difficulty:'easy',   time:48,  flagged:false },
    { n:3, section:'R&W',  module:1, concept:'Central ideas',      status:'wrong',   difficulty:'medium', time:95,  flagged:true , correctAns:'A', pickedAns:'C', q:'Rising ocean temperatures have caused widespread coral bleaching events. Without algae, corals turn white and become vulnerable to disease. What is the main idea of this passage?', choices:['Elevated ocean temperatures trigger bleaching, which can be fatal if sustained.','Corals always recover from bleaching with time.','Algae are harmful to coral reef ecosystems.','Ocean temperatures have no long-term effect on corals.'], explanation:'The passage explains that high temperatures cause bleaching and sustained bleaching leads to coral death.', videoId:'8FgH9pQ6WnE' },
    { n:4, section:'R&W',  module:1, concept:'Text structure',     status:'correct', difficulty:'medium', time:71 },
    { n:5, section:'R&W',  module:1, concept:'Command of Evidence',status:'wrong',   difficulty:'hard',   time:128, correctAns:'B', pickedAns:'D', q:'A student is writing an essay arguing that social media has decreased meaningful interpersonal communication. Which sentence best serves as evidence to support this claim?', choices:['Many people enjoy sharing photos and updates on social media platforms.','Studies show heavy social media users report feeling more isolated and less able to hold in-person conversations.','Social media companies generate billions in annual advertising revenue.','Smartphone adoption has grown significantly over the past decade.'], explanation:'Only B provides direct evidence linking social media use to decreased interpersonal communication quality.', videoId:'s8zZjQEzPgo' },
    { n:6, section:'R&W',  module:2, concept:'Boundaries',         status:'wrong',   difficulty:'medium', time:62,  correctAns:'A', pickedAns:'B', q:'The chef — a former finalist on a cooking show — prepared a menu featuring local ingredients.\n\nWhich choice completes the text so that it conforms to the conventions of Standard English?', choices:['Leave as is (em dashes).', 'The chef, a former finalist on a cooking show — prepared...', 'The chef — a former finalist on a cooking show, prepared...','The chef; a former finalist on a cooking show; prepared...'], explanation:'Paired em dashes correctly set off the nonessential appositive. Mixing punctuation types is incorrect.', videoId:'Fh3Jxm3I3mk' },
    { n:7, section:'R&W',  module:2, concept:'Transitions',        status:'skipped', difficulty:'medium', time:0, flagged:true },
    { n:8, section:'Math', module:1, concept:'Linear equations',   status:'correct', difficulty:'easy',   time:65 },
    { n:9, section:'Math', module:1, concept:'Systems of Eq.',     status:'wrong',   difficulty:'medium', time:112, correctAns:'C', pickedAns:'A', q:'If 2x + 3y = 12 and 4x − y = 10, what is the value of x + y?', choices:['3','4','5','6'], explanation:'Solve: from eq2, y = 4x − 10. Sub: 2x + 3(4x − 10) = 12 → 14x = 42 → x = 3. Then y = 2. So x + y = 5.', videoId:'V6Xynlqc_tc' },
    { n:10,section:'Math', module:1, concept:'Ratios',             status:'correct', difficulty:'medium', time:88 },
    { n:11,section:'Math', module:2, concept:'Nonlinear functions',status:'wrong',   difficulty:'hard',   time:168, flagged:true, correctAns:'B', pickedAns:'D', q:'The function f(x) = −2(x − 3)² + 5 has its maximum at what point?', choices:['(−3, 5)','(3, 5)','(3, −5)','(−3, −5)'], explanation:'Vertex form a(x − h)² + k has vertex at (h, k). Here h = 3, k = 5 and a < 0 so the vertex is a maximum at (3, 5).', videoId:'ZRwCp0vg-LU' },
    { n:12,section:'Math', module:2, concept:'Geometry',           status:'skipped', difficulty:'hard',   time:0 },
  ];

  const meta = {
    assessment: 'SAT Full Test 1',
    category:   'SAT',
    badge:      'Digital SAT',
    student:    { name:'Priya Menon', initials:'PM', streak: 28, xp: 8120, tier:'professional' },
  };

  return { attempts, colleges, tiers, concepts, mistakes, difficulty, pacing, peer, sectionBreakdown, studyPlan, questions, meta };
})();
