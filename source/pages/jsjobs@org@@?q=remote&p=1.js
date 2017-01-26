var nightmare = require('nightmare')

var meta = require('_meta')
var get = require('_get')

var URL = get.url(__filename)
var NAME = get.name(URL)

module.exports = execute

function execute (opts, done) {
  if (typeof done !== 'function') return
  opts = opts || { show: false }
  nightmare(opts)
  .goto(`http://${URL}`)
  .wait('.job h6 a')
  .evaluate(query)
  .end()
  .run(nextPage)

  var allUrls = []

  function nextPage (error, data) { //because of .run, we need 2 arguments: err & result
    if (error) return done(error)
    allUrls = allUrls.concat(data.urls)
    console.log(`collected urls: ${allUrls.length}`)
    var next = data.next
    if (next) return nightmare(opts)
      .goto(next)
      .wait('.job h6 a')
      .evaluate(query)
      .end()
      .run(nextPage)
    collect(error, allUrls)
  }

  function collect (error, urls) {
    if (error) return done(error)
    var DATA = []
    var total = urls.length
    if (urls.length) next(urls.pop(), callback)
    function callback (error, data) {
      if (error) return done(error)
      if (data) DATA.push(data)
      console.log(`${urls.length}/${total} - ${URL}`)
      if (urls.length) next(urls.pop(), callback)
      else {
        done(null, { NAME, DATA })
      }
    }
  }

}

function next (url, cbFn) {
  nightmare()
  .goto(url)
  .wait('#job_summary')
  .evaluate(query)
  .end()
  .run(analyze)

  function query (){
    return document.querySelector('#job_summary').innerText
  }
  function analyze (error, text) {
    if (error) return cbFn(error)
    meta({ item: {}, raw: text }, cbFn)
  }
}

function query () {
  var urls = []
  var nodeList = document.querySelectorAll('.job h6 a')
  ;(nodeList||[]).forEach(function (x) {
    urls.push(x.href)
  })
  var array = document.querySelectorAll('.pagination a')||[]
  var next
  if (array[0].innerText === 'Next >') {
    next = array[0].href
  } else if (array[1].innerText === 'Next >') {
    next = array[1].href
  } else {
    next = {}.href
  }
  return { urls, next } // same as `{ urls:urls, next:next }`
}
