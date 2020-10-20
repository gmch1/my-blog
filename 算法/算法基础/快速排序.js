function swap(arr, a, b) {
  [arr[a], arr[b]] = [arr[b], arr[a]];
}
const quickSort = (arr, l, r) => {
  if (l >= r) return;
  let x = arr[l];
  let i = l - 1,
    j = r + 1;
  while (i < j) {
    i++;
    while (arr[i] < x) i++;
    j--;
    while (arr[j] > x) j--;
    if (i < j) {
      swap(arr, i, j);
    }
  }
  let left = quickSort(arr, l, j);
  let right = quickSort(arr, j + 1, r);
};

let arr = [3, 4, 1, 8, 33, 3];
quickSort(arr, 0, arr.length - 1);
