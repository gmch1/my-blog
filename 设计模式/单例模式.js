// 类上定义的静态方法

class SingleDog {
  show() {
    console.log('signle');
  }
  static getInstance() {
    if (!SingleDog.instance) {
      SingleDog.instance = new SingleDog();
    }
    return SingleDog.instance;
  }
}
// 现在多次调用new 返回的都是同一个对象
SingleDog.getInstance() === SingleDog.getInstance(); // true

// 使用闭包

function SingleDog(params) {}
SingleDog.getInstance = (function () {
  let _target;
  return function () {
    if (!_target) {
      _target = new SingleDog();
    }
    return _target;
  };
})();

SingleDog.getInstance() === SingleDog.getInstance(); // true

// 对localstorage进行封装，实现单一状态数
class Storage {
  static getInstance() {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }
  getItem(key) {
    return localStorage.getItem(key);
  }
  setItem(key, val) {
    return localStorage.setItem(key, val);
  }
}

const storage1 = Storage.getInstance();
const storage2 = Storage.getInstance();

storage1.setItem('name', '李雷');
// 李雷
storage1.getItem('name');
// 也是李雷
storage2.getItem('name');

// 返回true
storage1 === storage2;


// 单例模式实现全局model框
// 核心思想：使用立即执行函数，创建全局变量，每次调用都返回原先创建的结果，从而降低开销
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>单例模式弹框</title>
  </head>
  <style>
    #modal {
      height: 200px;
      width: 200px;
      line-height: 200px;
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      border: 1px solid black;
      text-align: center;
    }
  </style>
  <body>
    <button id="open">打开弹框</button>
    <button id="close">关闭弹框</button>
  </body>
  <script>
    // 核心逻辑，这里采用了闭包思路来实现单例模式
    const Modal = (function () {
      let modal = null;
      return function () {
        if (!modal) {
          modal = document.createElement('div');
          modal.innerHTML = '我是一个全局唯一的Modal';
          modal.id = 'modal';
          modal.style.display = 'none';
          document.body.appendChild(modal);
        }
        return modal;
      };
    })();

    // 点击打开按钮展示模态框
    document.getElementById('open').addEventListener('click', function () {
      // 未点击则不创建modal实例，避免不必要的内存占用;此处不用 new Modal 的形式调用也可以，和 Storage 同理
      const modal = new Modal();
      modal.style.display = 'block';
    });

    // 点击关闭按钮隐藏模态框
    document.getElementById('close').addEventListener('click', function () {
      const modal = new Modal();
      if (modal) {
        modal.style.display = 'none';
      }
    });
  </script>
</html>
