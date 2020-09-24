const name = {
  lasename: '222',
  firstname: '444',
  fullname() {
    return this.firstname + this.lasename;
  },
};
console.log(name.fullname());
