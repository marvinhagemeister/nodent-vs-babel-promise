function _continue(value, then) {
  return value && value.then ? value.then(then) : then(value);
}

function _for(test, update, body) {
  var stage;

  for (;;) {
    var shouldContinue = test();

    if (_isSettledPact(shouldContinue)) {
      shouldContinue = shouldContinue.__value;
    }

    if (!shouldContinue) {
      return result;
    }

    if (shouldContinue.then) {
      stage = 0;
      break;
    }

    var result = body();

    if (result && result.then) {
      if (_isSettledPact(result)) {
        result = result.__state;
      } else {
        stage = 1;
        break;
      }
    }

    if (update) {
      var updateValue = update();

      if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
        stage = 2;
        break;
      }
    }
  }

  var pact = new _Pact();

  var reject = _settle.bind(null, pact, 2);

  (stage === 0 ? shouldContinue.then(_resumeAfterTest) : stage === 1 ? result.then(_resumeAfterBody) : updateValue.then(_resumeAfterUpdate)).then(void 0, reject);
  return pact;

  function _resumeAfterBody(value) {
    result = value;

    do {
      if (update) {
        updateValue = update();

        if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
          updateValue.then(_resumeAfterUpdate).then(void 0, reject);
          return;
        }
      }

      shouldContinue = test();

      if (!shouldContinue || _isSettledPact(shouldContinue) && !shouldContinue.__value) {
        _settle(pact, 1, result);

        return;
      }

      if (shouldContinue.then) {
        shouldContinue.then(_resumeAfterTest).then(void 0, reject);
        return;
      }

      result = body();

      if (_isSettledPact(result)) {
        result = result.__value;
      }
    } while (!result || !result.then);

    result.then(_resumeAfterBody).then(void 0, reject);
  }

  function _resumeAfterTest(shouldContinue) {
    if (shouldContinue) {
      result = body();

      if (result && result.then) {
        result.then(_resumeAfterBody).then(void 0, reject);
      } else {
        _resumeAfterBody(result);
      }
    } else {
      _settle(pact, 1, result);
    }
  }

  function _resumeAfterUpdate() {
    if (shouldContinue = test()) {
      if (shouldContinue.then) {
        shouldContinue.then(_resumeAfterTest).then(void 0, reject);
      } else {
        _resumeAfterTest(shouldContinue);
      }
    } else {
      _settle(pact, 1, result);
    }
  }
}

function _isSettledPact(thenable) {
  return thenable instanceof _Pact && thenable.__state === 1;
}

const _Pact = function () {
  function _Pact() {}

  _Pact.prototype.then = function (onFulfilled, onRejected) {
    const state = this.__state;

    if (state) {
      const callback = state == 1 ? onFulfilled : onRejected;

      if (callback) {
        const result = new _Pact();

        try {
          _settle(result, 1, callback(this.__value));
        } catch (e) {
          _settle(result, 2, e);
        }

        return result;
      } else {
        return this;
      }
    }

    const result = new _Pact();

    this.__observer = function (_this) {
      try {
        const value = _this.__value;

        if (_this.__state == 1) {
          _settle(result, 1, onFulfilled ? onFulfilled(value) : value);
        } else if (onRejected) {
          _settle(result, 1, onRejected(value));
        } else {
          _settle(result, 2, value);
        }
      } catch (e) {
        _settle(result, 2, e);
      }
    };

    return result;
  };

  return _Pact;
}();

function _settle(pact, state, value) {
  if (!pact.__state) {
    if (value instanceof _Pact) {
      if (value.__state) {
        if (state === 1) {
          state = value.__state;
        }

        value = value.__value;
      } else {
        value.__observer = _settle.bind(null, pact, state);
        return;
      }
    }

    if (value && value.then) {
      value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
      return;
    }

    pact.__state = state;
    pact.__value = value;
    const observer = pact.__observer;

    if (observer) {
      observer(pact);
    }
  }
}

function pause() {
  return new Promise(function ($return, $error) {
    setTimeout(function () {
      return $return(0);
    }, 0);
  });
}

const test = function () {
  try {
    var t = Date.now();
    var j = 0;
    return Promise.resolve(_continue(_for(function () {
      return j < 50;
    }, function () {
      return j++;
    }, function () {
      var i = 0;
      return _continue(_for(function () {
        return i < 2000;
      }, function () {
        return i++;
      }, function () {
        return Promise.resolve(doNothing()).then(function () {});
      }), function () {
        return Promise.resolve(pause()).then(function () {});
      });
    }), function () {
      return Date.now() - t;
    }));
  } catch (e) {
    return Promise.reject(e);
  }
};

const doNothing = function () {
  try {
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  }
};

test().then(console.log);
