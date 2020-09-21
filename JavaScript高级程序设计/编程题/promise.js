setTimeout(() => {
  console.log(1);
  new Promise(() => {
    console.log(888);
  });
}, 0);

console.log(2);

Promise.resolve(() => {
  console.log(3);
});

console.log(4);

new Promise((resolve) => {
  console.log(5);
  resolve(6);
})
  .then((res) => {
    console.log(7);
    console.log(res);
  })
  .catch((e) => {
    console.log(8);
  })
  .then(() => {
    console.log(9);
  });

console.log(10);
// 2 4 5 10 7 1
