export class CsvParser {
    static parse(text) {
        const lines = text.trim().split('\n');
        const headers = this.#parseLine(lines[0]);
        return lines.slice(1).filter(l => l.trim()).map(line => {
            const vals = this.#parseLine(line);
            const obj = {};
            headers.forEach((h, i) => obj[h.trim()] = (vals[i] || '').trim());
            return obj;
        });
    }

    static #parseLine(line) {
        const result = [];
        let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                if (inQ && line[i+1] === '"') { cur += '"'; i++; }
                else inQ = !inQ;
            } else if (c === ',' && !inQ) {
                result.push(cur); cur = '';
            } else cur += c;
        }
        result.push(cur);
        return result;
    }
}