function Foo() {}
let f = new Foo();
let res = f instanceof Foo;
// console.log(res) true

// instanceof 实现
function instance(left, right) {
  let map = ['string', 'boolean', 'number', 'symbol', 'bigint', 'undefined'];
  let index = map.indexOf(typeof left);
  if (index !== -1) {
    // 基本类型
    return map[index];
  }
  if (left === null) return null;
  let proto = left;
  let prototype = right.prototype;
  while (proto !== null) {
    if (proto === prototype) {
      return true;
    } else {
      proto = proto.__proto__;
    }
  }
  return false;
}
let symbol = null;

let result = instance(symbol, Function);
// let result = f instanceof Object
console.log(result);
