const storageKey = "techtrek-state-v1";
const themeKey = "techtrek-theme-v1";

function readState() {
  const empty = {
    lessons: [],
    practice: [],
    challenges: [],
    quizBest: null,
    quizAttempts: 0,
    lastQuiz: null
  };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      lessons: Array.isArray(saved.lessons) ? [...new Set(saved.lessons.filter(value => Number.isInteger(value) && value >= 0))] : [],
      practice: Array.isArray(saved.practice) ? [...new Set(saved.practice.filter(value => Number.isInteger(value) && value >= 0))] : [],
      challenges: Array.isArray(saved.challenges) ? [...new Set(saved.challenges.filter(value => Number.isInteger(value) && value >= 0))] : [],
      quizBest: Number.isFinite(saved.quizBest) ? saved.quizBest : null,
      quizAttempts: Number.isFinite(saved.quizAttempts) ? saved.quizAttempts : 0,
      lastQuiz: saved.lastQuiz && typeof saved.lastQuiz === "object" ? saved.lastQuiz : null
    };
  } catch (error) {
    return empty;
  }
}

let state = readState();
let currentLesson = 0;
let lessonFeedback = null;
let variableRan = false;
let functionCalled = false;
let counterRan = false;
let inputOutput = "";
let activePractice = 0;
let practiceFeedback = null;
let practiceSelection = null;
let arrangement = ["", "", "", ""];
let selectedChallenge = null;
let challengeHintVisible = false;
let challengeChoice = null;
let challengeFeedback = null;
let challengeSearch = "";
let challengeFilter = "All topics";
let quizAnswers = {};
let quizResultVisible = false;
let quizFormMessage = "";

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    return;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

const lessons = [{
    title: "What is coding?",
    level: "Level 1: Coding basics",
    topic: "Basics",
    intro: "Coding is how we give a computer clear instructions. A step-by-step plan for solving a problem is an algorithm. A computer follows those steps, just like a recipe guides a cook.",
    example: "A tiny program: Start → pick up a book → open it → read",
    code: "START\n  take_book()\n  open_book()\n  read()\nEND",
    question: "What makes a set of instructions a useful program?",
    options: ["The steps are clear and in an order", "The steps are as long as possible", "The computer guesses what we mean"],
    answer: 0,
    explain: "Computers need clear, ordered instructions. They do not guess what we meant.",
    activity: "Think of getting ready for school as a list of steps. Which step needs to happen first?"
  },
  {
    title: "Variables remember values",
    level: "Level 2: Variables",
    topic: "Variables",
    intro: "A variable is a named box where a program can keep information. We can change what is inside whenever we need to.",
    example: "The box named score can hold a number, then remember a new number.",
    code: "score = 10\nscore = 20\nPRINT score",
    question: "After these instructions, what value does score remember?",
    options: ["10", "20", "30"],
    answer: 1,
    explain: "The second instruction replaces the first value. score now remembers 20.",
    activity: "Run the two instructions and watch the value in the score box change."
  },
  {
    title: "Input and output",
    level: "Level 3: Input and output",
    topic: "Basics",
    intro: "Input is information a program receives. Output is what the program shows back. A friendly app uses both to talk with you.",
    example: "A greeting program asks for your name, then says hello.",
    code: "name = INPUT(\"Your name?\")\nPRINT(\"Hello, \" + name)",
    question: "When the program asks for your name, that is...",
    options: ["Output", "Input", "A loop"],
    answer: 1,
    explain: "Your name goes into the program, so it is input. The greeting it displays is output.",
    activity: "Type a name and send it to the tiny greeting program."
  },
  {
    title: "Conditions make choices",
    level: "Level 4: Conditions",
    topic: "Conditions",
    intro: "A condition lets a program make a choice. It checks whether something is true, then follows the matching path.",
    example: "If marks are 40 or more, show PASS. Otherwise, show TRY AGAIN.",
    code: "marks = 72\nIF marks >= 40:\n  PRINT(\"PASS\")\nELSE:\n  PRINT(\"TRY AGAIN\")",
    question: "With marks = 72, what will the program show?",
    options: ["PASS", "TRY AGAIN", "Both messages"],
    answer: 0,
    explain: "72 is greater than 40, so the condition is true and the program chooses PASS.",
    activity: "Predict whether 35 marks earns PASS or TRY AGAIN."
  },
  {
    title: "Loops repeat steps",
    level: "Level 5: Loops",
    topic: "Loops",
    intro: "A loop repeats instructions for us. A for loop can count a set number of times, while a while loop repeats as long as a condition stays true.",
    example: "Repeat the cheer three times without writing it three times.",
    code: "FOR count FROM 1 TO 3:\n  PRINT(\"Go!\")",
    question: "How many times will this loop print Go!?",
    options: ["1 time", "3 times", "It never stops"],
    answer: 1,
    explain: "The counter takes the values 1, 2, and 3, so the instruction runs three times.",
    activity: "Run the counter and see each repeat happen."
  },
  {
    title: "Functions bundle useful steps",
    level: "Level 6: Functions",
    topic: "Functions",
    intro: "A function gives a group of instructions a name. Later, we can call that name instead of writing every step again.",
    example: "A greet function can be reused whenever we want to say hello.",
    code: "FUNCTION greet():\n  PRINT(\"Hello, coder!\")\n\ngreet()",
    question: "What happens when we call greet()?",
    options: ["The instructions inside greet run", "The computer deletes greet", "The program starts a loop"],
    answer: 0,
    explain: "Calling a function runs the steps stored under its name.",
    activity: "Call the function and see the message it has saved."
  }
];

const practices = [{
    title: "Predict the output",
    type: "choice",
    topic: "Variables",
    prompt: "What will this short program print?",
    code: "apples = 4\napples = apples + 2\nPRINT apples",
    options: ["4", "6", "42"],
    answer: 1,
    explain: "The program adds 2 to 4, stores 6 back in apples, then prints 6."
  },
  {
    title: "Arrange the steps",
    type: "arrange",
    topic: "Basics",
    prompt: "Put these steps in a sensible order for working out the total cost of two items.",
    steps: ["Print the total", "Start", "Add the two prices", "Take the two prices as input"],
    order: ["Start", "Take the two prices as input", "Add the two prices", "Print the total"],
    explain: "First start, then collect the prices, work out the total, and show the result."
  },
  {
    title: "Find the mistake",
    type: "choice",
    topic: "Debugging",
    prompt: "A program should print a greeting, but it has a problem. What is wrong?",
    code: "name = INPUT(\"Name?\")\nPRINT(Hello + name)",
    options: ["Hello needs quotation marks", "INPUT should be last", "The name needs to be a number"],
    answer: 0,
    explain: "Words written directly in code need quotation marks, so the computer knows Hello is text."
  },
  {
    title: "Complete the code",
    type: "choice",
    topic: "Conditions",
    prompt: "Finish the program so it prints PASS when marks are 40 or more.",
    code: "IF marks >= 40:\n  ______",
    options: ["PRINT(\"PASS\")", "REPEAT(40)", "INPUT(marks)"],
    answer: 0,
    explain: "The condition is already checking the marks. The missing line should show PASS when it is true."
  }
];

const challenges = [{
    title: "The Pass or Fail Web",
    topic: "Conditions",
    difficulty: "Easy",
    description: "Help a school show whether a student has passed.",
    problem: "A student passes with 40 marks or more. Which rule works?",
    options: ["IF marks >= 40, show PASS", "IF marks < 40, show PASS", "Repeat PASS 40 times"],
    answer: 0,
    hint: "A score equal to 40 should count as a pass too.",
    explain: "The >= symbol means greater than or equal to, so it includes 40 and every higher mark."
  },
  {
    title: "Even or Odd",
    topic: "Conditions",
    difficulty: "Easy",
    description: "Sort a number into the even or odd team.",
    problem: "Which check spots an even number?",
    options: ["number divided by 2 has remainder 0", "number is greater than 2", "number is added to itself"],
    answer: 0,
    hint: "Even numbers split into pairs with nothing left over.",
    explain: "An even number divided by 2 leaves a remainder of 0."
  },
  {
    title: "Age Check",
    topic: "Conditions",
    difficulty: "Easy",
    description: "Decide whether someone is old enough to join a club.",
    problem: "Members must be at least 12. Which condition is right?",
    options: ["age >= 12", "age <= 12", "age = 2"],
    answer: 0,
    hint: "At least 12 includes age 12 and every age above it.",
    explain: "The >= comparison includes 12 and numbers larger than 12."
  },
  {
    title: "Number Counter",
    topic: "Loops",
    difficulty: "Medium",
    description: "Count from 1 to 5 without writing five print lines.",
    problem: "What is the best tool for repeating the count?",
    options: ["A loop", "A variable name", "An input question"],
    answer: 0,
    hint: "Look for a tool that repeats a set of instructions.",
    explain: "A loop repeats the print instruction for each number in the count."
  },
  {
    title: "Simple Calculator",
    topic: "Variables",
    difficulty: "Medium",
    description: "Keep two numbers and work out their total.",
    problem: "Which line adds the values in first and second?",
    options: ["total = first + second", "total = first - first", "PRINT first"],
    answer: 0,
    hint: "Use the plus sign to combine the two saved values.",
    explain: "The plus sign adds both stored values and saves the result in total."
  },
  {
    title: "Temperature Check",
    topic: "Conditions",
    difficulty: "Medium",
    description: "Show a warm message when the temperature is above 25.",
    problem: "Which check should select the warm message?",
    options: ["IF temperature > 25", "IF temperature < 25", "FOR temperature 25"],
    answer: 0,
    hint: "The message is for temperatures higher than 25.",
    explain: "The greater-than symbol checks that the temperature is above 25."
  },
  {
    title: "Find the Bigger Number",
    topic: "Conditions",
    difficulty: "Medium",
    description: "Compare two numbers and show the larger one.",
    problem: "Which comparison tells us if a is bigger than b?",
    options: ["a > b", "a = b", "a + b"],
    answer: 0,
    hint: "Use the comparison symbol that opens toward the larger value.",
    explain: "The > symbol is true when a has a larger value than b."
  },
  {
    title: "Reusable Greeting",
    topic: "Functions",
    difficulty: "Stretch",
    description: "Make one friendly greeting step easy to reuse.",
    problem: "What should you create for a group of reusable greeting instructions?",
    options: ["A function", "A condition only", "A number counter"],
    answer: 0,
    hint: "Give a group of steps a name, then call it whenever you need it.",
    explain: "A function stores useful instructions under a name so they can be called again."
  }
];

const quizQuestions = [{
    question: "What is a program?",
    options: ["A set of instructions for a computer", "A computer screen", "A type of keyboard"],
    answer: 0,
    explain: "A program is a set of instructions a computer can follow."
  },
  {
    question: "What does a variable do?",
    options: ["Stores a value with a name", "Turns off a computer", "Repeats every line"],
    answer: 0,
    explain: "A variable is a named place to store information."
  },
  {
    question: "A program asks you to type your favourite colour. That colour is...",
    options: ["Input", "Output", "A function"],
    answer: 0,
    explain: "You provide the colour to the program, so it is input."
  },
  {
    question: "Which instruction shows a message to the user?",
    options: ["PRINT(\"Hi\")", "IF(\"Hi\")", "LOOP(\"Hi\")"],
    answer: 0,
    explain: "PRINT displays information as output."
  },
  {
    question: "If points = 8 and then points = 3, what is points now?",
    options: ["8", "3", "11"],
    answer: 1,
    explain: "The newer value replaces the old value, so points is 3."
  },
  {
    question: "What is a condition useful for?",
    options: ["Making a choice", "Saving a file only", "Repeating forever"],
    answer: 0,
    explain: "A condition checks something and helps a program choose a path."
  },
  {
    question: "A pass needs 40 marks or more. Which test includes 40?",
    options: ["marks >= 40", "marks > 40", "marks < 40"],
    answer: 0,
    explain: "Greater than or equal to includes a mark of exactly 40."
  },
  {
    question: "What does a loop do?",
    options: ["Repeats instructions", "Renames variables", "Asks for a password"],
    answer: 0,
    explain: "Loops run instructions more than once."
  },
  {
    question: "A loop counts 1, 2, 3, 4. How many times does its step run?",
    options: ["2 times", "4 times", "5 times"],
    answer: 1,
    explain: "There are four count values, so the step runs four times."
  },
  {
    question: "Why use a function?",
    options: ["To reuse a named group of steps", "To make every number bigger", "To remove all conditions"],
    answer: 0,
    explain: "Functions let us name and reuse a group of instructions."
  },
  {
    question: "What is the bug in PRINT(Hello) if Hello is meant to be a word?",
    options: ["The word needs quotation marks", "PRINT should be a number", "Hello must be a loop"],
    answer: 0,
    explain: "Quotation marks tell the computer that Hello is text."
  },
  {
    question: "Which order makes sense for a simple program?",
    options: ["Start, input, process, output", "Output, stop, input, start", "Process, output, start, input"],
    answer: 0,
    explain: "A program starts, gets information, works on it, and shows a result."
  }
];

state.lessons = state.lessons.filter(index => index < lessons.length);
state.practice = state.practice.filter(index => index < practices.length);
state.challenges = state.challenges.filter(index => index < challenges.length);
if (state.quizBest !== null) state.quizBest = Math.max(0, Math.min(quizQuestions.length, Math.round(state.quizBest)));
if (state.lastQuiz && (!Number.isInteger(state.lastQuiz.score) || state.lastQuiz.score < 0 || state.lastQuiz.score > quizQuestions.length || !state.lastQuiz.answers || typeof state.lastQuiz.answers !== "object" || Array.isArray(state.lastQuiz.answers))) state.lastQuiz = null;
if (state.lastQuiz) {
  quizQuestions.forEach((question, index) => {
    const answer = state.lastQuiz.answers[index];
    if (!Number.isInteger(answer) || answer < 0 || answer >= question.options.length) delete state.lastQuiz.answers[index];
  });
}

function countDone() {
  return state.lessons.length + state.practice.length + state.challenges.length + (state.lastQuiz ? 1 : 0);
}

function percentDone() {
  return Math.round(countDone() / (lessons.length + practices.length + challenges.length + 1) * 100);
}

function levelName() {
  if (state.lessons.length >= 6 && state.challenges.length >= 5) return "Code Hero";
  if (state.lessons.length >= 3) return "Web Explorer";
  return "Web Rookie";
}

function pageHeading(kicker, title, description) {
  return `<div class="container page-heading"><p class="eyebrow">${kicker}</p><h1>${title}</h1><p>${description}</p></div>`;
}

function renderHome() {
  const pct = percentDone();
  return `<section class="container hero"><div class="hero-copy"><p class="eyebrow">A friendly first step into coding</p><h1>Learn coding, <br><span>Solve problems, </span><br>Have fun :D</h1><p>Meet TechTrek, a playful place to explore how code works, try tiny challenges, and grow your confidence one step at a time.</p><div class="button-row"><a class="button" href="/learn">Start learning <span aria-hidden="true">→</span></a><a class="button secondary" href="/challenges">Take a challenge</a></div></div><div class="hero-art" aria-label="Original web-inspired TechTrek badge"><div class="comic-burst"><div class="burst-inner"><div><svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 8v84M8 50h84M20 20l60 60M80 20 20 80M27 9l23 41L73 9M9 27l41 23L9 73M91 27 50 50l41 23M27 91l23-41 23 41" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="8" fill="currentColor"/></svg><strong>TechTrek</strong><small>Lezzgoo!</small></div></div></div><span class="sticker">Ready, set, code!</span></div></section><section class="section soft"><div class="container"><div class="section-heading"><div><p class="eyebrow">Your first coding toolkit</p><h2>Big ideas, tiny steps</h2><p>Start with the building blocks programmers use every day.</p></div><a class="button secondary small" href="/learn">Explore lessons</a></div><div class="topic-grid"><a class="topic-card" href="/learn"><span class="topic-icon">✳</span><h3>Think in steps</h3><p>Turn a big task into clear instructions a computer can follow.</p></a><a class="topic-card" href="/learn"><span class="topic-icon">▣</span><h3>Save a value</h3><p>Meet variables, the named boxes that remember information.</p></a><a class="topic-card" href="/practice"><span class="topic-icon">⌁</span><h3>Make a choice</h3><p>Try conditions, loops, and small logic puzzles hands-on.</p></a></div></div></section><section class="section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Your journey</p><h2>Every small win counts</h2><p>${state.lessons.length} of ${lessons.length} lessons done, ${state.challenges.length} of ${challenges.length} missions solved.</p></div><span class="pill red">${levelName()}</span></div><div class="home-progress"><div><strong>${pct}% of your TechTrek journey</strong><p>Your work is saved on this device.</p></div><div style="width:min(260px,100%)"><div class="progress-track" role="progressbar" aria-label="Overall progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${pct}%"></div></div></div></div></div></section>`;
}

function renderLessonActivity(lesson, index) {
  if (index === 1) {
    return `<div class="interactive-box"><h3>Try the value box</h3><p>${lesson.activity}</p><div class="code-box">score = 10 → score = 20</div><button class="button small" type="button" data-action="run-variable">Run instructions</button><p class="feedback" aria-live="polite">${variableRan ? "Now the score box contains 20. The new value replaced 10." : "score currently has no value. Press run to see it update."}</p></div>`;
  }
  if (index === 2) {
    return `<div class="interactive-box"><h3>Try a tiny greeting</h3><p>${lesson.activity}</p><div class="answer-row"><input class="field" id="greeting-name" type="text" maxlength="24" placeholder="Type a name" aria-label="Name for the greeting" value="${escapeHtml(inputOutput)}"><button class="button small" type="button" data-action="greet">Show greeting</button></div><p class="feedback" aria-live="polite">${inputOutput ? `Output: Hello, ${escapeHtml(inputOutput)}!` : "Your greeting will appear here."}</p></div>`;
  }
  if (index === 4) {
    return `<div class="interactive-box"><h3>Watch a loop count</h3><p>${lesson.activity}</p><button class="button small" type="button" data-action="run-counter">Run the loop</button><p class="feedback" aria-live="polite">${counterRan ? "1, 2, 3. The loop ran three times!" : "The counter is ready."}</p></div>`;
  }
  if (index === 5) {
    return `<div class="interactive-box"><h3>Call the function</h3><p>${lesson.activity}</p><button class="button small" type="button" data-action="call-function">Call greet()</button><p class="feedback" aria-live="polite">${functionCalled ? "Hello, coder! The saved function steps ran." : "The function is ready when you are."}</p></div>`;
  }
  return `<div class="interactive-box"><h3>Quick think</h3><p>${lesson.activity}</p></div>`;
}

function renderLearn() {
  const lesson = lessons[currentLesson];
  const complete = state.lessons.includes(currentLesson);
  const feedback = lessonFeedback;
  const choices = lesson.options.map((option, index) => `<button class="choice-button ${feedback && feedback.choice === index ? "selected" : ""}" type="button" data-action="lesson-answer" data-index="${index}">${option}</button>`).join("");
  const list = lessons.map((item, index) => `<button class="lesson-select ${currentLesson === index ? "active" : ""}" type="button" data-action="select-lesson" data-index="${index}"><strong>${index + 1}. ${item.title}</strong><span>${state.lessons.includes(index) ? "✓ Completed" : item.topic}</span></button>`).join("");
  const result = feedback ? `<div class="feedback ${feedback.correct ? "correct" : "incorrect"}" aria-live="polite">${feedback.correct ? "Nice one! " : "Almost! "}${lesson.explain}</div>` : complete ? `<div class="feedback correct">Lesson complete. ${lesson.explain}</div>` : "";
  return `${pageHeading("Learn together", "Your coding trail ^_^", "Short lessons, clear examples, and a little practice help each idea stick.")}<section class="container page-content"><div class="lesson-layout"><aside class="lesson-list" aria-label="Choose a lesson">${list}</aside><article class="panel lesson-body"><div class="lesson-meta"><span class="pill red">${lesson.level}</span><span class="pill">${lesson.topic}</span></div><h2>${lesson.title}</h2><p>${lesson.intro}</p><div class="example-box"><strong>Picture it</strong><p>${lesson.example}</p></div><div class="code-box">${escapeHtml(lesson.code)}</div>${renderLessonActivity(lesson, currentLesson)}<div class="interactive-box"><h3>Quick check</h3><p>${lesson.question}</p><div class="choice-list">${choices}</div>${result}<div class="button-row"><button class="button small" type="button" data-action="check-lesson">Check my answer</button>${complete || (feedback && feedback.correct) ? `<button class="button secondary small" type="button" data-action="next-lesson">${currentLesson === lessons.length - 1 ? "Finish lessons" : "Next lesson →"}</button>` : ""}</div></div></article></div></section>`;
}

function renderPractice() {
  const activity = practices[activePractice];
  const completed = state.practice.includes(activePractice);
  const tabs = practices.map((item, index) => `<button class="tab-button ${index === activePractice ? "active" : ""}" type="button" data-action="select-practice" data-index="${index}">${item.title}</button>`).join("");
  let task = "";
  if (activity.type === "arrange") {
    const selects = arrangement.map((value, index) => `<label class="answer-row" style="align-items:center;margin:9px 0"><span>Step ${index + 1}</span><select class="field arrange-select" data-index="${index}" aria-label="Step ${index + 1}"><option value="">Choose a step</option>${activity.steps.map(step => `<option value="${escapeHtml(step)}" ${value === step ? "selected" : ""}>${step}</option>`).join("")}</select></label>`).join("");
    task = `<div class="example-box">${selects}</div><button class="button small" type="button" data-action="check-practice">Check the order</button>`;
  } else {
    const options = activity.options.map((option, index) => `<button class="choice-button ${practiceSelection === index ? "selected" : ""}" type="button" data-action="practice-choice" data-index="${index}">${option}</button>`).join("");
    task = `<div class="code-box">${escapeHtml(activity.code)}</div><div class="choice-list">${options}</div><button class="button small" type="button" data-action="check-practice">Check my answer</button>`;
  }
  const feedback = practiceFeedback ? `<div class="feedback ${practiceFeedback.correct ? "correct" : "incorrect"}" aria-live="polite">${practiceFeedback.correct ? "Nice one! " : "Almost! "}${activity.explain}</div>` : completed ? `<div class="feedback correct">Activity complete. ${activity.explain}</div>` : "";
  return `${pageHeading("Practice lab", "Try it, test it, learn it :)", "Four bite-sized activities help you use the ideas, not just read about them.")}<section class="container page-content"><div class="activity-switcher">${tabs}</div><article class="panel activity-panel"><div class="lesson-meta"><span class="pill red">${activity.topic}</span><span class="pill">Activity ${activePractice + 1} of ${practices.length}</span></div><h2>${activity.title}</h2><p>${activity.prompt}</p>${task}${feedback}</article></section>`;
}

function matchingChallenges() {
  return challenges.filter(challenge => {
    const matchesTopic = challengeFilter === "All topics" || challenge.topic === challengeFilter;
    const text = `${challenge.title} ${challenge.description} ${challenge.topic}`.toLowerCase();
    return matchesTopic && text.includes(challengeSearch.toLowerCase());
  });
}

function renderChallengeDetail(challenge, index) {
  const complete = state.challenges.includes(index);
  const choices = challenge.options.map((option, optionIndex) => `<button class="choice-button ${challengeChoice === optionIndex ? "selected" : ""}" type="button" data-action="challenge-choice" data-index="${optionIndex}">${option}</button>`).join("");
  const feedback = challengeFeedback ? `<div class="feedback ${challengeFeedback.correct ? "correct" : "incorrect"}" aria-live="polite">${challengeFeedback.correct ? "Mission complete! " : "Almost there! "}${challenge.explain}</div>` : complete ? `<div class="feedback correct">Mission complete. ${challenge.explain}</div>` : "";
  return `<article class="panel activity-panel"><div class="lesson-meta"><span class="pill red">Mission ${index + 1}</span><span class="pill">${challenge.topic}</span><span class="pill">${challenge.difficulty}</span></div><h2>${challenge.title}</h2><p>${challenge.description}</p><div class="example-box"><strong>Your mission</strong><p>${challenge.problem}</p></div><div class="choice-list">${choices}</div><div class="button-row"><button class="button small" type="button" data-action="check-challenge">Check solution</button><button class="button secondary small" type="button" data-action="toggle-hint" aria-expanded="${challengeHintVisible}">${challengeHintVisible ? "Hide hint" : "Show hint"}</button><button class="button secondary small" type="button" data-action="back-challenges">All missions</button></div>${challengeHintVisible ? `<div class="feedback">Hint: ${challenge.hint}</div>` : ""}${feedback}</article>`;
}

function renderChallenges() {
  if (selectedChallenge !== null) return `${pageHeading("Coding missions", "Pick your next move", "Use a hint if you need one, then choose a solution and check your thinking.")}<section class="container page-content">${renderChallengeDetail(challenges[selectedChallenge], selectedChallenge)}</section>`;
  const topicOptions = ["All topics", "Basics", "Variables", "Conditions", "Loops", "Functions", "Debugging"];
  const select = topicOptions.map(topic => `<option value="${topic}" ${challengeFilter === topic ? "selected" : ""}>${topic}</option>`).join("");
  const cards = matchingChallenges().map(challenge => {
    const index = challenges.indexOf(challenge);
    return `<article class="challenge-card"><div class="card-meta"><span class="pill red">${challenge.difficulty}</span><span class="pill">${challenge.topic}</span>${state.challenges.includes(index) ? `<span class="pill">✓ Solved</span>` : ""}</div><h3>${challenge.title}</h3><p>${challenge.description}</p><button class="button small" type="button" data-action="open-challenge" data-index="${index}">${state.challenges.includes(index) ? "Try mission again" : "Start mission"}</button></article>`;
  }).join("");
  return `${pageHeading("Coding missions", "Web challenges", "Eight small missions take you from simple choices to reusable ideas.")}<section class="container page-content"><div class="toolbar"><input class="field" id="challenge-search" type="search" placeholder="Search missions" aria-label="Search missions" value="${escapeHtml(challengeSearch)}"><select class="field" id="challenge-filter" aria-label="Filter missions by topic">${select}</select></div><div class="challenge-grid">${cards || `<div class="empty-state">No missions match that search. Try another word or topic.</div>`}</div></section>`;
}

function renderQuizResult() {
  const result = state.lastQuiz;
  if (!result) return "";
  const percent = Math.round(result.score / quizQuestions.length * 100);
  const message = percent === 100 ? "Perfect score! Your logic is shining." : percent >= 70 ? "Great work! Your coding instincts are growing." : "Good effort! Every try helps your brain spot new patterns.";
  const review = quizQuestions.map((question, index) => {
    const picked = result.answers[index];
    const correct = picked === question.answer;
    return `<div class="quiz-question"><h3>${index + 1}. ${question.question}</h3><p class="${correct ? "" : ""}">${correct ? "✓ Your answer: " : "Your answer: "}${picked === undefined ? "Not answered" : question.options[picked]}</p>${correct ? "" : `<p>Correct answer: ${question.options[question.answer]}</p>`}<p>${question.explain}</p></div>`;
  }).join("");
  return `<div class="score-banner"><strong>Web-slinging score: ${result.score}/${quizQuestions.length}</strong>${percent}% correct. ${message}<p>${result.score} correct, ${quizQuestions.length - result.score} incorrect.</p></div><h3>Answer review</h3>${review}`;
}

function renderQuiz() {
  const questions = quizQuestions.map((item, index) => {
    const options = item.options.map((option, optionIndex) => `<label class="quiz-option"><input type="radio" name="question-${index}" value="${optionIndex}" ${quizAnswers[index] === optionIndex ? "checked" : ""}><span>${option}</span></label>`).join("");
    return `<fieldset class="quiz-question" style="border:0;padding-left:0;padding-right:0"><legend><h3>${index + 1}. ${item.question}</h3></legend>${options}</fieldset>`;
  }).join("");
  const result = quizResultVisible ? renderQuizResult() : `<form id="quiz-form"><div class="quiz-progress"><span>${quizQuestions.length} questions, take your time.</span><div class="progress-track" style="margin-top:9px"><div class="progress-fill" id="quiz-progress-fill" style="width:${Object.keys(quizAnswers).length / quizQuestions.length * 100}%"></div></div></div>${questions}<p class="feedback incorrect" id="quiz-message" ${quizFormMessage ? "" : "hidden"}>${quizFormMessage}</p><div class="button-row"><button class="button" type="submit">Lezzgo, check my score! </button><button class="button secondary" type="button" data-action="reset-quiz">No wait! Let's start over :')</button></div></form>`;
  return `${pageHeading("Quick quiz", "Show what you know :o", "Twelve friendly questions cover the coding ideas you have explored so far.")}<section class="container page-content"><article class="panel activity-panel"><div class="lesson-meta"><span class="pill red">12 questions</span><span class="pill">Best: ${state.quizBest === null ? "Not yet" : `${state.quizBest}/${quizQuestions.length}`}</span></div>${result}<div class="button-row" style="margin-top:17px">${quizResultVisible ? `<button class="button" type="button" data-action="retry-quiz">Try again</button>` : ""}</div></article></section>`;
}

function renderProgress() {
  const overall = percentDone();
  const rows = [
    ["Lessons", state.lessons.length, lessons.length],
    ["Practice", state.practice.length, practices.length],
    ["Missions", state.challenges.length, challenges.length],
    ["Quiz", state.lastQuiz ? 1 : 0, 1]
  ];
  const rowHtml = rows.map(([title, done, total]) => {
    const pct = Math.round(done / total * 100);
    return `<div class="progress-item"><span>${title}</span><div class="progress-track" role="progressbar" aria-label="${title} progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${pct}%"></div></div><strong>${pct}%</strong></div>`;
  }).join("");
  const badgeText = levelName() === "Web Rookie" ? "Complete 3 lessons to become a Web Explorer." : levelName() === "Web Explorer" ? "Complete all 6 lessons and solve 5 missions to become a Code Hero." : "All six lessons and five missions complete. You earned this!";
  return `${pageHeading("Your saved journey", "Look how far you have come", "Your progress stays on this device, even when you come back another day.")}<section class="container page-content"><div class="stat-grid"><div class="stat-card"><strong>${overall}%</strong>Overall complete</div><div class="stat-card"><strong>${countDone()}</strong>Activities finished</div><div class="stat-card"><strong>${state.quizBest === null ? "-" : `${state.quizBest}/${quizQuestions.length}`}</strong>Best quiz score</div></div><article class="panel"><div class="section-heading"><div><p class="eyebrow">TechTrek journey</p><h2 style="font-size:1.8rem">Your activity map</h2></div><span class="pill red">${levelName()}</span></div>${rowHtml}<div class="badge-card"><span class="badge-icon" aria-hidden="true">✦</span><div><strong>${levelName()}</strong><p>${badgeText}</p></div></div><div class="button-row" style="margin-top:22px"><a class="button small" href="/learn">Let's keep going :))</a><button class="button secondary small" type="button" data-action="reset-progress">Reset progress</button></div></article></section>`;
}

function renderAbout() {
  return `${pageHeading("The people and purpose", "So, what's TechTrek?", "A little corner of the internet to explore coding, try things out, and learn by doing.")}<section class="container page-content"><article class="panel"><p class="eyebrow">About TechTrek</p><h2 style="font-size:1.85rem">Coding Awareness Program for School Children</h2><br><p>TechTrek is an interactive learning app designed to make getting started with coding less confusing and more fun.</p><br><p>From figuring out how instructions work to playing around with variables, conditions, and loops, you can explore the basics through short explanations, visual examples, practice activities, and challenges.</p><br><div class="notice"><strong>Please note :)</strong><br>TechTrek is an educational, non-commercial student project. Its comic and web-inspired visual style is an original design direction. The developers do not claim ownership of Spider-Man, Marvel, or other third-party intellectual property. Any third-party intellectual property belongs to its respective owners.</div></article><section class="section"><div class="section-heading"><div><p class="eyebrow">THE PEOPLE BEHIND IT</p><h2>Meet the developers</h2><p>Two little Earthlings building a space to make learning coding a little easier.</p></div></div><div class="developer-grid">
  <article class="developer-card">
    <span class="developer-avatar" aria-hidden="true">:)</span>
    <h1>Tayyaba Shaikh</h1><br>
    <h3>Student Developer</h3><br><br>
    <p>
    Socials: <br>
    <a href="https://www.linkedin.com/in/tayyaba590">in/tayyaba590</a><br>
    <a href="https://github.com/notthatslayer">github.com/notthatslayer</a><br>
    <a href="https://dev.to/deffslayer">dev.to/deffslayer</a><br>
    <a href="https://notthatslayer.github.io/portfolioo/">notthatslayer.github.io/portfolioo/</a><br>
    </p>

  </article>

  <article class="developer-card developer-photo-card">
    <img src="https://uploads.onecompiler.io/436ra3cxj/455p9kdpp/spideyyy.jpeg" alt="Tayyaba and Sania with Spider-Man filters">
    <center><h3>Hello, world! :D</h3>
    <p>We're just young, dumb, and curious little Earthlings</p></center>
  </article>

  <article class="developer-card">
    <span class="developer-avatar" aria-hidden="true">:P</span>
    <h1>Sania Siddiqi</h1><br>
    <h3>Student Developer</h3><br><br>
    <p>
    Socials: <br>
    <a href="https://in.linkedin.com/in/sania13">in.linkedin.com/in/sania13</a><br>
    <a href="https://github.com/starter33lemon">github.com/starter33lemon</a><br>

    </p>


  </article>
</div>
</section><div class="button-row"><a class="button" href="/learn">Explore the lessons</a><a class="button secondary" href="/progress">View your progress</a></div></section>`;
}

function currentPage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/" ? "home" : path.slice(1).split("/")[0];
}

function renderApp() {
  const page = currentPage();
  const routeMap = {
    home: renderHome,
    learn: renderLearn,
    practice: renderPractice,
    challenges: renderChallenges,
    quiz: renderQuiz,
    progress: renderProgress,
    about: renderAbout
  };
  const render = routeMap[page] || renderHome;
  document.getElementById("app-main").innerHTML = render();
  document.querySelectorAll(".nav-link").forEach(link => {
    const active = link.getAttribute("href") === (page === "home" ? "/" : `/${page}`);
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (page === "challenges") {
    const search = document.getElementById("challenge-search");
    const filter = document.getElementById("challenge-filter");
    if (search) search.addEventListener("input", event => {
      challengeSearch = event.target.value;
      const cursor = event.target.selectionStart;
      renderApp();
      const refreshed = document.getElementById("challenge-search");
      refreshed.focus();
      refreshed.setSelectionRange(cursor, cursor);
    });
    if (filter) filter.addEventListener("change", event => {
      challengeFilter = event.target.value;
      renderApp();
    });
  }
  if (page === "quiz") {
    const form = document.getElementById("quiz-form");
    if (form) {
      form.addEventListener("change", event => {
        if (event.target.name && event.target.name.startsWith("question-")) {
          const index = Number(event.target.name.split("-")[1]);
          quizAnswers[index] = Number(event.target.value);
          const fill = document.getElementById("quiz-progress-fill");
          if (fill) fill.style.width = `${Object.keys(quizAnswers).length / quizQuestions.length * 100}%`;
        }
      });
      form.addEventListener("submit", event => {
        event.preventDefault();
        if (Object.keys(quizAnswers).length !== quizQuestions.length) {
          quizFormMessage = `You have answered ${Object.keys(quizAnswers).length} of ${quizQuestions.length}. Give every question a try.`;
          renderApp();
          return;
        }
        const score = quizQuestions.reduce((total, question, index) => total + (quizAnswers[index] === question.answer ? 1 : 0), 0);
        state.quizAttempts += 1;
        state.quizBest = state.quizBest === null ? score : Math.max(state.quizBest, score);
        state.lastQuiz = {
          score,
          answers: {
            ...quizAnswers
          }
        };
        saveState();
        quizResultVisible = true;
        quizFormMessage = "";
        renderApp();
      });
    }
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(themeKey, theme);
  } catch (error) {
    return;
  }
}

function initializeTheme() {
  let theme = "light";
  try {
    const saved = localStorage.getItem(themeKey);
    if (saved === "dark" || saved === "light") theme = saved;
  } catch (error) {
    theme = "light";
  }
  setTheme(theme);
  const button = document.getElementById("theme-toggle");
  button.textContent = theme === "dark" ? "☀ Light" : "◐ Dark";
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    button.textContent = next === "dark" ? "☀ Light" : "◐ Dark";
  });
}

function handleAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const index = Number(button.dataset.index);
  if (action === "select-lesson") {
    currentLesson = index;
    lessonFeedback = null;
    renderApp();
  }
  if (action === "lesson-answer") {
    lessonFeedback = {
      choice: index,
      correct: index === lessons[currentLesson].answer
    };
    if (lessonFeedback.correct && !state.lessons.includes(currentLesson)) {
      state.lessons.push(currentLesson);
      saveState();
    }
    renderApp();
  }
  if (action === "check-lesson") {
    if (!lessonFeedback) lessonFeedback = {
      choice: null,
      correct: false,
      message: true
    };
    if (lessonFeedback.message) lessonFeedback = {
      choice: null,
      correct: false
    };
    renderApp();
  }
  if (action === "next-lesson") {
    currentLesson = (currentLesson + 1) % lessons.length;
    lessonFeedback = null;
    renderApp();
  }
  if (action === "run-variable") {
    variableRan = true;
    renderApp();
  }
  if (action === "run-counter") {
    counterRan = true;
    renderApp();
  }
  if (action === "call-function") {
    functionCalled = true;
    renderApp();
  }
  if (action === "greet") {
    const name = document.getElementById("greeting-name").value.trim();
    if (name) inputOutput = name;
    renderApp();
    if (!name) document.getElementById("greeting-name").focus();
  }
  if (action === "select-practice") {
    activePractice = index;
    practiceFeedback = null;
    practiceSelection = null;
    arrangement = ["", "", "", ""];
    renderApp();
  }
  if (action === "practice-choice") {
    practiceSelection = index;
    renderApp();
  }
  if (action === "check-practice") {
    const activity = practices[activePractice];
    let correct = false;
    if (activity.type === "arrange") correct = arrangement.every((value, position) => value === activity.order[position]);
    else correct = practiceSelection === activity.answer;
    practiceFeedback = {
      correct
    };
    if (correct && !state.practice.includes(activePractice)) {
      state.practice.push(activePractice);
      saveState();
    }
    renderApp();
  }
  if (action === "open-challenge") {
    selectedChallenge = index;
    challengeHintVisible = false;
    challengeChoice = null;
    challengeFeedback = null;
    renderApp();
  }
  if (action === "challenge-choice") {
    challengeChoice = index;
    renderApp();
  }
  if (action === "toggle-hint") {
    challengeHintVisible = !challengeHintVisible;
    renderApp();
  }
  if (action === "check-challenge") {
    const challenge = challenges[selectedChallenge];
    challengeFeedback = {
      correct: challengeChoice === challenge.answer
    };
    if (challengeFeedback.correct && !state.challenges.includes(selectedChallenge)) {
      state.challenges.push(selectedChallenge);
      saveState();
    }
    renderApp();
  }
  if (action === "back-challenges") {
    selectedChallenge = null;
    challengeFeedback = null;
    challengeChoice = null;
    renderApp();
  }
  if (action === "reset-quiz" || action === "retry-quiz") {
    quizAnswers = {};
    quizResultVisible = false;
    quizFormMessage = "";
    renderApp();
  }
  if (action === "reset-progress") {
    if (window.confirm("Reset your saved lessons, practice, missions, and quiz results on this device?")) {
      state = {
        lessons: [],
        practice: [],
        challenges: [],
        quizBest: null,
        quizAttempts: 0,
        lastQuiz: null
      };
      saveState();
      renderApp();
    }
  }
}

function initializeNavigation() {
  const menu = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open navigation");
    }
  });
  document.addEventListener("click", event => {
    const link = event.target.closest('a[href^="/"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    event.preventDefault();
    if (destination.pathname !== window.location.pathname) {
      window.history.pushState({}, "", destination.pathname);
      renderApp();
      window.scrollTo(0, 0);
    }
  });
  window.addEventListener("popstate", renderApp);
}

const initialPath = currentPage();
if (initialPath === "learn") {
  const next = lessons.findIndex((lesson, index) => !state.lessons.includes(index));
  currentLesson = next === -1 ? 0 : next;
}
if (initialPath === "quiz" && state.lastQuiz) quizResultVisible = true;

document.addEventListener("click", handleAction);
document.addEventListener("change", event => {
  if (event.target.matches(".arrange-select")) {
    arrangement[Number(event.target.dataset.index)] = event.target.value;
  }
});
initializeTheme();
initializeNavigation();
renderApp();
