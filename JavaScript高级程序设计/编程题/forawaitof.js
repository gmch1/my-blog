const arr = [
  () => {
    setTimeout(() => {
      console.log(233);
    }, 200);
  },
  () => {
    setTimeout(() => {
      console.log(1);
    }, 0);
  },
  () => {
    resolve(23333);
  },
  () => {
    setTimeout(() => {
      console.log(666);
    }, 700);
  },
];

async function test() {
  for await (let item of arr) {
    item();
  }
}
test();
