### 面试官，请不要问我响应式，我不会呀（才怪）

vue.js逐渐热门，在前端框架领域崭露头角这几年，也逐渐成为了前端面试的必考知识点，下面我会通过一系列源码解析的文章来帮助大家梳理这一部分的内容，如有对我的观点持有异议，请在评论区留言，友好交流。

#### vue的响应式是怎么实现的？

响应式，即vue的数据驱动视图，数据层面发生变化，导致UI进行重新渲染。数据响应式这部分涉及到的知识点有关依赖收集、依赖触发这两部分，核心思想就是将数据变换成observe的getter和setter形式。

##### 依赖收集

我们都知道在JavaScript中，ES5中有Object.defineProperty这个方法可以拦截数据的getter和setter，这种方式存在的缺点也很明显，由于ES6之前JavaScript没有提供元编程的能力，因而通过obj.key方式添加属性，arr[key]方式添加数组元素的行为并不会被探测到，这一点需要注意，vue为此提供了set 和 get的方法。

依赖收集其实就是在getter收集使用当前数据的“对象”，这个“对象"在vue1.0版本是真实的dom节点，在vue2.0版本是对应的watcher实例，而watcher中存储的是相应的组件，当组件使用响应式数据，watcher就会将组件收集起来，watcher去获取一遍数据，就能将自身存储到definereactive函数实例化的dep当中，数据发生变化，definereactive函数调用dep的notify方法，通知到对应的watcher，watcher再通知到相应的组件，组件自身进行diff算法，从而实现完整的响应式流程。

##### 依赖触发

这一部分内容，我在上面有提到，definereactive函数中有实例化一个dep对象，该对象上有维持一个subs数组，用来存放相应的watcher，当调用dep.notify函数时，dep会遍历内部subs数组，调用每一个watcher的update方法，从而通知到对应的watcher实例。watcher实例上定义的update方法会执行相应的更新逻辑，这一步分为直接更新和添加到异步队列，添加到异步队列的会在下一个tick中调用。

#### 为什么要引入虚拟dom

（PS：顾名思义，当然是想让你多学一点东西）

由于vue1.0中依赖收集的是真实dom节点，这样完全不需要diff算法来进行比较，因为数据响应式已经完全清楚哪部分节点需要更新，但细颗粒度带来的问题就是内存占用高，性能开销大。

所以在vue2.0中，vue引入的虚拟dom来实现中等颗粒度，setter时，收到通知的watcher只通知到对应组件，组件自身diff算法更新dom节点，虽然有了生成vdom、diff算法这个开销，但对比之前来说性能优化已经非常不错。

需要注意，实际应用中，由于有JavaScript对象模拟dom，并进行diff算法，再挂载到真实节点这个过程，所以速度比不上原生的dom操作。

##### 在vue3.0中，vue对这一点再次进行了优化，这次主要是针对这种场景：

- 组件中有引入动态数据
- 但是组件大部分并没有使用动态数据

直接diff算法将动态节点和静态节点都囊括进去，这样是不是开销有些大？

某些情况下可能一个一个组件中的绝大部分静态节点都需要进行diff算法，导致性能开销和组件大小成正比。

所以在vue3.0中，通过在编译阶段对静态模板进行分析，编译生成block tree。block tree是一个将模板基于动态节点指令切割的嵌套区块。每个区块内部使用一个array来追踪自己包含的动态节点，借助block tree，vue将vnode更新性能从与模板大小整体相关提升为与同台内容的数量相关。



### vue响应式的初始化

在vue的初始化中，首先会对props、methods、data进行初始化。

```js
Vue.prototype._init = function (options?: Object) {
 	// 数据响应式，主要是这个initState
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')
}
```

#### initState执行流程

##### initState方法定义

```js
export function initState (vm: Component) {
  // 在内部维持一个_watchers的数组，
  vm._watchers = []
  //做一个缓存，方便之后调用
  const opts = vm.$options
  // 如果props、methods、data存在，则分别进行初始化
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

##### initProps方法定义

在先前调用时，调用方式

```js
// 传入了vue实例，和对应的options上的props配置选项
initProps(vm, opts.props)
```

源码定义

```js
function initProps (vm: Component, propsOptions: Object) {
  // 从vm.options中进行解构，如果不存在就赋一个初始值，这个就是props
  const propsData = vm.$options.propsData || {}
  // 给vm（vue实例）上新增一个_props对象属性，并使用props缓存
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 对key进行一个缓存，并同时在$options上创建一个数组，用来记录
  const keys = vm.$options._propKeys = []
  // 如果是根节点，那就不存在$parent，通过这一点来进行判断
  const isRoot = !vm.$parent
  // root instance props should be converted
  // root 根节点的props应该被转换
  if (!isRoot) {
    toggleObserving(false)
  }
  // 需要注意，for in的方式会遍历到原型链上的属性，这里只是简单提一下，开发阶段注意这一点即可
  for (const key in propsOptions) {
    // 将propsOptions上的属性都存入keys数组中，对应的就是子组件定义的props
    keys.push(key)
    // 这一步就是检验传入的props和子组件需要的props类型是否相符
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      // 如果是保留字段，则发出警告
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      // 由于父组件重新渲染的时候会重写prop的值，所以需要直接使用prop来作为一个data或者计算属性的依赖
      defineReactive(props, key, value, () => {
        if (vm.$parent && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 在vue.extend()执行期间，props就已经被初始化成功了，我们只需要在这里进行代理prop
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}
```

上面代码中，有用到 toggleObserving(false)，该操作会修改observe中的shouldObserve，从而不会再次observe value，在上面逻辑执行完成后，toggleObserving(true)，进行一个复位操作

```js
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}
```

##### validateProp方法定义

调用方式

```js
// key props中的key值，propsOptions props的参数（默认值、类型要求这些），propsData props数据， vm vue实例
const value = validateProp(key, propsOptions, propsData, vm)
```



源码定义

```js
export function validateProp (
  key: string,
  propOptions: Object,
  propsData: Object,
  vm?: Component
): any {
  // 缓存当前项prop，就是子组件props选项，每一个prop中都有type和初始值
  const prop = propOptions[key]
  // 这一步目的：判断父组件有没有将该props值传给子组件，如果没有absent为true
  // 该方法在最后的工具类中有给出，直接参考即可
  // absent 缺少
  const absent = !hasOwn(propsData, key)
  let value = propsData[key]
  // boolean casting
  // 处理布尔类型，如果没有传入props，并且没有默认值时，赋值为false
  // 类型数组中有布尔值这个选项，且未赋初始值，即为false
  const booleanIndex = getTypeIndex(Boolean, prop.type)
  if (booleanIndex > -1) {
    // 当父组件没有传递props，并且子组件未赋默认值
    if (absent && !hasOwn(prop, 'default')) {
      value = false
      // 这块逻辑含义:
      // 当父组件传入value是一个空字符串，还有另一种情况，暂不分析
      // 当type定义为 type: [Boolean, Object, String],类似这个样子
      // 默认值就为true
    } else if (value === '' || value === hyphenate(key)) {
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      const stringIndex = getTypeIndex(String, prop.type)
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true
      }
    }
  }
  // check default value
  // 当父组件没有传递props
  if (value === undefined) {
    // 给value 赋值为默认值
    value = getPropDefaultValue(vm, prop, key)
    // since the default value is a fresh copy,
    // make sure to observe it.
    const prevShouldObserve = shouldObserve
    toggleObserving(true)
    observe(value)
    toggleObserving(prevShouldObserve)
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    // skip validation for weex recycle-list child component props
    !(__WEEX__ && isObject(value) && ('@binding' in value))
  ) {
    assertProp(prop, key, value, vm, absent)
  }
  return value
}
```



##### getTypeIndex源码定义

调用方式：

```js
const booleanIndex = getTypeIndex(Boolean, prop.type)
```

vue中的使用方式：

```js
export default{
    props:{
        name:{
            type:[string,number,Boolean],
            default:'2333'
        }
    }
}
```

源码定义：

 因为vue中props的type可以设置为一个数组，数组中的任意类型满足即可，所以这里有一个判断

```js
function getTypeIndex (type, expectedTypes): number {
    // 判断propstype是不是数组，不是数组调用isSameType
    if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  // 否则遍历每一项type取值，去调用isSameType
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}
```

##### isSameType方法定义

调用方式：

```js
// 很明显，返回值是个布尔值
isSameType(expectedTypes, type)
```

源码定义：

```js
// 也就是获取相应的类型，之后判断类型是否相同
function isSameType (a, b) {
  return getType(a) === getType(b)
}
//
function getType (fn) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
}
```

##### getPropDefaultValue方法定义

调用方式：

```js
// 给value赋默认值，也就是props中定义的default值，要注意，这里的prop是子组件定义的props中的一个
value = getPropDefaultValue(vm, prop, key)
```

源码定义：

```js
/**
 * 获取默认值
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm: ?Component, prop: PropOptions, key: string): any {
  // no default, return undefined
  // 没有默认值，直接返回undefined即可
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  // 就是个缓存变量，vue中使用很频繁
  const def = prop.default
  // warn against non-factory defaults for Object & Array
  // 开发环境且prop的默认值给了个array或者object就会出现这个错误
  // 原因：引用类型需要使用一个函数返回值，例如()=>[]||{}
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    )
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  // vue实例存在，组件实例上的props数据存在，父组件传进来的props中没有该key值的属性，如果vm实例上_props有，就返回_props上的属性，_props是之前通过proxy代理的，这部分逻辑后面有提到
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  // 这里刚好对应之前props不能赋初始值为object或array
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}
```

#### 工具类方法定义

先前有使用的工具类方法在这里都有定义

```js
/**
 * Check whether the object has the property.
   检查属性值是否是元素本身的属性，如果不是返回false
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}
```

#### initData的执行流程

##### initData方法定义

```js
function initData (vm: Component) {
  // 缓存data
  let data = vm.$options.data
  // data为func，则获取返回结果赋值，data存在，且不为函数，则直接赋值，否则设置初始值{}
  // 在这里同时对组件实例上的_data 进行了赋值
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  // 如果获取到的data不是纯对象，即返回值不是[object object]
  // Symbol.toStringTag 决定了data toString的返回值是什么
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  // 这一步首先进行的就是判断有没有参数名重复，method优先级最高，其次props
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      // method参数名重复
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      // props参数名重复
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
      // key值不以_或$开头
    } else if (!isReserved(key)) {
      // 将data 代理到vm实例上
      proxy(vm, `_data`, key)
    }
  }
  // observe data，就是在这步开始observe，后续会将它作为root节点，对子节点开始递归调用
  observe(data, true /* asRootData */)
}
```

##### proxy函数定义

调用方式：

```js
proxy(vm, `_data`, key)
```

函数定义：

```js
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  // noop是一个空函数
  get: noop,
  set: noop
}
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```



##### 工具函数

```js
/**
 * Check if a string starts with $ or _
 * 判断起始位置是否是$或者_
 */
export function isReserved (str: string): boolean {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}
```

#### observe执行流程

在先前initData方法中，最后一步将当前作为根节点data开始递归调用

```js
 observe(data, true /* asRootData */)
```



##### observe函数定义

```js
/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 不是对象类型，或者是VNode实例，直接返回
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 如果value上有__ob__这个属性，并且其为Observer实例，那直接返回value.__ob__就行了，这部分逻辑查看稍后代码就能明白含义。
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    // 诺、现在明白之前为什么需要设置shouldObserve true or false了吗？
    // 只有在它为true的情况下，才可以进行数据的响应式
    // 在shouldObserve为true、不是服务端渲染、value是数组或者是对象且可拓展，并且不是vue实例情况下，调用Observe实例化一个ob属性
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 将数据转换为响应式数据
    ob = new Observer(value)
  }
  // 如果是root节点的data，并且ob存在，则ob实例上的Vmcount递增
  if (asRootData && ob) {
    ob.vmCount++
  }
  // 返回ob即可
  return ob
}
```

下面需要做的是Observe类的解析

##### Observe类定义

调用方式：

```js
// 将数据转换为响应式数据，生成响应式数据
ob = new Observer(value)
```

源码定义：

```js
/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 * 
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that has this object as root $data

  constructor (value: any) {
    this.value = value
    // 实例化一个用于存储watcher的dep类
    this.dep = new Dep()
    this.vmCount = 0
    // 新增一个_ob_属性
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      // 针对数组类型，如果支持__proto__，则覆盖原型上的方法，否则给每一个数组都增加当前方法
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
```

##### 工具类

```js
/**
 * Define a property.
 */
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    // 不可枚举，所以不会被遍历出来，通过$data.__ob__即可获得
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
// arrayMethods定义，通过array原型创建一个包含array上所有方法的对象
const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

// arraykeys定义：实际上就是获取array上所有方法名
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

// 调用方式：
augment(value, arrayMethods, arrayKeys)
/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 * 覆盖原型上的方法
 */
function protoAugment (target, src: Object, keys: any) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
// 重写每一个数组元素的方法
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
   	// 给每一个数组元素上都添加对应的方法
    def(target, key, src[key])
  }
}
```

##### Array的变化侦测

array的变化侦测是通过拦截器实现，实际上就是通过重写方法，也就是先获取Array上方法，再针对性做出修改.

array.js源码定义

```js
/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 为什么重写这些方法？原因在于这些方法可以改变原数组
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
// 遍历先前的方法列表
methodsToPatch.forEach(function (method) {
  // cache original method
  // 缓存原始方法、英文注释很到位
  const original = arrayProto[method]
  // 调用定义的工具函数def，生成一个代理属性，代理原先的method
  def(arrayMethods, method, function mutator (...args) {
    // 执行原始方法
    const result = original.apply(this, args)
    // 获取响应式对象
    const ob = this.__ob__
    let inserted
    switch (method) {
      // 如果是push、unshift，那么插入部分就是函数参数，如果是splice，那插入部分就是第三个参数开始
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 如果有插入数据，那就调用observeArray方法，将新插入的转换为响应式对象
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 进行依赖触发
    ob.dep.notify()
    return result
  })
})
```

有上面这一步，重写arrayMethods，所以实际在Observe中调用相应argument方法时，已经能够收到依赖触发的提示，数组的响应式逻辑也就是依靠这个实现的。

##### observeArray方法实现

调用方式：

```js
this.observeArray(value)
if (inserted) ob.observeArray(inserted)
```

源码定义：

```js
  /**
   * Observe a list of Array items.
   * 实际上作用就是将数组的每个元素都转换为响应式的
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
```

##### walk方法定义

调用方式：

```js
if (Array.isArray(value)) {
    // 前面已经说清楚了，有疑问向上翻
    const augment = hasProto
    ? protoAugment
    : copyAugment
    augment(value, arrayMethods, arrayKeys)
    this.observeArray(value)
} else {
    this.walk(value)
}
```

源码定义：

```js
  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // 对每一个key值调用defineReactive方法，下面我们详细来看这一部分逻辑
      defineReactive(obj, keys[i])
    }
  }
```

##### defineReactive方法定义

调用方式：

```js
defineReactive(props, key, value) 
defineReactive(obj, keys[i])
```

源码定义：

```js
/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 实例化一个dep，对象类型的依赖收集、触发是在defineReactive中实现的
  // 数组类型的依赖触发是在拦截器中实现的，所以dep定义到Observe中
  // 依赖收集这些操作都是在defineReactive中执行，因为数组下标访问也会触发getter
  const dep = new Dep()
  // 如果不能配置，则直接返回
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 缓存原先的getter和setter
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    // 如果没有传入val，则通过key值设置val
    val = obj[key]
  }
  // 如果没有传入shallow，则继续递归调用，将子属性转换为响应式的
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      // 这部分逻辑稍后有提到，设计比较巧妙，与dep收集watcher相关
      if (Dep.target) {
        // 在getter时，进行依赖收集，收集的就是对应的watcher
        dep.depend()
        if (childOb) {
          // 如果存在子属性，继续进行触发
          childOb.dep.depend()
          if (Array.isArray(value)) {
            // 数组类型继续继续递归
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 三种情况，newVal和value相等，或者为NAN，直接返回
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      // 触发依赖
      dep.notify()
    }
  })
}
```

感觉这块逻辑稍微有点绕，我尽量说清楚，不明白建议对照源码学习，一条线捋清楚即可。

前面有实例化Dep，所以现在就从Dep类定义入手，讲解之前的一系列操作。

##### Dep类定义

实例化方式

- 数组类型在Observe中实例化
- 对象类型在defineReactive中实例化

源码定义：

```js
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }
  // 添加依赖
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }
  // 移除依赖
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }
  // 这个方法在defineReactive的getter有调用，作用就是将watcher添加进依赖
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    // 派发更新
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null
const targetStack = []

export function pushTarget (_target: ?Watcher) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

export function popTarget () {
  Dep.target = targetStack.pop()
}

```



##### Watcher类定义

watcher这部分逻辑从渲染watcher初始化开始梳理，这部分逻辑在最开始mountComponent中有进行相关的定义。

调用方式：

```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  // ...
  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)   
  // ... 
}
```



源码定义：

```js
/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  // ...省略
  constructor(
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm;
    // 判断是否为渲染watch
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    vm._watchers.push(this);
    // options
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.computed = !!options.computed;
      this.sync = !!options.sync;
      this.before = options.before;
    } else {
      this.deep = this.user = this.computed = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid; // uid for batching
    this.active = true;
    this.dirty = this.computed; // for computed watchers
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();
    this.expression =
      process.env.NODE_ENV !== 'production' ? expOrFn.toString() : '';
    // parse expression for getter
    // parsePath这个函数作用是将a.b.c.fn解构出来，赋值给getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = function() {};
        process.env.NODE_ENV !== 'production' &&
          warn(
            `Failed watching path: "${expOrFn}" ` +
              'Watcher only accepts simple dot-delimited paths. ' +
              'For full control, use a function instead.',
            vm
          );
      }
    }
    if (this.computed) {
      this.value = undefined;
      this.dep = new Dep();
    } else {
      this.value = this.get();
    }
  }
}
```

在实例化一个渲染watcher时，执行前面流程后会走到这一步：

```js
if (this.computed) {
      this.value = undefined;
      this.dep = new Dep();
    } else {
      // 在这里，调用this.get方法
      this.value = this.get();
    }
  }
```

###### get方法定义

```js
  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get() {
    // 这个就是定义在Dep中的pushTarget方法
    pushTarget(this);
    let value;
    const vm = this.vm;
    try {
      // 调用getter，触发依赖收集逻辑，这部分是defineReactive中定义的
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`);
      } else {
        throw e;
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value);
      }
      popTarget();
      this.cleanupDeps();
    }
    return value;
  }
```

在get流程中，调用 pushTarget方法，将watcher实例传入进去，这里再回顾一下 pushTarget方法实现：

```js
export function pushTarget (_target: ?Watcher) {
  // 如果已经存在，则在将Dep.target添加到targetStack中，并将Dep.target设置为当前watcher
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}
```

###### 依赖收集执行流程

先Dep.target设置为当前watcher实例

之后调用传入的getter方法，进行组件的更新，也就是初始化过程

```js
 value = this.getter.call(vm, vm)
```

getter方法是在watcher实例化的时候创建的，本质上就是传入的expOrFn

```js
this.getter = expOrFn;
```

渲染watcher在这里传入的是updateComponent

```js
// 这个函数作用就是调用vue实例的_update方法
updateComponent = () => {
    // 这部分内容后续另外写一篇
    vm._update(vm._render(), hydrating)
}
```

在_update方法中，会读取vm上的数据，从而调用了相应数据的getter，触发了依赖收集逻辑。

在每一个响应式数据上都存在getter，getter被触发即会调用 dep.depend方法，具体逻辑：

```js
 get: function reactiveGetter () {
     const value = getter ? getter.call(obj) : val
     // 因为之前已经调用pushTarget函数，设置Dep.target为当前watcher实例，所以执行后续逻辑
     if (Dep.target) {
         // 调用depend方法
         dep.depend()
         if (childOb) {
             childOb.dep.depend()
             if (Array.isArray(value)) {
                 dependArray(value)
             }
         }
     }
     return value
 },
```

###### depend函数定义

```js
 depend () {
    if (Dep.target) {
      // target就是watcher实例,this是dep的实例
      Dep.target.addDep(this)
    }
  }
```

所以实际上这一步的逻辑就是调用watcher的addDep方法，该方法定义：

```js
  /**
   * Add a dependency to this directive.
   */
  addDep(dep: Dep) {
    const id = dep.id;
    // 这几步的判断主要是为了避免重复添加，避免同一数据被添加多次
    // 因为在一个watcher中可能会引用多个响应式对象，响应式对象可能是重复引用的，如果不进行判断，dep的subs可能就会有多个重复的watcher
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  }
```

在前面逻辑执行完成后，会执行以下逻辑：

```js
  if (this.deep) {
      // 递归子节点
      traverse(value);
  }
  // 去除Dep.target上的引用,返回原先缓存的结果
  popTarget();
  // 清楚不需要的依赖
  this.cleanupDeps();
```

###### popTarget定义

```js
export function popTarget () {
  Dep.target = targetStack.pop()
}
```

###### cleanupDeps定义

```js
  /**
   * Clean up for dependency collection.
   */
  cleanupDeps() {
    let i = this.deps.length;
    while (i--) {
      const dep = this.deps[i];
      // 如果newDepIds中没有当前dep.id，那就说明当前不需要这个依赖，需要清除这个依赖
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    // 交换位置，并清除newDepIds
    let tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    // 交换位置，并清除newDeps
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  }
```

###### cleanupDeps函数作用

在deps添加过程中，已经进行了相应的判断，避免dep的subs中存在重复的watch，cleanupDeps处理的不是这种情况。

当同时存在A组件和B组件，A组件渲染时，触发相应的逻辑，对A组件引用的getter添加订阅，当数据改变，又会通知到当前组件；如果同时B组件引用了当前数据，A组件已经卸载，其依赖没有移除，数据改变又通知到A组件，这就会造成性能浪费，所以使用这种方式，在每次添加新的订阅时，先对之前的dep进行一个清理。