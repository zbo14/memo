'use strict'

/* eslint-env node, es6 */

const {EventEmitter} = require('events')

exports.memoCache = (calc) => {
  const cache = {}
  const fn = (...args) => {
    const str = JSON.stringify(args)
    if (!cache.hasOwnProperty(str)) {
      cache[str] = calc(fn, ...args)
    }
    return cache[str]
  }
  return fn
}

exports.on = (emitter, event, cb) => {
  emitter.on(event, (...args) => {
    setImmediate(() => cb(...args))
  })
}

exports.once = (emitter, event, cb) => {
  emitter.once(event, (...args) => {
    setImmediate(() => cb(...args))
  })
}

exports.memoEvent = (calc, manyArgs, vals) => {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(Infinity)
  manyArgs.forEach((args, i) => {
    const nowEvent = JSON.stringify(args)
    exports.on(emitter, nowEvent, (prevEvent) => emitter.emit(prevEvent, vals[i]))
  })
  exports.on(emitter, 'run', (prevEvent, ...args) => {
    const nowEvent = JSON.stringify(args)
    if (!emitter.eventNames().includes(nowEvent)) {
      calc(emitter, nowEvent, prevEvent, ...args)
    } else {
      emitter.emit(nowEvent, prevEvent)
    }
  })
  return emitter
}