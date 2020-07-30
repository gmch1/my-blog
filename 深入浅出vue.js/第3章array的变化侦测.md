### Array的变化侦测

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

而将一个数据转换成响应式的，需要通过observer，所以我们只需要在observer中使用拦截器覆盖那些即将被转换成响应式Array类型的原型就好：

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