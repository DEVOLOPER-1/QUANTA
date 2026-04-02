// js/views/QuizView.js
import { BaseView } from './BaseView.js';

export class QuizView extends BaseView {
    constructor(rootElement, exam, strategy, onFinish) {
        super(rootElement);
        this.exam = exam;
        this.strategy = strategy;
        this.onFinish = onFinish; // Callback to transition to ResultView
        this.isLocked = false;
    }

    render() {
        const question = this.exam.getCurrentQuestion();
        const total = this.exam.questions.length;
        const currentNum = this.exam.currentIndex + 1;

        this.root.innerHTML = `
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.9rem;">
        <span>Question ${currentNum} of ${total}</span>
        <span style="padding: 0.2rem 0.6rem; border: 1px solid var(--border-color); border-radius: 99px;">${question.difficulty.toUpperCase()}</span>
      </div>

      <div class="card" style="margin-bottom: 2rem;">
        <h2 style="font-weight: 500; line-height: 1.5; margin-bottom: 2rem;">${question.text}</h2>
        
        <div id="options-container">
          ${Object.entries(question.options).map(([key, value]) => `
            <div class="option" data-key="${key}">
              <strong style="font-family: var(--font-mono); color: var(--text-secondary); width: 24px;">${key}</strong>
              <span>${value}</span>
            </div>
          `).join('')}
        </div>

        <div id="explanation-container" class="explanation hidden"></div>
      </div>

      <div style="display: flex; justify-content: flex-end; width: 100%;">
        <button id="next-btn" class="btn btn-primary hidden">
          ${currentNum === total ? 'Finish Exam' : 'Next Question ➔'}
        </button>
      </div>
    `;

        this.isLocked = false;
        this.attachListeners();
    }

    attachListeners() {
        const question = this.exam.getCurrentQuestion();

        // Handle Option Clicks
        this.root.querySelectorAll('.option').forEach(opt => {
            opt.addEventListener('click', () => {
                if (this.isLocked) return;

                const selectedKey = opt.dataset.key;
                this.exam.submitAnswer(question.id, selectedKey);

                // Let the Mode Strategy dictate the UI updates (Practice vs Exam)
                this.strategy.handleSelection(this, question, selectedKey);

                // Show the next button
                document.getElementById('next-btn').classList.remove('hidden');
            });
        });

        // Handle Next Button
        document.getElementById('next-btn').addEventListener('click', () => {
            if (this.exam.currentIndex < this.exam.questions.length - 1) {
                this.exam.currentIndex++;
                this.render(); // Re-render with next question
            } else {
                this.onFinish();
            }
        });
    }

    /* --- Public API for Strategies to manipulate the UI --- */

    lockOptions() {
        this.isLocked = true;
        this.root.querySelectorAll('.option').forEach(opt => opt.style.cursor = 'default');
    }

    selectOption(key) {
        this.root.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        this.root.querySelector(`.option[data-key="${key}"]`).classList.add('selected');
    }

    highlightOption(key, isCorrect) {
        const el = this.root.querySelector(`.option[data-key="${key}"]`);
        if (el) {
            el.classList.add(isCorrect ? 'correct' : 'wrong');
        }
    }

    showExplanation(text) {
        const container = document.getElementById('explanation-container');
        container.innerHTML = `<strong>Explanation:</strong> ${text}`;
        container.classList.remove('hidden');
    }
}