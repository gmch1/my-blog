##### 请写出代码的运行结果

```js
//请写出输出内容
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}
async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(function () {
  console.log('setTimeout');
}, 0);

async1();

new Promise(function (resolve) {
  console.log('promise1');
  resolve();
}).then(function () {
  console.log('promise2');
});
console.log('script end');

// script start
// async1 start
// async2
// async1 end
// promise1
// script end
// promise2
// setTimeout
```

```js
async function async1() {
    console.log('async1 start');
    await async2();
    console.log('async1 end');
}
async function async2() {
    //async2做出如下更改：
    new Promise(function(resolve) {
    console.log('promise1');
    resolve();
}).then(function() {
    console.log('promise2');
    });
}
console.log('script start');

setTimeout(function() {
    console.log('setTimeout');
}, 0)
async1();

new Promise(function(resolve) {
    console.log('promise3');
    resolve();
}).then(function() {
    console.log('promise4');
});

console.log('script end');

// script start
// async1 start
// promise1
// promise3
// script end
// promise2
// async1 end
// promise4
// setTimeout
```

```js
async function async1() {
  console.log('async1 start');
  await async2();
  //更改如下：
  setTimeout(function () {
    console.log('setTimeout1');
  }, 0);
}
async function async2() {
  //更改如下：
  setTimeout(function () {
    console.log('setTimeout2');
  }, 0);
}
console.log('script start');

setTimeout(function () {
  console.log('setTimeout3');
}, 0);
async1();

new Promise(function (resolve) {
  console.log('promise1');
  resolve();
}).then(function () {
  console.log('promise2');
});
console.log('script end');

// script start
// async1 start
// promise1
// script end
// promise2
// setTimeout3
// setTimeout2
// setTimeout1
```

```js
async function a1() {
  console.log('a1 start');
  await a2();
  console.log('a1 end');
}
async function a2() {
  console.log('a2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('promise1');
});

a1();

let promise2 = new Promise((resolve) => {
  resolve('promise2.then');
  console.log('promise2');
});

promise2.then((res) => {
  console.log(res);
  Promise.resolve().then(() => {
    console.log('promise3');
  });
});
console.log('script end');

// script start
// a1 start
// a2
// promise2
// script end
// promise1
// a1 end
// promise2.then
// promise3
// setTimeout
```

##### S 异步解决方案的发展历程以及优缺点

1. 回调函数

   错误不利于捕捉、不可以使用try catch、会造成回调地狱

2. promise

   不能取消promise，错误需要回调函数来捕获

3. generator

   可以控制函数的执行、配合co库使用

4. async await

   await 本身让出线程，让其他的先执行，如果多个异步没有依赖，就会造成性能降低

```js
let a = 0
let b = async () => {
  a = a + await 10
  console.log('2', a) // 2 10
}
b()
a++
console.log('1', a) // 1 1
```

原因generator会保存状态堆栈中的东西，所以a还是0

##### Promise 构造函数是同步执行还是异步执行，那么 then 方法呢？

promise构造函数是同步执行的，then方法是异步执行的，用户传入的executor函数执行完毕后，更改状态，从而执行队列中的回调函数，这个队列中的函数是then方法传递进来的，状态一旦改变就不会再变化，之后传入回调就是直接执行的过程。

##### 介绍模块化发展历程

JavaScript的模块化要经历四个时期：

- 立即执行函数

- 最开始是amd、cmd这些，代表是require js
- 之后是common js规范，它是同步导入、值的拷贝、运行时加载
- 最终es 模块化，异步导入、值的引用、编译时输出

##### 实现一个 sleep 函数，比如 sleep(1000) 意味着等待1000毫秒，可从 Promise、Generator、Async/Await 等角度实现

```js
// promise
function sleep(time) {
  return new Promise((resolved) => {
    setTimeout(() => {
      resolved();
    }, time);
  });
}
sleep(1000).then(() => {
  console.log(233);
});

// async
async function sleep(time) {
  await new Promise((resolved) => {
    setTimeout(() => {
      resolved();
    }, time);
  });
}
sleep(1000).then(() => {
  console.log(233);
});
```

##### 为什么 Vuex 的 mutation 和 Redux 的 reducer 中不能做异步操作

如果你经常用React+Redux开发，那么就应该了解Redux的设计初衷。Redux的设计参考了Flux的模式，作者希望以此来实现时间旅行，保存应用的历史状态，实现应用状态的可预测。所以整个Redux都是函数式编程的范式，要求reducer是纯函数也是自然而然的事情，使用纯函数才能保证相同的输入得到相同的输入，保证状态的可预测。所以Redux有三大原则：

- 单一数据源，也就是state
- state 是只读，Redux并没有暴露出直接修改state的接口，必须通过action来触发修改
- 使用纯函数来修改state，reducer必须是纯函数

要在reducer中加入异步的操作，如果你只是单纯想执行异步操作，不会等待异步的返回，那么在reducer中执行的意义是什么。如果想把异步操作的结果反应在state中，首先整个应用的状态将变的不可预测，违背Redux的设计原则，其次，此时的currentState将会是promise之类而不是我们想要的应用状态，根本是行不通的。

##### 要求设计 LazyMan 类，实现以下功能

```js

```

##### 输出以下代码运行结果，为什么，如果希望每1s输出一个执行结果，应该如何修改

```js
const list = [1, 2, 3]
const square = num => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(num * num)
    }, 1000)
  })
}

function test() {
  list.forEach(async x=> {
    const res = await square(x)
    console.log(res)
  })
}
test() // 1 4 9
```

普通的for 等于同一个块作用域连续await，而forEach的回调是一个个单独的函数，跟其他回调同时执行，互不干扰，所以修改这个通过使用其他遍历器就可以解决

###### 修改方法：

```js
// 使用for await of，调用异步遍历器
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
```

##### 实现 Promise.retry，成功后 resolve 结果，失败后重试，尝试超过一定次数才真正的 reject

```js

```

