const Transport = require('winston-transport')
const Batcher = require('./src/batcher')

module.exports = class LokiTransport extends Transport {
  constructor (options) {
    super(options)
    this.batcher = new Batcher({
      host: options.host,
      interval: options.interval,
      json: options.json,
      batching: options.batching,
      clearOnError: options.clearOnError
    })
    options.batching && this.batcher.run()
  }

  log (info, callback) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    const { label, timestamp, level, message, ...rest } = info
    const logEntry = {
      labels: `{job="${label}", level="${level}"}`,
      entries: [
        {
          ts: timestamp,
          line: `${message} ${
            rest && Object.keys(rest).length > 0 ? JSON.stringify(rest) : ''
          }`
        }
      ]
    }

    this.batcher.pushLogEntry(logEntry)

    callback()
  }
}
