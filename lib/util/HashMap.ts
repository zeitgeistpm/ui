export class HashMap<K extends Object, V = unknown> {
  #map = new Map<string, V>();

  set(key: K, value: V) {
    return this.#map.set(JSON.stringify(key), value);
  }

  get(key: K) {
    return this.#map.get(JSON.stringify(key));
  }

  has(key: K) {
    return this.#map.has(JSON.stringify(key));
  }

  delete(key: K) {
    return this.#map.delete(JSON.stringify(key));
  }

  clear() {
    this.#map.clear();
  }

  [Symbol.iterator](): Iterator<[K, V]> {
    return [...this.#map].map(([key, value]) => [JSON.parse(key), value]);
  }
}

declare const a: HashMap<1, 2>;

const b = a[Symbol.iterator]();
