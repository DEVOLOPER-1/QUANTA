// js/views/BaseView.js
export class BaseView {
    constructor(rootElement) {
        this.root = rootElement;
    }
    render() { throw new Error("render() must be implemented"); }
    destroy() { this.root.innerHTML = ''; }
}

