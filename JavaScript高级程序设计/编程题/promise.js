const arr = [1, 2, 3];
arr.reduce((p, item) => {
  return p.then(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(console.log(item));
      }, 1000);
    });
  });
}, Promise.resolve());
