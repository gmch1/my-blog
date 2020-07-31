Vue.prototype.$watch = function (expOrFn, cb, options) {
  const vm = this;
  options = options || {};
  const watcher = new watcher(vm, expOrFn, cb, options);
  if (options.immediate) {
    cb.call(vm, watcher.value);
  }
  return function unWatchFn() {
    watcher.teardown();
  };
};

export default class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm;
    // expOrFn 支持函数
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
    }
    this.cb = cb;
    this.value = this.get();
  }
}

export default class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm;
    // expOrFn 支持函数
    this.deps = []; // 新增
    this.depIds = new Set();
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
    }
    this.cb = cb;
    this.value = this.get();
  }
  addDep(dep) {
    const id = dep.id;
    if (!this.depIds.has(id)) {
      this.depIds.add(id);
      this.deps.push(dep);
      dep.addSub(this);
    }
  }
  // 从所有依赖项的Deo列表中将自己移除
  tearDown() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].removeSub(this);
    }
  }
}

let uid = 0; // 新增
export default class Dep {
  constructor() {
    this.id = uid++; // 新增
    this.subs = [];
  }
  depend() {
    if (window.target) {
      // this.addSub(window.target) // 废弃
      window.target.addDep(this); // 新增
    }
  }

removeSub(sub) {
  const index = this.subs.indexOf(sub);
  if (index > -1) {
    return this.subs.splice(index, 1);
  }
}
}
