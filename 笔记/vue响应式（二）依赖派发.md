### 依赖派发

先前的文章主要提到的是响应式数据和依赖收集这部分逻辑，下面会花一些时间来讲述一下，依赖触发这部分的逻辑。

#### 处理逻辑

依赖派发这部分逻辑针对对象和数组有着不同的处理方式，对象类型的依赖触发是在defineReactive中定义，而数组的依赖触发是在拦截器中定义，下面先来看一下对象类型的这部分逻辑处理：

##### defineReactive定义

相关源码：

```js
defineReactive(
 obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
){
    //...
    setter时触发当前逻辑，进行依赖触发
      set: function reactiveSetter (newVal) {
      如果对象本身就要getter方法，则先调用getter方法
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 值相同或者都为NAN，返回即可
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // 如果setter存在，调用setter方法
      if (setter) {
        setter.call(obj, newVal)
      } else {
      // 否则直接赋值
        val = newVal
      }
      // shallow为false，即不传的情况下，会将value变成响应式的
      childOb = !shallow && observe(newVal)
      // 触发依赖
      dep.notify()
    }
}
```

可以看到上面实际上核心流程就一句，setter时调用dep.notify方法，通知到相关的dep

##### dep.notify定义

相关代码：

```js
 notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
```

notify方法逻辑也很简单，循环遍历subs中每一项，调用它的update方法，subs中存储的就是相关的watcher，所以下来看一下update方法实现。

##### update方法实现：

相关代码：

```js
  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   * 依赖项更新时触发当前逻辑
   */
  update() {
    /* istanbul ignore else */
    // 计算属性处理
    if (this.computed) {
      // A computed property watcher has two modes: lazy and activated.
      // It initializes as lazy by default, and only becomes activated when
      // it is depended on by at least one subscriber, which is typically
      // another computed property or a component's render function.
      if (this.dep.subs.length === 0) {
        // In lazy mode, we don't want to perform computations until necessary,
        // so we simply mark the watcher as dirty. The actual computation is
        // performed just-in-time in this.evaluate() when the computed property
        // is accessed.
        this.dirty = true;
      } else {
        // In activated mode, we want to proactively perform the computation
        // but only notify our subscribers when the value has indeed changed.
        this.getAndInvoke(() => {
          this.dep.notify();
        });
      }
      // 同步直接调用run方法，立即执行
    } else if (this.sync) {
      this.run();
    } else {
      // 这块不看后面代码，猜也能知道肯定跟任务队列有关
      queueWatcher(this);
    }
  }
```

上面核心流程也就是最后那个queueWatcher方法，传递的参数为watcher实例，下面我们看一下它的实现：

##### queueWatcher方法实现

相关代码：

```js
/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher: Watcher) {
  // 这个id就是watcher中定义的uid，dep中也有类似实现
  const id = watcher.id
  // 这几步目的就是剔除掉任务队列中重复的watcher，避免重复渲染
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true
      nextTick(flushSchedulerQueue)
    }
  }
}
```

这部分主要功能就是将相应的watcher push进一个队列中，去除重复的watcher，在nextTick后调用flushSchedulerQueue进行异步更

新。

##### flushSchedulerQueue 方法实现

相关代码：

```js
/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  // 修改先前的标记位，这样下一次就可以走到else的逻辑
  flushing = true
  let watcher, id

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  // 尤大在这里的注释非常到位，赞一个
  // 1. 组件是从parent到child这个顺序开始更新的，因为父组件总是比子组件先创建
  // 2. 一个组件的用户watcher会在渲染watcher前执行，因为用户定义的watcher是在渲染watcher之前创建的
  // 3. 如果一个组件在父组件watcher 运行期间被销毁了，那它的watcher就会被跳过
  
  // 给任务队列拍个序，按照id自增的顺序排队，那肯定用户定义的比较早，id在前面，执行先执行
  queue.sort((a, b) => a.id - b.id)

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  // 不对队列的长度做缓存，因为在watcher运行期间，可能会有更多的watcher被push进来
  for (index = 0; index < queue.length; index++) {
    // 注意一点：index不是在当前函数内部定义的，所以在执行过程中，函数外部就可以知道执行到队列中那个位置了
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    // 在执行run方法时，可能会产生新的watcher，也就会再次调用queueWatcher方法
    watcher.run()
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      // 检测是否发生循环引用
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice()

  resetSchedulerState()

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue)
  callUpdatedHooks(updatedQueue)

  // devtool hook
  /* istanbul ignore if */
  // 这里的逻辑是为了chrome的调试工具准备的
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}
```

在上面这段代码执行过程中，执行run方法时，可能会产生新的watcher，也就会再次调用queueWatcher方法，这时由于标志位flushing被修改为true，所以就会走到else的逻辑：

```js
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
      // 现在就会走到else逻辑
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      // 因为index是在外部定义的，所以就可以知道执行到什么位置
      // 找出当前执行到的watcher刚好小于插入watcherid的位置，执行插入操作
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true
      nextTick(flushSchedulerQueue)
    }
  }
}
```

先前流程我在注释中有详细解释，有疑问参考注释即可，当执行完毕后，queue队列长度发生改变，这也就是为什么之前不会去缓存队列的长度。

之后会执行一个resetSchedulerState的函数，现在查看它的定义：

##### resetSchedulerState定义

相关代码：

```js
export const MAX_UPDATE_COUNT = 100

const queue: Array<Watcher> = []
const activatedChildren: Array<Component> = []
let has: { [key: number]: ?true } = {}
let circular: { [key: number]: number } = {}
let waiting = false
let flushing = false
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}

```

该方法作用就是清空当前的任务队列，恢复默认值，等待下一次的执行。

现在来看一下watcher.run方法的实现

##### run方法定义

相关代码

```js
  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run() {
    if (this.active) {
      this.getAndInvoke(this.cb);
    }
  }

  getAndInvoke(cb: Function) {
   	// 执行get方法，获取新值
    const value = this.get();
    // 新值与旧值不同、值是对象类型、使用了deep，满足任一条件，都执行回调函数
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      const oldValue = this.value;
      this.value = value;
      this.dirty = false;
      if (this.user) {
        // 执行回调函数的时候，会把新值和旧值都传回去，这就是使用watch时拿到的函数参数
        try {
          cb.call(this.vm, value, oldValue);
        } catch (e) {
          handleError(e, this.vm, `callback for watcher "${this.expression}"`);
        }
      } else {
        cb.call(this.vm, value, oldValue);
      }
    }
  }
```

如果是执行渲染watcher，会触发依赖收集逻辑，从而将watcher收集到dep中。

#### 总结

依赖派发就是在setter时触发相关的依赖，调用dep中的notify函数，通知到subs中相应的watcher，watcher调用内部的run方法或者添加到一个异步队列当中，在nextTick中执行，在这里做了一定的优化，从而避免了watcher的重复触发。