'use strict'

const {expect} = require('chai')
const {describe, it} = require('mocha')
const {memoCache, memoEvent, on, once} = require('../src')
const {memoize} = require('lodash')

const input = 32
const output = 1346269

const fibRecursive = (num) => {
  if (num === 1) {
    return 0
  } else if (num === 2) {
    return 1
  }
  return fibRecursive(num - 1) + fibRecursive(num - 2)
}

const fibCache = (fn, num) => {
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
  it('caculates fibonacci recursively', () => {
    console.time('recursive')
    const result = fibRecursive(input)
    console.timeEnd('recursive')
    expect(result).to.equal(output)
  })

  it('caculates fibonacci with cache memoization', () => {
    fnCache = memoCache(fibCache)
    console.time('cache#1')
    const result = fnCache(input)
    console.timeEnd('cache#1')
    expect(result).to.equal(output)
  })

  it('caculates fibonacci with cache memoization again', () => {
    console.time('cache#2')
    const result = fnCache(input)
    console.timeEnd('cache#2')
    expect(result).to.equal(output)
  })

  it('calculates fibonacci with event memoization', (done) => {
    emitter = memoEvent(fibEvent, [[1], [2]], [0, 1])
    emitter.once('done', (val) => {
      console.timeEnd('event#1')
      expect(val).to.equal(output)
      done()
    })
    console.time('event#1')
    emitter.emit('run', 'done', input)
  })

  it('calculates fibonacci with event memoization again', (done) => {
    emitter.once('done', (val) => {
      console.timeEnd('event#2')
      expect(val).to.equal(output)
      done()
    })
    console.time('event#2')
    emitter.emit('run', 'done', input)
  })

  it('calculates fibonacci with lodash memoization', () => {
    fnLodash = memoize(fibRecursive)
    console.time('lodash#1')
    const result = fnLodash(input)
    console.timeEnd('lodash#1')
    expect(result).to.equal(output)
  })

  it('calculates fibonacci with lodash memoization again', () => {
    console.time('lodash#2')
    const result = fnLodash(input)
    console.timeEnd('lodash#2')
    expect(result).to.equal(output)
  })
})