// 需求： 需要根据工厂员工的相关信息，动态创建员工的信息列表

function User(name, type, age, work) {
  this.name = name;
  this.type = type;
  this.age = age;
  this.work = work;
}

function Factory(name, age, type) {
  let work;
  switch (type) {
    case 'coder':
      work = ['写代码', '写系分', '修Bug'];
      break;
    case 'product manager':
      work = ['订会议室', '写PRD', '催更'];
      break;
    case 'boss':
      work = ['喝茶', '看报', '见客户'];
    case 'xxx':
    // 其它工种的职责分配
    // ...
  }
  return new User(name, type, age, work);
}
