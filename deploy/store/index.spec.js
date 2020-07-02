const { expect } = require('chai')

const runTest = name => describe(`> ${name}`, () => {

  const { store } = require('./index')
  it('> set value correctly', async () => {
    await store.set('key', 'value two')
  })

  it('> can get set value', async () => {
    const val = await store.get('key')
    expect(val).to.equal('value two')
  })

  it('> getting val that does not exist', async () => {
    const val = await store.get('key2')
    expect(!!val).to.be.false
  })
})

describe('> store/index.js', () => {
  runTest(`LRU`)
  delete require.cache[require.resolve('./index')]

  // TODO test redis storage
})
