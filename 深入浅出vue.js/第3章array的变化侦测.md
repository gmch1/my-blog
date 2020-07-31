Array的变化侦测

#### 如何追踪变化

Object的变化是靠setter来追踪的，只要一个数据发生了变化，就一定会触发setter。

在Array中，可以用一个拦截器覆盖数组原型上的方法，之后，每当使用Array原型上的方法操作数组时，其实执行的都是拦截器中提供的方法，如push。然后，在拦截器中使用原生Array的原型方法去操作数组。

<img src='https://common-fd.zol-img.com.cn//g6//M00//04//0F//ChMkKV8i6-qIa9GfAAB10pALiIAAAAT3gKcyLcAAHXq067.jpg'/>

这样通过拦截器，就可以追踪到Array的变化。

#### 拦截器

拦截器其实就是一个和Array.prototype一样的Object，里面包含的属性一模一样，只不过这个object中某些可以改变数组自身内容的方法是我们处理过的。

经过整理，Array原型中可以改变数组自身内容的方法有7个，分别是push、pop、shift、unshift、splice、sort、reverse。

由此得出代码：

```js
const arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);

['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse'].forEach(
  (method) => {
    const original = arrayProto[method];
    Object.defineProperty(arrayMethods, method, {
      value: function mutator(...args) {
        return original.apply(this, args);
      },
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
);
```

在上面代码中，我们创建了变量arrayMethods,它继承自Array.prototype，具备其所有功能。

接下来，我们在arrayMethods上使用object.defineProperty方法将那些可以改变数组自身内容的方法进行封装。

所以，当使用push方法时，其实调用的是arrayMethods.push，而arrayMethods.push是函数mutator，也就是说，实际上执行的是mutator函数。

最后在mutator中执行original（他是Array原型上原生的方法）来做它应该做的事情，如push。

因此，我们就可以在mutator中做一些其他事情，比如发送变化通知。

#### 使用拦截器覆盖Array原型

有了拦截器之后，想要让它剩下，就需要使用它去覆盖Array.prototype。但是我们又不能直接覆盖，因为这样会污染全局的Array，这并不是我们希望看到的结果。我们希望拦截操作只针对那些被侦测了变化的数据剩下，也就是说希望拦截器只覆盖那些响应式数组的原型。

而将一个数据转换成响应式的，需要通过Observer，所以我们只需要在Observer中使用拦截器覆盖那些即将被转换成响应式Array类型的原型就好：

```js
export class Observer {
  constructor(value) {
    this.value = value;
    if (Array.isArray(value)) {
      // 改变数组类型数据的原型，重写相应的方法以实现拦截的效果
      value.__proto__ = arrayMethods;
    } else {
      // 对象类型和先前保持一致
      this.walk(value);
    }
  }
}
```

 value.\__proto__ = arrayMethods;

这行代码的作用是将拦截器赋值给value.\__proto__，通过对象的隐式原型就可以很巧妙的实现覆盖value原型的功能，如图3-2所示：





<img src='https://common-fd.zol-img.com.cn//g6//M00//04//0F//ChMkKV8i8bGIFoM2AABijpASSkEAAAT5gOfCIMAAGKm879.jpg'/>

\__proto__是Object.getPrototypeOf 和 Object.setPrototypeOf的早期实现，所以使用ES6语法完成相应的效果也是可以的。

#### 将拦截器方法挂载到数组的属性上

虽然绝大多数浏览器都支持这种非标准属性来访问原型，但并不是所有浏览器都支持，因此，我们需要处理不能使用\__proto__的情况。

vue的方法非常粗暴，如果不能使用\__proto__，就直接将arrayMethods身上的这些方法设置到被侦测的数组上：

```js
import { arrayMethods } from './index';

// 测试__proto__是否可用
const hasProto = '__proto__' in {};
const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

export class Observer {
  constructor(value) {
    this.value = value;

    if (Array.isArray(value)) {
      const argument = hasProto ? protoAugment : copyAugment;
      augment(value, arrayMethods, arrayKeys);
    } else {
      this.walk(value);
    }
  }
}

function protoAugment(target, src, keys) {
  target.__proto__ = src;
}

function copyAugment(target, src, keys) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
    def(target, key, src[key]);
  }
}
```

在上面的代码中，我们使用hasProto来判断当前浏览器是否支持\__proto__。还新增了copyAugment函数，用来将已经加工了拦截操作的原型方法直接添加到value属性中。

此外，还使用hasProto判断浏览器是否支持\__proto__，如果支持，则使用protoAugment函数覆盖原型；如果不支持，则调用copyAugment函数将拦截器中的方法挂载到value上。

如图3-3所示，在浏览器并不支持\__proto__的情况下，会在数组上挂载一些方法。当用户使用这些方法时，其实调用的不是浏览器原生提供的Array原型上的方法，而是拦截器中提供的方法。

<img src='https://common-fd.zol-img.com.cn//g6//M00//05//00//ChMkKV8i-ECIeOUUAACHXLuCSn0AAAT6gCaf1sAAId0999.jpg'/>

因为访问一个对象的方法时，只有当其自身不存在这个方法，才会去它的原型上找这个方法。

#### 如何收集依赖

Object的依赖是在defineReactive中的getter里使用Dep收集的，每个key都会有一个对应的dep列表来存储依赖。

简单来说，就是在getter中收集依赖，依赖被存储在Dep里。

数组在读取相应位置的元素时，也会触发这个属性的getter，所以数组的依赖收集和object一样，都在dineReactive中进行

```js
const { Observer } = require('.');

function defineReactive(data, key, val) {
  if (typeof val === 'object') new Observer(val);
  let dep = new dep();
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      dep.depend();
      // 在这里收集array依赖
      return val;
    },
    set: function (newval) {
      if (val === newval) {
        return;
      }
      dep.notify();
      val = newval;
    },
  });
}
```

**Array在getter中收集依赖，在拦截器中触发依赖。**



#### 依赖列表存储

vue.js把Array的依赖存放在Observer中：

```js
export class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new dep(); //新增dep
    if (Array.isArray(value)) {
      const argument = hasProto ? protoAugment : copyAugment;
      augment(value, arrayMethods, arrayKeys);
    } else {
      this.walk(value);
    }
  }
}
```

##### 为什么数组的依赖（Dep）要保存在Observer实例上呢？

数组在getter中收集依赖，在拦截器中触发也来，所以这个依赖保存的位置就很关键，它必须在getter和拦截器中都可以访问到。

我们之所以将依赖保存在Observer实例上，时因为getter中可以访问到Observer实例，同时在Array拦截器中也可以访问到OBserver实例。

#### 收集依赖

把Dep实例保存在Observer的属性上之后，我们就可以在getter中像下面这样访问并收集依赖：

```js
function defineReactive(data, key, val) {
  let childOb = Observer(val); // 修改
  let dep = new Dep();
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      dep.depend();

      // 新增
      if (childOb) {
        childOb.dep.depend();
      }
      return val;
    },
    set: function (newVal) {
      if (val === newval) {
        return;
      }
      dep.notify();
      val = newval;
    },
  });
}

// 尝试为value创建一个Observer实例
// 如果创建成功，直接返回新创建的Observer实例
// 如果value已经存在一个Observer实例，直接返回它
// __ob__内容是一个响应式数据实例，在下一小节有说明

export function observe(value, asRootData) {
  if (!isObject(value)) {
    return;
  }
  let ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob;
}
```

在上面代码中，我们新增了函数observe，它尝试创建一个Observer实例。如果vallue已经是响应式数据，不需要再次创建Observer实例，直接返回已经创建的Observer实例即可，避免了重复侦测value变化的问题。

此外，我们在defineReactive函数中调用了observe，它把value当作参数传了进去并拿到一个返回值，那就是Observer实例。

前面我们介绍过数组为什么在getter中收集依赖，而defineReactive函数中的value很有可能会是一个数组，通过observe我们得到了数组的Observer实例（childOb），最后通过childOb的dep执行depend方法来收集依赖。

通过这种方式，我们就可以实现在getter中将依赖收集到Observer实例的dep中。即：通过这样的方式可以为数组收集依赖。

#### 在拦截器中获取Observer实例

因为Array拦截器是对原型的一种封装，所以可以在拦截器中访问到this（当前被操作的数组）。

而dep保存在Observer中，所以需要在this上读取到Observer实例。

```js
function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: trye,
    configurable: true,
  });
}

export class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new this.dep();
    def(value, '__ob__', this); // 新增
    if (Array.isArray(value)) {
      const argument = hasProto ? protoAugment : copyAugment;
      augment(value, arrayMethods, arrayKeys);
    } else {
      this.walk(value);
    }
  }
}
```

在上面代码中，我们在Observer中新增了一段代码，它可以在value上新增一个不可枚举的属性\__ob__，这个属性的值就是当前Observer的实例。

这样我们就可以通过数组数据的\__ob__属性拿到Observer实例，然后就可以拿到\__ob__上的dep。

当然，\__ob__不仅可以在拦截器中访问Observer实例，还可以用来标记当前的value是否已经被Observer转换成了响应式数据。

也就是说，所以被侦测了变化的数据身上都会有一个\__ob__属性来表示它们是响应式的。上一节中observe函数就是通过\_\_ob\_\_属性来判断：如果value是响应式的，则直接返回\__ob__；如果不是响应式的，则使用new Observer来将数据转换成响应式数据。

当value身上被标记了\_\_ob\_\_之后，就可以通过value.\__ob__来访问Observer实例。如果是Array拦截器，因为拦截器是原型方法，所以可以直接通过this.\__ob__来访问Observer实例。如：

```js
['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse'].forEach(
  (method) => {
    // 缓存原始方法
    const original = arrayProto[method];
    Object.defineProperty(arrayMethods, method, {
      value: function mutator(...args) {
        const ob = this.__ob__; // 新增
        return original.apply(this, args);
      },
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
);

```

在上面的代码中，我们在mutator函数里通过this.\__ob__来获取OBserver实例。

#### 向数组的依赖发送通知

当侦测到数组发生变化时，会向依赖发送通知。此时，首先要能访问到依赖。前面已经介绍过如何在拦截器中访问Observer实例，所以这里只需要在Observer实例中拿到dep属性，然后直接发送通知就行了：

```js
['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse'].forEach(
  (method) => {
    const original = arrayProto[method];
    def(arrayMethods, method, function mutator(...args) {
      const result = original.apply(this, args);
      const ob = this.__ob__; // 新增
      ob.dep.notify(); // 向依赖发送消息
      return result;
    });
  }
);
```

在上面的代码中，我们调用了ob.dep.notify()去通知依赖（Watcher）数据发生了变化。

#### 侦测数组中元素的变化

前面提到如何侦测数组的变化，指的是数组自身的变化，比如是否新增一个元素，是否删除一个元素等。

其实数组中保存了一些元素，它们的变化也是需要侦测的。比如，当数组object身上某个属性的值发生了变化时，也需要发送通知。

此外，如果用户使用了push往数组中新增了元素，这个新增元素的变化也需要侦测。

也就是说，所以响应式数据的子数据都要侦测，不论是object中的数据还是array中的数据。

这里我们先介绍如何侦测所有数据子集的变化，下一节再来介绍如何侦测新增元素的变化。

前面介绍Observer时说过，其作用是将object的所有属性转换为getter/setter的形式来侦测变化。现在Observer类不光能处理Object类型的数据，还可以处理Array类型的数据。

所以，我们要在Observer中新增一些处理，让它可以将Array也变成响应式的：

```js
export class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new this.dep();
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
      const argument = hasProto ? protoAugment : copyAugment;
      augment(value, arrayMethods, arrayKeys);
    } else {
      this.walk(value);
    }
  }

  // 侦测Array中每一项
  observeArray(items) {
    for (let i = 0, l = items.length; i < length; i++) {
      this.observeArray(items[i]);
    }
  }
}
```

在上面的代码中，我们在Observer中新增了对Array类型数据的处理逻辑。

这里新增了observeArray方法，其作用是循环Array中的每一项，执行observe函数来侦测变化。前面介绍过observe函数，其实就是将数组中每个元素都执行一遍new Observer，很明显就是一个递归的过程。

现在只要将一个数据丢进去，Observer就会把这个数据的所有子数据转换成响应式的。



#### 侦测新增元素的变化

数组中有一些方法是可以新增数组内容的，比如push，而新增的内容也需要转换成响应式来侦测变化，否则会出现修改数据时无法触发消息等问题。因此，我们必须侦测数组中新增元素的变化。

实现方法是：获取到新增元素，并使用Observer来侦测。

##### 获取新增元素

想要获取新增元素，我们需要在拦截器中对数组方法的类型进行判断。如果操作数组的方法是push、unshfit和splice（可以新增数组元素的方法），则把参数中新增的元素拿过来，用Observer来侦测：

```js
['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse'].forEach(
  (method) => {
    // 缓存原始方法
    const original = arrayProto[method];
    def(arrayMethods, method, function mutator(...args) {
      const result = original.apply(this, args);
      const ob = this.__ob__;
      // 缓存要插入的结果
      let inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;
        case 'splice':
          // splice 方法 第三位开始是插入的值
          inserted = args.slice(2);
          break;
      }
      ob.dep.notify(); // 向依赖发送消息
      return result;
    });
  }
);
```

在上面的代码中，我们通过switch对method进行判断，如果method是push、unshift、splice这种可以新增数组元素的方法，那么从args中将新增元素取出来，暂存在inserted中。

#### 使用Observer侦测新增元素

前面有介绍Observer会将自身的实例附加到value的\__ob__属性上。所有被侦测了变化的数据都有一个\_\_ob\_\_属性，数组元素也不例外。

因此，我们可以在拦截器中通过this访问到\_\_ob\_\_，然后调用\_\_ob\_\_上的observeArray方法就可以了：

```js
['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse'].forEach(
  (method) => {
    // 缓存原始方法
    const original = arrayProto[method];
    def(arrayMethods, method, function mutator(...args) {
      const result = original.apply(this, args);
      const ob = this.__ob__;
      // 缓存要插入的结果
      let inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;
        case 'splice':
          // splice 方法 第三位开始是插入的值
          inserted = args.slice(2);
          break;
      }
      if (inserted) ob.observeArray(inserted); // 新增
      ob.dep.notify(); // 向依赖发送消息
      return result;
    });
  }
);
```

在上面的代码中，我们从this.\__ob__上拿到Observer实例后，如果有新增元素，则使用ob.observeArray来侦测这些新增元素的变化。



#### 关于Array的问题

前面介绍过，对Array的变化侦测是通过拦截原型的方法实现的。正式因为这种实现方式，其实有些数组操作vue.js是拦截不到的，例如

```js
this.list[0] = 2
```

修改数组中第一个元素值时，无法侦测到数组的变化，所以并不会触发re-render或watch等。

例如：

```js
this.list.length = 0
```

这个清空数组操作也无法侦测到数组的变化，所以也不会触发re-render 或 watch等。

因为vue.js的实现方式决定了无法对上面举的两个例子做拦截，也就没有办法响应。在ES6之前，无法做到模拟数组的原生行为，所以拦截不到也是没有办法的事情。ES6提供了元编程的能力，所以有能力拦截，所以vue3.0中使用proxy来实现这部分功能，从而解决这个问题。



#### 总结

Array追踪变化的方式和Object不一样。因为它是通过方法来改变内容的，使用我们通过创建拦截器去覆盖数组原型的方式来追踪变化。

为了不污染全局Array.prtototype，我们在Observer中只针对那些需要侦测变化的数组使用\__protot__来覆盖原型方法，但是proto在ES6之前并不是标准属性，不是所有llq都支持它。因此针对不支持proto属性的浏览器，我们直接循环拦截器，把拦截器中的方法直接设置到数组身上来拦截Array原型上的方法。

Array收集依赖的方式和Object一样，都是在getter中收集。但是由于使用依赖的位置不同，数组要在拦截器中向依赖发送消息，所有依赖不能向Object那样保存在defineReactive中，而是保存在了Observer实例上。

在Observer中，我们对每个侦测了变化的属性都标上印记\_\_ob\_\_，并把this（Observer实例）保存在\_\_ob\_\_上。这主要有两个作用，一方面是为了标记数据是否被侦测了变化（保证同一个数据只被侦测一次），另一方面可以很方便的通过数据渠道\_\_ob\_\_，从而拿到Observer实例上保存的依赖。当拦截到数组发生变化时，向依赖发送通知。

除了侦测数组自身的变化，数组元素发生的变化也需要侦测。我们在Observer中判断如果当前被侦测的数据是数组，则调用observerArray方法将数组中的每一个元素都转换成响应式的并侦测变化。

除了侦测已有属性之外，当用户使用push等方法向数组中新增数据时，新增的数据也要进行变化侦测。我们使用当前操作数组的方法来进行判断，如果是push、unshift、splice方法，则从参数中将新增数据提取出来，然后使用observerArray对新增数据进行变化侦测。

由于ES6之前，JavaScript并没有提供元编程的能力，所有对于数组类型的数据，一些语法无法追踪到变化，只能拦截原型上的方法，而无法拦截数组特有的语法，例如使用length清空数组的操作就无法拦截。

