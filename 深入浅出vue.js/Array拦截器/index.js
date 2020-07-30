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


