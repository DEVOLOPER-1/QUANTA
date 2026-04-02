// js/views/ResultView.js
import { BaseView } from './BaseView.js';

export class ResultView extends BaseView {
    constructor(rootElement, exam, onRestart) {
        super(rootElement);
        this.exam = exam;
        this.onRestart = onRestart; // Callback to go back to Home
    }

    render() {
        const { correct, total } = this.exam.getScore();
        const percentage = Math.round((correct / total) * 100);
        const passed = percentage >= 60; // Assuming 60% is passing

        this.root.innerHTML = `
      <div class="card" style="text-align: center; border: none; background: transparent; margin-top: 2rem;">
        <h1 style="font-size: 3rem; font-weight: 300; margin-bottom: 0.5rem; color: ${passed ? 'var(--success)' : 'var(--error)'}">
          ${percentage}%
        </h1>
        <h3 style="font-weight: 400; color: var(--text-secondary); margin-bottom: 3rem;">
          You answered ${correct} out of ${total} correctly.
        </h3>

        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 2rem; display: inline-block; text-align: left; margin-bottom: 3rem; width: 100%; max-width: 400px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <span style="color: var(--text-secondary)">Status</span>
            <strong style="color: ${passed ? 'var(--success)' : 'var(--error)'}">${passed ? 'PASSED' : 'NEEDS REVIEW'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <span style="color: var(--text-secondary)">Correct Answers</span>
            <strong>${correct}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary)">Incorrect Answers</span>
            <strong>${total - correct}</strong>
          </div>
        </div>

        <div>
          <button id="restart-btn" class="btn btn-primary">Choose Another Exam</button>
        </div>
      </div>
    `;

        this.attachListeners();
    }

    attachListeners() {
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.onRestart();
        });
    }
}