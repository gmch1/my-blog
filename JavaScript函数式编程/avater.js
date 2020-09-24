let arr = [1, 2, 3, 4, 5];

const sum = (total, current) => total + current;
const size = (arr) => arr.length;
const total = (arr) => arr.reduce(sum);
const divide = (a, b) => a / b;
const avater = divide(total(arr), size(arr));
console.log(avater);
