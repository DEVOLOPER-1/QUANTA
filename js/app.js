// js/app.js
import { HomeView } from './views/HomeView.js';
import { QuizView } from './views/QuizView.js';
import { ResultView } from './views/ResultView.js';
import { CsvParser } from './core/CsvParser.js';
import { Question } from './models/Question.js';
import { Exam } from './models/Exam.js';
import { PracticeStrategy, ExamStrategy } from './core/Strategies.js';

class AppController {
    constructor() {
        this.root = document.getElementById('app-root');

        // Centralized Application State
        this.state = {
            exams: [
                { id: 'cv', name: 'Computer Vision Concepts', file: 'data/cv.csv' },
                { id: 'nlp', name: 'NLP Principles', file: 'data/nlp_exam_questions.csv' },
                { id: 'xai', name: 'Responsible AI & XAI', file: 'data/questions.csv' }
            ],
            currentExam: null,
            strategy: null
        };

        this.currentView = null;

        this.initTheme();
        this.navigate('home'); // Boot up the app
    }

    initTheme() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;

        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            document.body.classList.toggle('light-theme');
        });
    }

    async loadExamData(fileUrl) {
        try {
            const res = await fetch(fileUrl);
            if (!res.ok) throw new Error("Failed to fetch exam data");
            const text = await res.text();

            const rawData = CsvParser.parse(text);
            return rawData.map(row => new Question(row));
        } catch (error) {
            console.error("Error loading exam:", error);
            alert("Could not load the selected exam. Check console for details.");
            return [];
        }
    }

    /**
     * Master Router / View Switcher
     */
    navigate(viewName) {
        // 1. Teardown the current view to prevent memory leaks / duplicate listeners
        if (this.currentView && typeof this.currentView.destroy === 'function') {
            this.currentView.destroy();
        }

        // 2. Instantiate and mount the new view
        if (viewName === 'home') {

            this.currentView = new HomeView(this.root, this.state.exams, async (selectedFile, mode) => {
                // Set strategy based on user selection
                const isPractice = mode === 'practice';
                this.state.strategy = isPractice ? new PracticeStrategy() : new ExamStrategy();

                // Show a brief loading indicator (optional but good UX)
                this.root.innerHTML = `<h2 style="text-align:center; margin-top:3rem;">Loading Exam...</h2>`;

                // Load data and create the Exam session model
                const questions = await this.loadExamData(selectedFile);
                if (questions.length > 0) {
                    this.state.currentExam = new Exam(questions);
                    this.navigate('quiz');
                } else {
                    this.navigate('home'); // Fallback if data fails to load
                }
            });

            this.currentView.render();

        } else if (viewName === 'quiz') {

            // Ensure we have an active exam before rendering
            if (!this.state.currentExam) return this.navigate('home');

            this.currentView = new QuizView(
                this.root,
                this.state.currentExam,
                this.state.strategy,
                () => {
                    // Triggered when the user clicks "Finish Exam"
                    this.navigate('result');
                }
            );

            this.currentView.render();

        } else if (viewName === 'result') {

            // Ensure we have an active exam to show results for
            if (!this.state.currentExam) return this.navigate('home');

            this.currentView = new ResultView(this.root, this.state.currentExam, () => {
                // Triggered when the user clicks "Choose Another Exam"
                this.state.currentExam = null;
                this.state.strategy = null;
                this.navigate('home');
            });

            this.currentView.render();

        }
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});