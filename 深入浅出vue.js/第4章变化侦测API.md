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

   这里需要注意的是，监听数组的变动不需要这么做。

   **immediate**。在选项参数中指定immediate：true，将立即以表达式的当前值触发回调：

   ```js
   vm.$watch('someObject',callback,{
       immediate:true
   })
   // 立即以'a'的当前值触发回调
   ```

   

   

2. ##### watch的内部原理

3. ##### deep参数的原理