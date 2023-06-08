import PriorityQueue from "js-priority-queue";

interface Entry<T> {
  array: T[];
  index: number;
}

function mergeSortedArrays<
  T extends { [key in K]: number | string },
  K extends keyof T,
>(property: K, ...arrays: T[][]): T[] {
  const merged: T[] = [];
  const queue = new PriorityQueue<Entry<T>>({
    comparator: (a, b) => {
      return (
        Number(b.array[b.index][property]) - Number(a.array[a.index][property])
      );
    },
  });

  arrays.forEach((array) => {
    if (array.length > 0) {
      queue.queue({ array, index: 0 });
    }
  });

  while (queue.length > 0) {
    const { array, index } = queue.dequeue();
    merged.push(array[index]);

    if (index + 1 < array.length) {
      queue.queue({ array, index: index + 1 });
    }
  }

  return merged;
}

export default mergeSortedArrays;
