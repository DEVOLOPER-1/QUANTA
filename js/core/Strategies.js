export class ModeStrategy {
    handleSelection(view, question, selectedOption) {}
    canNavigateNext(view) { return true; }
}

export class PracticeStrategy extends ModeStrategy {
    handleSelection(view, question, selectedOption) {
        // Immediate feedback
        view.lockOptions();
        view.highlightOption(selectedOption, selectedOption === question.correctAnswer);
        if (selectedOption !== question.correctAnswer) {
            view.highlightOption(question.correctAnswer, true); // Show correct
        }
        view.showExplanation(question.explanation);
    }
}

export class ExamStrategy extends ModeStrategy {
    handleSelection(view, question, selectedOption) {
        // Just visual selection, no feedback
        view.selectOption(selectedOption);
    }
}