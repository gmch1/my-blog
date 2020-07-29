function defineReactive(data, key, value) {
  let dep = []; // 保存依赖的数组
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      dep.push(window.target); // 将依赖保存
      return val;
    },
    set: function (newValue) {
      if (val === newValue) {
        return;
      }
      for (let i = 0; i < dep.length; i++) {
        dep[i](newValue, val); // 触发依赖
      }
      val = newValue;
    },
  });
}

