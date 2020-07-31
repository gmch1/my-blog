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

function defineReactive(data, key, val) {
  let childOb = observer(val); // 修改
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

export function observer(value, asRootData) {
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
