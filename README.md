# STUDY-FLOW-
A website for students to organize their learning
StudyFlow

«What Should I Study?»

StudyFlow is a simple, mobile-first study planning web app designed to help students decide what they should study first.

Instead of manually figuring out which exam needs the most attention, StudyFlow calculates study priority using exam deadlines, difficulty, and the student's confidence level.

---

✨ Features

- 📚 Add, edit, and delete exams
- 🎯 Automatic study priority calculation
- ⏳ Exam countdown
- 📝 Personalized study plan
- ✅ Study task checklist
- 📊 Study progress tracking
- 💾 LocalStorage data persistence
- 📱 Mobile-first responsive interface
- 🪟 Glassmorphism-inspired UI
- ⚡ No installation or backend required

---

🧩 The Problem

Students often have multiple exams at the same time.

Each exam can have a different:

- Deadline
- Difficulty
- Level of preparation
- Amount of material to study

The problem is not always "What do I have to study?"

Sometimes the bigger problem is:

«"What should I study first?"»

StudyFlow was created to solve that problem with a simple priority system.

---

💡 The Solution

StudyFlow turns exam information into a clear study priority.

Exam Data
   ↓
Priority Calculation
   ↓
Priority Level
   ↓
Study Plan
   ↓
Daily Tasks

The goal is to reduce decision-making and help students start studying faster.

---

🎯 How Priority Works

StudyFlow uses a deterministic scoring system based on three factors:

1. Deadline

The closer the exam, the higher the urgency.

2. Difficulty

Harder subjects receive a higher priority weight.

3. Confidence

Lower confidence means a higher need for preparation.

The current priority score is calculated using:

Priority Score =
Deadline Score
+ Difficulty Score
+ Confidence Risk Score

The result is classified into:

HIGH PRIORITY
MEDIUM PRIORITY
LOW PRIORITY

This approach keeps the system simple and transparent.

---

📋 Example

Imagine a student has:

Subject: Physics
Exam: In 2 days
Difficulty: Hard
Confidence: 30%

StudyFlow recognizes that this exam requires significant attention and places it higher in the study queue.

The student can then immediately see what to focus on instead of manually comparing every exam.

---

🗓️ Study Plan

Once the highest-priority exam is identified, StudyFlow generates a simple study session.

Example:

Today's Focus: Physics

☐ Review the core topics        20 min
☐ Review key formulas and facts 10 min
☐ Practice 10 questions         15 min

Students can mark tasks as completed and track their progress directly inside the app.

---

💾 Data & Privacy

StudyFlow currently uses browser LocalStorage.

There is:

- No account system
- No login
- No database
- No backend server

Exam data is stored locally in the user's browser.

This also means the project can run as a simple static website.

---

🛠️ Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage

No framework or external backend is required for the core application.

---

📱 Design

StudyFlow follows a mobile-first design approach inspired by modern mobile interfaces.

The interface uses:

- Soft blue gradients
- Gold accents
- Glassmorphism
- Rounded cards
- Subtle shadows
- Lightweight animations
- Clear visual hierarchy

Animations are designed to provide feedback and communicate state changes rather than exist purely for decoration.

---

📂 Project Structure

StudyFlow/
│
├── index.html
├── style.css
├── script.js
│
├── assets/
│   ├── icons/
│   └── images/
│
├── README.md
└── LICENSE

---

🚀 Run Locally

No installation is required.

1. Clone the repository

git clone https://github.com/your-username/StudyFlow.git

2. Open the project

StudyFlow/

3. Run

Open:

index.html

in a modern web browser.

That's it.

---

🌐 Deploying

Because StudyFlow is a static web application, it can be deployed using services such as:

- GitHub Pages
- Netlify
- Vercel
- Other static hosting services

No backend server is required for the current version.

---

🤖 AI Roadmap

AI is planned as a future enhancement rather than a requirement for the core StudyFlow system.

A future AI feature could generate more personalized study plans based on information such as:

Available Time: 45 minutes
Subject: Physics
Exam: In 2 days
Confidence: 30%

The AI could then generate a more adaptive study session based on the student's situation.

The core priority system will remain transparent and functional independently.

---

🔮 Future Improvements

Possible future features include:

- AI-powered study planning
- Smarter task generation
- Adaptive study schedules
- Study statistics
- Calendar integration
- Subject performance tracking
- Spaced repetition
- More advanced exam prioritization
- PWA / installable mobile experience
- Offline-first improvements

---

🎓 Project Goal

StudyFlow was built around a simple idea:

«Students shouldn't waste their limited study time deciding what to study first.»

The project focuses on turning a complicated study situation into a simple actionable plan.

---

📄 License

MIT License
