function pause() {
  return new Promise(function($return, $error) {
    setTimeout(function() {
      return $return(0);
    }, 0);
  });
}

async function doNothing() {
  return;
}

async function test() {
  var t = Date.now();
  for (var j = 0; j < 50; j++) {
    for (var i = 0; i < 2000; i++) {
      await doNothing();
    }
    await pause();
  }
  return Date.now() - t;
}

test().then(console.log);
