var vm = new Vue({
  el: '#el',
  template: '#demo-template',
  methods: {
    action() {
      this.obj.name = 'berwin';
    },
  },
  data: {
    obj: {},
  },
});

var vm = new Vue({
  el: '#el',
  template: '#demo-template',
  methods: {
    action() {
      delete this.obj.name;
    },
  },
  data: {
    obj: {
      name: 'berwin',
    },
  },
});
