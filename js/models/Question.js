// js/models/Question.js
export class Question {
    constructor(data) {
        this.id = data.id;
        this.section = data.section_name;
        this.text = data.question;
        this.options = {
            A: data.option_a,
            B: data.option_b,
            C: data.option_c,
            D: data.option_d
        };
        this.correctAnswer = data.correct_answer.toUpperCase();
        this.explanation = data.explanation;
        this.difficulty = data.difficulty;
    }
}

