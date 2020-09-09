### nextTick原理

在vue使用过程中，经常就会遇到dom节点更新未完成等情况，某些情况下就需要使用nexttick添加一个宏任务或微任务，在下一次tick中再触发当前回调，从而获取更新后的dom。

#### 宏任务微任务

##### settimeout setinterval 是不精确的

JavaScript本身是个单线程的，由一个任务队列来决定当前执行的任务，另外有另一个队列用来做定时器的回调，定时器时间到达，则将定时器回调push到当前队列中，主线程任务执行完毕后，就会去执行定时器的回调，如果主线程上的任务过于繁琐，耗时过长，settimeout也就是不准确的，可能会超时。

同理，对于setInterval来说，主线程阻塞可能导致两次定时的结果连续被psuh进任务队列，执行间隔会较预设值明显缩短，不能达到预期要求，所以有了一个新做法，使用两个settimeout来模拟setInterval，具体实现请百度，通过两个settimeout虽然还可能超时，但是不存在连续执行的问题。

##### requestAnimationFrame

相较于上面两种实现方式，rAF的效果就比较符合预期，可以实现16.6ms的触发定时，并且是较为精确的，所以一般会在CSS动画中使用，它一般会在重绘之前被调用。

说了这些，宏任务其实包括：

- script脚本
- settimeout、setInterval、setImmediate
- rAF，姑且这样认为

微任务包括：

- promise.then 包括其他all finall race 方法
- process.nextTick node js支持

promise之所以包括这些，原因在于它们都是promise.then的封装，具体实现在后续文章我会详细说明。

##### 浏览器事件执行流程

1. 首先执行一个宏任务：Script标签中的代码
2. 执行同步任务
3. 有异步回调promise.then则添加到当前宏任务的微任务队列，在宏任务队列清空后执行当前微任务队列中的任务
4. 有宏任务，譬如settimeout，添加到宏任务队列，即下一个宏任务时才执行
5. 清空微任务队列过程中，如果有遇到新的微任务，push到当前队列，直到全部执行完毕



#### nextTick源码实现

在vue2.4版本之前，全部使用微任务来触发，但是由于微任务的优先级过高，导致某些情况下可能比事件冒泡触发更快，所以针对这一点做出了一些调整，默认使用微任务，但是某些情况下使用宏任务，比如在v-on附加的事件处理程序

相关代码：

```js
const callbacks = []
let pending = false
// 微任务定义
let microTimerFunc
// 宏任务定义
let macroTimerFunc
// 标志位，是否使用宏任务
let useMacroTask = false

export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  
  callbacks.push(() => {
    // 如果传递回调函数
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
      // 
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    // 如果使用宏任务来触发
    if (useMacroTask) {
      // 调用宏任务逻辑
      macroTimerFunc()
    } else {
      // 调用微任务逻辑
      microTimerFunc()
    }
  }
  // $flow-disable-line
  // 没有传入callback，且支持promise，则返回一个promise
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}

```

##### 宏任务、微任务执行函数

相关代码：

###### 宏任务代码定义

```js
// macroTimerFunc 函数变量在之前就已经声明了
// Determine (macro) task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
// 在这里是有一个降级的过程，首先判断setImmediate是否支持，并且是原生的方法，这个只有edge支持
// 其次判断messageChannel是否支持
// 最终如果都不支持，则调用settimeout来执行回调
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  macroTimerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else if (typeof MessageChannel !== 'undefined' && (
  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'
)) {
  const channel = new MessageChannel()
  const port = channel.port2
  channel.port1.onmessage = flushCallbacks
  macroTimerFunc = () => {
    port.postMessage(1)
  }
} else {
  /* istanbul ignore next */
  macroTimerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

可以看到使用宏任务来执行这部分逻辑有一个渐进式降级的过程，setImmediate优先级大于messageChannel大于settimeout。

###### 微任务代码定义

```js
// Determine microtask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  microTimerFunc = () => {
    p.then(flushCallbacks)
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    // 添加一个空的计时器，来强制刷新任务队列
    if (isIOS) setTimeout(noop)
  }
} else {
  // fallback to macro
  microTimerFunc = macroTimerFunc
}
```

在这里是判断promse是否支持，并且是原生的promise方法，因为第三方垫片库的promise也是使用settimeout来实现的，这里也是有个降级的过程，最坏的情况下，使用宏任务来代替微任务进行处理逻辑。

##### 函数执行逻辑

最终调用flushCallbacks函数来清空当前任务队列，完成整个流程的闭环。

```js
function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}
```

函数逻辑就是取出任务队列中的每一项，并清空原先队列，最后分别进行执行即可。

