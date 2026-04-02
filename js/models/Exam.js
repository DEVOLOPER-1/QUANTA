// js/models/Exam.js
export class Exam {
    constructor(questions) {
        this.questions = questions;
        this.answers = {}; // qId -> selected option
        this.currentIndex = 0;
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    submitAnswer(qId, answer) {
        this.answers[qId] = answer;
    }

    getScore() {
        let correct = 0;
        this.questions.forEach(q => {
            if (this.answers[q.id] === q.correctAnswer) correct++;
        });
        return { correct, total: this.questions.length };
    }
}