// js/views/HomeView.js
import { BaseView } from './BaseView.js';

export class HomeView extends BaseView {
    constructor(rootElement, exams, onStartExam) {
        super(rootElement);
        this.exams = exams;
        this.onStartExam = onStartExam; // Callback to AppController
        this.selectedExamFile = this.exams[0]?.file;
    }

    render() {
        this.root.innerHTML = `
      <div class="card" style="text-align: center; border: none; background: transparent;">
        <h1 style="font-weight: 400; letter-spacing: -0.03em;">Select a Module</h1>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">Choose an exam bank and your preferred mode.</p>
        
        <div class="exam-list" style="text-align: left; max-width: 500px; margin: 0 auto;">
          ${this.exams.map((e, index) => `
            <div class="option exam-card ${index === 0 ? 'selected' : ''}" data-file="${e.file}">
              <div style="font-weight: 500;">${e.name}</div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 3rem; display: flex; gap: 1rem; justify-content: center;">
           <button class="btn mode-btn" data-mode="practice">Practice Mode</button>
           <button class="btn mode-btn btn-primary" data-mode="exam">Exam Mode</button>
        </div>
      </div>
    `;

        this.attachListeners();
    }

    attachListeners() {
        // Exam Selection Logic
        const examCards = this.root.querySelectorAll('.exam-card');
        examCards.forEach(card => {
            card.addEventListener('click', () => {
                examCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedExamFile = card.dataset.file;
            });
        });

        // Mode Selection & Start Logic
        this.root.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                // Pass the selection back to the Controller
                this.onStartExam(this.selectedExamFile, mode);
            });
        });
    }
}