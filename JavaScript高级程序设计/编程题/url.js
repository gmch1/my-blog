const url = 'http:localhost:8080?age=233&name=object&time=777';

function parseUrl(url) {
  let res = {};
  let data = url.split('?')[1];
  // data age=2333&name=objc&time=777
  data = data.split('&');
  let len = data.length;
  for (let i = 0; i < len; i++) {
    let [key, val] = data[i].split('=');
    // console.log(key, val);
    res[key] = val;
  }
  return res;
}


