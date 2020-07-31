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
  observerArray(items) {
    for (let i = 0, l = items.length; i < length; i++) {
      this.observerArray(items[i]);
    }
  }
}
