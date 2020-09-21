// //请写出输出内容
// async function async1() {
//   console.log('async1 start');
//   await async2();
//   console.log('async1 end');
// }
// async function async2() {
//   console.log('async2');
// }

// console.log('script start');

// setTimeout(function () {
//   console.log('setTimeout');
// }, 0);

// async1();

// new Promise(function (resolve) {
//   console.log('promise1');
//   resolve();
// }).then(function () {
//   console.log('promise2');
// });
// console.log('script end');

// // script start
// // async1 start
// // async2
// // promise1
// // script end
// // async1 end
// // promise2
// // setTimeout

// async function async1() {
//   console.log('async1 start');
//   await async2();
//   console.log('async1 end');
// }
// async function async2() {
//   //async2做出如下更改：
//   new Promise(function (resolve) {
//     console.log('promise1');
//     resolve();
//   }).then(function () {
//     console.log('promise2');
//   });
// }
// console.log('script start');

// setTimeout(function () {
//   console.log('setTimeout');
// }, 0);
// async1();

// new Promise(function (resolve) {
//   console.log('promise3');
//   resolve();
// }).then(function () {
//   console.log('promise4');
// });

// console.log('script end');

// // script start
// // async1 start
// // promise1
// // promise3
// // script end
// // promise2
// // async1 end
// // promise4
// // setTimeout

// async function async1() {
//   console.log('async1 start');
//   await async2();
//   //更改如下：
//   setTimeout(function () {
//     console.log('setTimeout1');
//   }, 0);
// }
// async function async2() {
//   //更改如下：
//   setTimeout(function () {
//     console.log('setTimeout2');
//   }, 0);
// }
// console.log('script start');

// setTimeout(function () {
//   console.log('setTimeout3');
// }, 0);
// async1();

// new Promise(function (resolve) {
//   console.log('promise1');
//   resolve();
// }).then(function () {
//   console.log('promise2');
// });
// console.log('script end');

// // script start
// // async1 start
// // promise1
// // script end
// // promise2
// // setTimeout3
// // setTimeout2
// // setTimeout1

// async function a1() {
//   console.log('a1 start');
//   await a2();
//   console.log('a1 end');
// }
// async function a2() {
//   console.log('a2');
// }

// console.log('script start');

// setTimeout(() => {
//   console.log('setTimeout');
// }, 0);

// Promise.resolve().then(() => {
//   console.log('promise1');
// });

// a1();

// let promise2 = new Promise((resolve) => {
//   resolve('promise2.then');
//   console.log('promise2');
// });

// promise2.then((res) => {
//   console.log(res);
//   Promise.resolve().then(() => {
//     console.log('promise3');
//   });
// });
// console.log('script end');

// // script start
// // a1 start
// // a2
// // promise2
// // script end
// // promise1
// // a1 end
// // promise2.then
// // promise3
// // setTimeout

// promise
// function sleep(time) {
//   return new Promise((resolved) => {
//     setTimeout(() => {
//       resolved();
//     }, time);
//   });
// }
// sleep(1000).then(() => {
//   console.log(233);
// });

// // async
// async function sleep(time) {
//   await new Promise((resolved) => {
//     setTimeout(() => {
//       resolved();
//     }, time);
//   });
// }
// sleep(1000).then(() => {
//   console.log(233);
// });

// LazyMan('Tony');
// // Hi I am Tony

// LazyMan('Tony').sleep(10).eat('lunch');
// // Hi I am Tony
// // 等待了10秒...
// // I am eating lunch

// LazyMan('Tony').eat('lunch').sleep(10).eat('dinner');
// // Hi I am Tony
// // I am eating lunch
// // 等待了10秒...
// // I am eating diner

// LazyMan('Tony')
//   .eat('lunch')
//   .eat('dinner')
//   .sleepFirst(5)
//   .sleep(10)
//   .eat('junk food');
// // Hi I am Tony
// // 等待了5秒...
// // I am eating lunch
// // I am eating dinner
// // 等待了10秒...
// // I am eating junk food

// Promise.prototype.finally = function (fn) {
//   this.then(
//     () => {
//       fn();
//     },
//     () => {
//       fn();
//     }
//   );
//   return this;
// };

const list = [1, 2, 3];
const square = (num) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(num * num);
    }, 1000);
  });
};

async function test() {
  for await (let x of list) {
    const res = await square(x);
    console.log(res);
  }
}
test();

Promise.prototype.retry = function(promiseFn,time){
  
}