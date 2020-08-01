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

export default class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm;

    // 新增
    if (options) {
      this.deep = !!options.deep;
    } else {
      this.deep = false;
    }

    this.deps = [];
    this.depIds = new Set();
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
    }
    this.cb = cb;
    this.value = this.get();
  }
  get() {
    window.target = this;
    let value = this.getter.call(vm, vm);

    if (this.deep) {
      traverse(value);
    }
    window.target = undefined;
    return value;
  }
}

const seenObjects = new Set();

export function traverse(value) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse(val, seen) {
  let i, keys;
  const isArr = Array.isArray(val);
  const isObject = typeof val === 'object';
  if ((!isArr && !isObject(val)) || Object.isFrozen(val)) {
    return;
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return;
    }
    seen.add(depId);
  }
  if (isArr) {
    i = val.length;
    while (i--) {
      _traverse(val[i], seen);
    }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) {
      _traverse(val[key[i]], seen);
    }
  }
}
