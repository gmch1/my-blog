### 变化侦测相关的API



#### 1.vm.$watch

1. ##### 用法

   ```js
   vm.$watch(expOrFn,callback,[options])
   ```

   ###### 参数

   {String | Function }	expOrFn

   {Function | Object }	callback

   {Object}	[options]

   ​	{boolean}	deep

   ​	{boolean}	immediate

   ###### 返回值

   {Function}	unwatch

   ###### 用法

   用于观察一个表达式或者computed函数在vue.js实例上的变化。回调函数调用时，会从参数得到新数据（new value）和旧数据（old value）。表达式只接受以点分割的路径，例如a.b.c。如果是一个比较复杂的表达式，可以使用函数代替表达式。

   例如：

   ```js
   vm.$watch('a.b.c',function(newVal,oldVal){
       // do something
   })
   ```

   vm.$watch返回一个取消观察函数，用来停止触发回调：

   ```js
   var unwatch = vm.$watch('a.b.c',(newVal,oldVal)=>{})
   // 之后取消观察
   unwatch()
   ```

   ##### [options]中两个参数

   **deep**。为了发现对象内部值的变化，可以在选项参数中指定deep:true:

   ```js
   vm.$watch('someObject',callback,{
       deep:true
   })
   vm.someObject.nestedValue = 123
   // 回调函数将会被触发
   ```

   _这里需要注意的是，监听数组的变动不需要这么做。_

   

   **immediate**。在选项参数中指定immediate：true，将立即以表达式的当前值触发回调：

   ```js
   vm.$watch('someObject',callback,{
       immediate:true
   })
   // 立即以'a'的当前值触发回调
   ```

   

2. ##### watch的内部原理

   vm.$watcher其实是对Watcher的一种封装，Watcher的原理在第二章介绍过。通过Watcher完全可以实现vm.$watcher的功能，但vm.$watcher中的参数deep和immediate是Watcher中没有的。下面来看一下vm.$watch是怎么实现的：

   ```js
   Vue.prototype.$watch = function (expOrFn, cb, options) {
     const vm = this;
     options = options || {};
     const watcher = new watcher(vm, expOrFn, cb, options);
     if (options.immediate) {
       cb.call(vm, watcher.value);
     }
     return function unWatchFn() {
       watcher.teardown();
     };
   };
   ```

   先执行new Watcher来实现vm.$watch的基本功能。

   这里有一个细节需要注意，expOrFn是支持函数的，所以这里对Watcher做一个简单的修改：

   ```js
   export default class Watcher {
     constructor(vm, expOrFn, cb) {
       this.vm = vm;
       // expOrFn 支持函数
       if (typeof expOrFn === 'function') {
         this.getter = expOrFn;
       } else {
         this.getter = parsePath(expOrFn);
       }
       this.cb = cb;
       this.value = this.get();
     }
   }
   ```

   上面的代码新增了判断expOrFn类型的逻辑。如果是函数，则将它直接赋值给getter；如果不是函数，再使用parsePath函数来读取keypath中的数据。这里keypath指的是属性路径，例如a.b.c.d就是一个keypath，说明可以从vm.a.b.c.d中读取数据。

   当expOrFn 是函数时，会发生很神奇的事情。它不止可以动态返回数据，其中读取的所有数据也都会被Watch观察。

   当expOrFn 是字符串类型的keypath时，Watcher会读取这个keypath所指向的数据并观察这个数据的变化。当expOrFn 是函数类型时，Watcher会同时观察expOrFn 函数中读取的所有vue.js实例上的响应式数据。也就是说：如果函数从vue.js实例上读取了两个数据，那么Watcher会同时观察这两个数据的变化，当其中任意一个发生变化时，Watcher都会得到通知。

   <div style="border:1px solid #ccc;text-align:center;padding:10px 0">
       _vue.js中计算属性（computed）的实现原理与expOrFn 支持函数有很大的关系。_
   </div>

   执行 new Watcher 后，代码会判断用户是否使用了immediate参数，如果使用了，则立即执行一次cb。

   最后，返回一个用于取消观察数据的函数unwatchFn。

   当用户执行这个函数时，实际上是执行了watcher.teardown()来取消观察数据，其本质是把watcher实例从当前正在管擦和的状态的依赖列表中移除。

   前面介绍Watcher时，并没有介绍teardown方法，现在就要在Watcher中添加该方法来实现unwatch的功能。

   首先，需要在Watcher中记录自己都订阅了谁，也就是watcher实例被收集进了哪些Dep里。然后当Watcher不想继续订阅这些Dep时，循环自己记录的订阅列表来通知它们（Dep）将自己从它们（Dep）的依赖列表中移除掉。

   对收集依赖部分代码做出如下改动：

   现在Watcher中添加addDep方法，该方法的作用是在Watcher中记录自己都订阅过哪些Dep：

   ```js
   export default class Watcher {
     constructor(vm, expOrFn, cb) {
       this.vm = vm;
       // expOrFn 支持函数
       this.deps = []; // 新增
       this.depIds = new Set();
       if (typeof expOrFn === 'function') {
         this.getter = expOrFn;
       } else {
         this.getter = parsePath(expOrFn);
       }
       this.cb = cb;
       this.value = this.get();
     }
     addDep(dep) {
       const id = dep.id;
       // 仅在第一次触发时，收集依赖
       if (!this.depIds.has(id)) {
         this.depIds.add(id);
         this.deps.push(dep);
         dep.addSub(this);
       }
     }
   }
   ```

   在上述代码中，我们使用depIds来判断如果当前Watcher已经订阅了该Dep，则不会重复订阅。Watcher读取value时，会触发收集依赖的逻辑。当依赖发生变化时，会通知Watcher重新读取新的数据。如果没有这个判断，就会发现每当数据发生了变化，Watcher都会读取最新的数据。而最新的数据就会再次收集依赖，导致Dep中的依赖有重复。每当数据发现变化时，会同时通知多个Watcher。为了避免这个问题，使用set，只有第一次触发getter的时候才会收集依赖。

   接着，执行this.depIds.add来记录当前Watcher已经订阅了这个Dep。

   然后执行this.deps.push(dep)记录自己都订阅了哪些Dep。

   最后，触发dep.addSub(this)来将自己订阅到Dep中。

   在Watcher中新增addDep方法后，Dep中收集依赖的逻辑也需要有所改变：

   ```js
   let uid = 0; // 新增
   export default class Dep {
     constructor() {
       this.id = uid++; // 新增
       this.subs = [];
     }
     depend() {
       if (window.target) {
         // this.addSub(window.target) // 废弃
         window.target.addDep(this); // 新增
       }
     }
   }
   ```

   此时，Dep会记录数据变化时，需要通知哪些Watcher，而Watcher中同样也记录了自己会被哪些Dep通知。它们其实是多对多的关系，如图4-1所示。

   <img  src='https://common-fd.zol-img.com.cn//g6//M00//05//09//ChMkKV8kbKWIDZPmAAA1io0sbDcAAAWWQP1b8cAADWi690.jpg'/>

   ###### Watcher和Dep为什么是多对多的关系

   如果watcher中的exOrFn是一个表达式，那么肯定只收集一个Dep，并且大部分都是这样。但是exOrFn同样可以是一个函数，如果此时函数中使用了多个数据，那么这是Watcher就需要收集多个Dep，例如：

   ```js
   this.$watch(function () {
       return this.name + this.age
   },(newVal,oldVal)=>{
       console.log(newVal,oldVal)
   })
   ```

   在上面这个例子中，表达式是一个函数，并且在函数中访问了name和age两个数据，这种情况下Watcher内部会收集两个Dep，name的Dep和age的Dep，同时这两个Dep中也会收集Watcher，这导致age和name中任意一个数据发生变化，Watcher都会收到通知。

   

   现在在Watcher中新增方法teardown，来通知这些订阅的Dep，让它们把自己从依赖列表中移除掉：

   ```js
   // 从所有依赖项的Deo列表中将自己移除
   tearDown() {
     let i = this.deps.length;
     while (i--) {
       this.deps[i].removeSub(this);
     }
   }
   ```

   上面代码中，将订阅列表循环，然后分别执行它们的removeSub方法，来把自己从它们的依赖列表中移除掉。

   ```js
   export default class Dep {
       ......
       removeSub(sub) {
         const index = this.subs.indexOf(sub);
         if (index > -1) {
           return this.subs.splice(index, 1);
         }
       }
   	......
   }
   ```

   removeSub 方法就是把Watcher从sub中删除掉，然后当数据发生变化时，将不再通知这个已经删除的Watcher，这就是unwatch的原理。

3. ##### deep参数的原理

