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

['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse'].forEach(
  (method) => {
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
