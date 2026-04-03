/**
 * CSVParser — Stateless utility for parsing RFC-4180 compliant CSV text.
 * Handles quoted fields, escaped quotes, and whitespace trimming.
 */
export class CSVParser {
  /**
   * Parses a CSV string into an array of row objects keyed by header names.
   * @param {string} text
   * @returns {Object[]}
   */
  static parse(text) {
    const lines   = text.trim().split(/\r?\n/);
    const headers = CSVParser._parseLine(lines[0]).map(h => h.trim());

    return lines
      .slice(1)
      .filter(line => line.trim().length > 0)
      .map(line => {
        const values = CSVParser._parseLine(line);
        return headers.reduce((row, header, i) => {
          row[header] = (values[i] ?? '').trim();
          return row;
        }, {});
      });
  }

  /**
   * Fetches a CSV file by URL and parses it.
   * @param {string} url
   * @returns {Promise<Object[]>}
   */
  static async fetchAndParse(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CSVParser: HTTP ${res.status} fetching "${url}"`);
    return CSVParser.parse(await res.text());
  }

  /** @private */
  static _parseLine(line) {
    const fields = [];
    let current  = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        // Escaped quote inside a quoted field
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }

    fields.push(current);
    return fields;
  }
}
