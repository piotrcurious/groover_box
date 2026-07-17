// Seedable pseudorandom number generator for reproducible generative structures
export class Random {
    constructor(seed = 12345) {
        this.seed = seed;
    }

    // Returns a float between 0 and 1
    next() {
        let x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    // Returns a float between min and max
    range(min, max) {
        return min + this.next() * (max - min);
    }

    // Returns an integer between min and max (inclusive)
    intRange(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    // Pick a random element from an array
    choice(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(this.next() * arr.length)];
    }

    // Shuffle an array in-place and return it
    shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

export const random = new Random();
