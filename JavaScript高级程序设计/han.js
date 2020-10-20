var fn;

function rf() {
  var a = 233;
  var rffff = function () {
    return a;
  };
  fn = rffff;
}
rf();
function rn() {
  var a = 2333;
  fn();
}

rn();

fn();
