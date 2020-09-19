// function Parent(name, age) {
//   this.name = name;
//   this.age = age;
// }
// Parent.prototype.count = 233;

// function Child() {}
// Child.prototype = new Parent();
// Child.prototype.constructor = Child;

// let child = new Child();
// console.log(child.count); // 233

// function Parent(name, age) {
//   this.name = name;
//   this.age = age;
// }
// Parent.prototype.count = 233;

// function Child(name, age) {
//   Parent.call(this, name, age);
// }
// Child.prototype = new Parent();
// Child.prototype.constructor = Child;

// let child = new Child('zhangsan', 88);
// console.log(child); // Child { name: 'zhangsan', age: 88 }
// console.log(child.count); // 233

// function Parent(name, age) {
//   this.name = name;
//   this.age = age;
// }
// Parent.prototype.count = 233;

// function Child(name, age) {
//   Parent.call(this, name, age);
// }
// Child.prototype = Object.create(Parent.prototype);
// Child.prototype.constructor = Child;

// let child = new Child('zhangsan', 88);
// console.log(child); // Child { name: 'zhangsan', age: 88 }
// console.log(child.count); // 233

// class Parent {
//   constructor(name, age) {
//     this.name = name;
//     this.age = age;
//   }
// }
// class Child extends Parent {
//   constructor(naem, age) {
//     super(this);
//   }
// }

// let child = new Child('233', 999);
// console.log(child);

// (function A() {
//   console.log(A);
//   A = 1; // [Function: A]
//   console.log(globalThis.A); // undefined
//   console.log(A); // [Function: A]
// })();

// var a;
// a = 10;
// (function () {
//   var a;
//   console.log(a); // undefined
//   a = 5;
//   console.log(globalThis.a); // undefined
//   a = 20;
//   console.log(a); // 20
// })();

// example 1
var a = {},
  b = '123',
  c = 123;
a[b] = 'b';
a[c] = 'c';
console.log(a[b]);

// example 2
var a = {},
  b = Symbol('123'),
  c = Symbol('123');
a[b] = 'b';
a[c] = 'c';
console.log(a[b]);

// example 3
var a = {},
  b = { key: '123' },
  c = { key: '456' };
a[b] = 'b';
a[c] = 'c';
console.log(a[b]);

for (var i = 0; i < 10; i++) {
  setTimeout(
    (i) => {
      console.log(i);
    },
    1000,
    i
  );
}

for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    console.log(i);
  }, 1000);
}

for (var i = 0; i < 10; i++) {
  ((i) => {
    setTimeout(() => {
      console.log(i);
    }, 1000);
  })(i);
}

// sleep
function sleep(fn, time) {
  Promise.resolve(
    setTimeout(() => {
      fn.apply(this, arguments);
    }, time)
  );
}
function fn() {
  console.log(233);
  console.log(233);
}
sleep(fn, 1000);

Number.prototype.add = function (n) {
  return this.valueOf() + n;
};
Number.prototype.minus = function (n) {
  return this.valueOf() - n;
};
(5).add(3).minus(2);
