### 编程题

##### ['1', '2', '3'].map(parseInt)

map函数中，传入函数的参数有三项，item，index，arr；

parseInt接收参数有两个，number，基数radix，进制的要求为2-32之间，其他返回nan

拆解结果：

```js
parseInt(1,0) //1
parseInt(2,1) //nan
parseInt(3,2) //nan
```

当基数为0，且传入参数不以0x，0开头时，按照10进行处理，返回结果为1

##### 防抖和节流的区别

- 防抖

  防抖是在一定时间后触发事件，在次期间如果再触发，就取消先前的计时器，重新设置计时器进行回调。

  ```js
  function debounce(fn,wait){
      let timer = null
      return function(){
          clearTimeout(timer)
          timer = setTimeout(()=>{
              fn.apply(this,arguments)
          },wait)
      }
  }
  
  ```

  

- 节流

  防抖是为了降低一些频发触发的事件，比如scroll事件，进行节流处理，一定时间间隔连续触发只执行一次。

  ```js
  function throttle(fn,wait){
      let timer = null
      return function(){
  		if(timer)return 
          timer = setTimeout(()=>{
              timer = null
              fn.apply(this,arguments)
          },wait)
      }
  }
  ```

  ##### Set、Map、WeakMap、weakSet区别

  - Set

    存储一个key值val值相同的集合，不存在相同的属性

    支持add、delete、has方法，支持遍历

  - WeakSet

    弱引用，key值为对象，可以用来存储dom节点，不支持遍历

  - Map

    支持set、delete、has、get方法，是一个哈希表结构，支持遍历

  - WeakMap

    不支持遍历、弱引用

  ##### 继承

  ###### ES5继承

  继承这里有以下四种

  - 原型式继承、

    原型式继承主要思想就是设置子类的原型为父函数的原型，之后设置元素的constructor属性为函数本身

    ```js
    function Parent(name, age) {
      this.name = name;
      this.age = age;
    }
    Parent.prototype.count = 233;
    
    function Child() {}
    Child.prototype = new Parent();
    Child.prototype.constructor = Child;
    
    let child = new Child();
    console.log(child.count); // 233
    ```

    

  - 构造函数继承

    构造函数继承本身是在子函数中调用父类构造函数，缺点是不能继承夫函数在原型上定义的属性和方法

    ```js
    function Parent(name, age) {
      this.name = name;
      this.age = age;
    }
    Parent.prototype.count = 233;
    
    function Child(name, age) {
      Parent.call(this, name, age);
    }
    
    let child = new Child('zhangsan', 88);
    console.log(child); // Child { name: 'zhangsan', age: 88 }
    ```

    

  - 组合式继承

    通过在子类函数内部调用父类函数，同时设置原型为父类实例化的对象，从而实现继承原型和构造函数实例化对象上的属性，缺点：会调用两次父类的构造函数。

    ```js
    function Parent(name, age) {
      this.name = name;
      this.age = age;
    }
    Parent.prototype.count = 233;
    
    function Child(name, age) {
      Parent.call(this, name, age);
    }
    Child.prototype = new Parent();
    Child.prototype.constructor = Child;
    
    let child = new Child('zhangsan', 88);
    console.log(child); // Child { name: 'zhangsan', age: 88 }
    console.log(child.count); // 233
    
    ```

    

  - 寄生组合式继承

    和组合式继承类似，但是只用调用一次夫类构造函数

    ```js
    function Parent(name, age) {
      this.name = name;
      this.age = age;
    }
    Parent.prototype.count = 233;
    
    function Child(name, age) {
      Parent.call(this, name, age);
    }
    Child.prototype = Object.create(Parent.prototype)
    Child.prototype.constructor = Child;
    
    let child = new Child('zhangsan', 88);
    console.log(child); // Child { name: 'zhangsan', age: 88 }
    console.log(child.count); // 233
    
    ```

- ES6 继承

##### JavaScript模块化

- common js

  特点

  - 同步
  - 值的拷贝，导出的实际上是module.exports对象
  - 运行时加载

- ES moudle

  特点

  - 异步
  - 输出值的引用，可以实现tree shacking
  - 编译时引入

##### 关于let const声明的变量不在window上

- 在ES6时，ECMA规范决定了一个和window同级的块级作用域
- 通过console.dir可以显示出来，是在script上定义的属性，并不是在window上定义的

##### 下面代码打印什么内容，为什么

```js
var b = 10;
(function b() {
  b = 20;
  console.log(b)
})()	
```

输出结果：func b

**原因：**

JavaScript立即执行的具名函数，函数名在内部是不能修改的

##### 在JavaScript的立即执行的具名函数A内修改A的值发生了什么？

如下代码：

```js

(function A() {
  console.log(A);
  A = 1; // [Function: A]
  console.log(globalThis.A); // undefined
  console.log(A); // [Function: A]
})();
```

##### 简单改造下面的代码，使之分别打印10 和 20

```js
var b = 10
(function b(){
    b = 20
    console.log(b)
})()
```

打印10

```js
var b = 10;
(function b() {
  b = 20;
  console.log(window.b);
})();
```

打印20

```js
var b = 10;
(function b() {
  let b = 20;
  console.log(b);
})();
```

##### 作用域相关

node下和浏览器执行结果不一致

```js
// node
var a;
a = 10;
(function () {
  var a;
  console.log(a); // undefined
  a = 5;
  console.log(globalThis.a); // undefined
  a = 20;
  console.log(a); // 20
})();
```

##### 使用sort对数组进行排序[3, 15, 8, 29, 102, 22]

是按照字典序进行排序

```js
102 15 22 29 3 8
```

##### 输出以下代码执行结果

```js
var obj = {
    '2': 3,
    '3': 4,
    'length': 2,
    'splice': Array.prototype.splice,
    'push': Array.prototype.push
}
obj.push(1)
obj.push(2)
console.log(obj)
// [,,1,2]
```

在一个有length属性的对象上，部署push方法时，它就会成为一个伪数组，调用push方法，传入参数，length属性+1，之前内容清空

##### 输出以下代码的执行结果

```js
var a = {n: 1};
var b = a; // b:{n:1}
a.x = a = {n: 2};
// . 的优先级比=优先级高，所以给b上增加了一个新属性
// 之后对a进行重新赋值，从而实现以下效果
console.log(a.x) //undefined a:{n:2}
console.log(b.x) // {n:2} b:{n:1,x:{n:2}}
```

一个是赋值的问题，地址共享，另外一个是优先级问题

##### 箭头函数和普通函数区别是什么，可以使用new吗

- 箭头函数this是在定义时绑定的，本身没有this，this就是父函数的this
- 箭头函数没有原型对象
- 箭头函数不能当generator函数
- 箭头函数不能当构造函数使用，所以不能用new 实例化对象

##### 输出以下代码执行结果

```js
// example 1
var a = {},
  b = '123',
  c = 123;
a[b] = 'b';
a[c] = 'c';
console.log(a[b]); // c

// example 2
var a = {},
  b = Symbol('123'),
  c = Symbol('123');
a[b] = 'b';
a[c] = 'c';
console.log(a[b]); // b

// example 3
var a = {},
  b = { key: '123' },
  c = { key: '456' };
a[b] = 'b';
a[c] = 'c';
console.log(a[b]); // c
```

第三步坑在于：将对象作为object key值时，会调用对象的toString方法，所以两个对象key值相同，后面覆盖前面的。

##### 请写出如下代码的执行结果

```js
function changeObjProperty(o) {
  o.siteUrl = "http://www.baidu.com"
  o = new Object()
  o.siteUrl = "http://www.google.com"
} 
let webSite = new Object();
changeObjProperty(webSite);
console.log(webSite.siteUrl); // http://www.baidu.com

```

##### 请写出以下代码的执行结果

```js
function Foo() {
    Foo.a = function() {
        console.log(1)
    }
    this.a = function() {
        console.log(2)
    }
}
Foo.prototype.a = function() {
    console.log(3)
}
Foo.a = function() {
    console.log(4)
}
Foo.a();  // 4
let obj = new Foo();
obj.a(); // 2
Foo.a(); // 1
```

##### 请写出以下代码的执行结果

```js
String('11') == new String('11'); // true
String('11') === new String('11'); // false
```

原因在于==运算符会调用Symbol.toPrimitive进行一个类型转换，转换成基本类型，===不存在类型转换

##### 请写出以下代码的执行结果

```js
var name = 'Tom';
(function() {
    if (typeof name == 'undefined') {
        var name = 'Jack';
        console.log('Goodbye ' + name);
    } else {
        console.log('Hello ' + name);
    }
})();
// Goodbye  + Jack
```

原因:声明提升

##### 请写出如下代码的执行结果

```js
var name = 'Tom';
(function() {
    if (typeof name == 'undefined') {
        name = 'Jack';
        console.log('Goodbye ' + name);
    } else {
        console.log('Hello ' + name);
    }
})();
// Hello Tom
```

作用域链查找规则，当前作用域没有，就会到上层作用域链中查找，找到全局tom，所以tom不是undefined，返回tom

##### 输出以下代码的执行结果

```js
1 + "1" // '11'

2 * "2" // 4

[1, 2] + [2, 1] // 1221

"a" + + "b" // aNaN
```

##### 输出以下代码的执行结果

```js
function wait() {
  return new Promise(resolve =>
  	setTimeout(resolve, 10 * 1000)
  )
}

async function main() {
  console.time();
  const x = wait();
  const y = wait();
  const z = wait();
  await x;
  await y;
  await z;
  console.timeEnd();
}
main(); // 10s
```

##### 输出以下代码的执行结果

```js
function wait() {
  return new Promise(resolve =>
    setTimeout(resolve, 10 * 1000)
  )
}

async function main() {
  console.time();
  await wait();
  await wait();
  await wait();
  console.timeEnd();
}
main(); // 30s
```





#### 