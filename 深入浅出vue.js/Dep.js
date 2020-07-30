export default class Dep {
  constructor() {
    this.subs = [];
  }
  addSub(sub) {
    this.subs.push(sub);
  }
  removeSub(sub) {
    remove(this.subs, sub);
  }
  // 修改
  depend() {
    if (window.target) {
      this.addSub(window.target);
    }
  }
  // 新增
  notify() {
    const subs = this.subs.slice();
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}
function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

function defineReactive(data, key, val) {
  let dep = new Dep();
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      dep.depend();
      return val;
    },
    set: function (newVal) {
      if ((val = newVal)) {
        return;
      }
      val = newVal;
      dep.notify();
    },
  });
}

