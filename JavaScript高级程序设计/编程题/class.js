function Foo(params) {}
let foo = new Foo();

function instance(left, right) {
  while (left) {
    if (left === right.prototype) return true;
    left = left.__proto__;
  }
  return false;
}

let res = instance([], Object);
console.log(res);
