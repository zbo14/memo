'use strict'

/* eslint-env node, es6 */

const crypto = require('crypto')
const {expect} = require('chai')
const {describe, it} = require('mocha')
const {memoCache, memoEvent, on, once} = require('../src')
const {memoize} = require('lodash')

const input = 32
const output = 1346269

const iters = 10

const inputs = [
  'foo',
  'bar',
  'foobaz'
]

const hash = (str) => {
  const hash = crypto.createHash('sha256')
  hash.update(str)
  return hash.digest('base64')
}

const outputs = inputs.map((input) => hash(input))

const hashCache = (_, str) => hash(str)

const hashes = (fn) => {
  for (let i = 0; i < iters; i++) {
    inputs.forEach((input, j) => {
      const result = fn(input)
      expect(result).to.equal(outputs[j])
    })
  }
}

const hashEvent = (emitter, nowEvent, prevEvent, str, idx) => {
  const result = hash(str)
  on(emitter, nowEvent, (p) => emitter.emit(p, result, idx))
  emitter.emit(nowEvent, prevEvent)
}

const hashesEvent = (emitter, done) => {
  let count = 0
  const total = inputs.length * iters
  on(emitter, 'done', (result, idx) => {
    expect(result).to.equal(outputs[idx])
    if (++count === total) {
      done()
    }
  })
  for (let i = 0; i < iters; i++) {
    inputs.forEach((input, j) => {
      emitter.emit('run', 'done', input, j)
    })
  }
}

const fibRecursive = (num) => {
  if (num === 1) {
    return 0
  } else if (num === 2) {
    return 1
  }
  return fibRecursive(num - 1) + fibRecursive(num - 2)
}

function fibCache (fn, num) {
  if (num === 1) {
    return 0
  } else if (num === 2) {
    return 1
  }
  return fn(num - 1) + fn(num - 2)
}

const fibEvent = (emitter, nowEvent, prevEvent, num) => {
  let sum = 0
  once(emitter, nowEvent, (x) => {
    sum += x
    once(emitter, nowEvent, (x) => {
      sum += x
      on(emitter, nowEvent, (p) => emitter.emit(p, sum))
      emitter.emit(nowEvent, prevEvent)
    })
    emitter.emit('run', nowEvent, num - 1)
  })
  emitter.emit('run', nowEvent, num - 2)
}

let fnCache = null,
    emitter = null,
    fnLodash = null

describe('memoize', () => {

  it('caculates hashes synchronously', () => {
    console.time('hash-sync')
    hashes(hash)
    console.timeEnd('hash-sync')
  })

  it('caculates hashes with cache memoization', () => {
    fnCache = memoCache(hashCache)
    console.time('hash-cache#1')
    hashes(fnCache)
    console.timeEnd('hash-cache#1')
  })

  it('caculates hashes with cache memoization again', () => {
    console.time('hash-cache#2')
    hashes(fnCache)
    console.timeEnd('hash-cache#2')
  })

  it('calculates hashes with event memoization', (done) => {
    emitter = memoEvent(hashEvent)
    console.time('hash-event#1')
    hashesEvent(emitter, () => {
      console.timeEnd('hash-event#1')
      emitter.removeAllListeners('done')
      done()
    })
  })

  it('calculates hashes with event memoization again', (done) => {
    console.time('hash-event#2')
    hashesEvent(emitter, () => {
      console.timeEnd('hash-event#2')
      emitter.removeAllListeners('done')
      done()
    })
  })
 
  it('calculates hash with lodash memoization', () => {
    fnLodash = memoize(hash)
    console.time('hash-lodash#1')
    hashes(fnLodash)
    console.timeEnd('hash-lodash#1')
  })

  it('calculates hash with lodash memoization again', () => {
    console.time('hash-lodash#2')
    hashes(fnLodash)
    console.timeEnd('hash-lodash#2')
  })

  it('caculates fibonacci recursively', () => {
    console.time('fib-recursive')
    const result = fibRecursive(input)
    console.timeEnd('fib-recursive')
    expect(result).to.equal(output)
  })

  it('caculates fibonacci with cache memoization', () => {
    fnCache = memoCache(fibCache)
    console.time('fib-cache#1')
    const result = fnCache(input)
    console.timeEnd('fib-cache#1')
    expect(result).to.equal(output)
  })

  it('caculates fibonacci with cache memoization again', () => {
    console.time('fib-cache#2')
    const result = fnCache(input)
    console.timeEnd('fib-cache#2')
    expect(result).to.equal(output)
  })

  it('calculates fibonacci with event memoization', (done) => {
    emitter = memoEvent(fibEvent, [[1], [2]], [0, 1])
    emitter.once('done', (val) => {
      console.timeEnd('fib-event#1')
      expect(val).to.equal(output)
      done()
    })
    console.time('fib-event#1')
    emitter.emit('run', 'done', input)
  })

  it('calculates fibonacci with event memoization again', (done) => {
    emitter.once('done', (val) => {
      console.timeEnd('fib-event#2')
      expect(val).to.equal(output)
      done()
    })
    console.time('fib-event#2')
    emitter.emit('run', 'done', input)
  })

  it('calculates fibonacci with lodash memoization', () => {
    fnLodash = memoize(fibRecursive)
    console.time('fib-lodash#1')
    const result = fnLodash(input)
    console.timeEnd('fib-lodash#1')
    expect(result).to.equal(output)
  })

  it('calculates fibonacci with lodash memoization again', () => {
    console.time('fib-lodash#2')
    const result = fnLodash(input)
    console.timeEnd('fib-lodash#2')
    expect(result).to.equal(output)
  })
})