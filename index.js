const axios = require('axios')
const bsv = require('bsv')
const Toychain = require('toychain')
const assert = require('assert')

const defaultPrototype = [
  { "o0": "OP_0", "o1": "OP_RETURN", "s2": "Hello Bitcoin Simulator" }
]

const bip44 = (i) => {
  return `m/44'/0'/0'/0/${i}`
}

const config = {
  mine: 1,
  delay: 1000,
  rpc: 'http://root:bitcoin@127.0.0.1:18332',
  xpriv: 'xprv9s21ZrQH143K2AUh9yj3SmnzFVpHFgfGh23tz9iQb6p86yee29B1CcUenjSvWUFtNQ6oBho8PwPZNPi758kTFvJnxs1SoYbtUbyZeTK9zBC',
}

class Bitsim {
  constructor(o) {
    this.config = config
    if (o) Object.assign(this.config, o)
    let zeroKey = bsv.HDPrivateKey.fromString(this.config.xpriv).deriveChild("m/44'/0'/0'/0/0").publicKey
    this.config.zeroAddress = bsv.Address.fromPublicKey(zeroKey).toString()
    this.toychain = new Toychain({
      xpriv: this.config.xpriv,
      storage: {
        name: 'toychain'
      }
    })
  }

  async init() {
    console.log('initialzation step')
    let rawHex = await this.fund()
    console.log('1. funding toychain with coinbase', rawHex)
    this.toychain.clone({
      tx: rawHex
    })
    console.log('2. mining 100 blocks')
    await this.mine(100)
    for(let i=0; i<25; i++) {
      this.toychain.add({
        v: 1,
        edge: { in: 1, out: 2 },  
        out: defaultPrototype
      })
    }
    console.log('3. bootstrapping toychain tree')
    await this.toychain.push({
      rpc: this.config.rpc
    })
    await this.mine(1)
    console.log('bitsim initialization complete')
  }

  async rpc(method, params) {
    let parameters = params || []
    const r = await axios({
      method: 'post',
      url: this.config.rpc,
      data: {
        method: method,
        params: parameters,
      },
    })
    return r.data.result
  }

  async getMempool() {
    const res = await this.rpc('getrawmempool')
    return res
  }

  async add(n, proto) {
    const number = n || 50
    const prototype = proto || defaultPrototype
    for(let i=0; i<number; i++) {
      this.toychain.add({
        v: 1,
        edge: {in: 1, out: 2},
        out: prototype
      })
    }
    await this.toychain.push({
      rpc: this.config.rpc
    })
  }

  async fund(a) {
    const address = a || this.config.zeroAddress
    const m = await this.mine(1, address)
    const res = await this.rpc('getblock', [m[0], 2])
    return res.tx[0].hex
  }

  async mine(n, a) {
    const number = n || this.config.mine
    const address = a || this.config.zeroAddress
    const res = await this.rpc('generatetoaddress', [number, address])
    return res
  }

  async fork(hashOrHeight) {
    let nhash 
    let nheight
    if (typeof hashOrHeight === 'number') { 
      nheight = hashOrHeight + 1
    } else {
      let header = await this.getBlockHeader(hashOrHeight)
      nheight = header.height + 1
    }
    await this.invalidateBlock(nheight)
  }

  async invalidateBlock(hashOrHeight) {
    let hash = hashOrHeight
    if (typeof hash === 'number') hash = await this.getBlockHash(hashOrHeight)
    const r = await this.rpc('invalidateblock', [hash])
  }


  async getBlockHash(height) {
    const res = await this.rpc('getblockhash', [height])
    return res
  }

  async getBlockHeader(hash) {
    const res = await this.rpc('getblockheader', [hash])
    return res
  }

  async getLatestHeader() {
    const r = await this.rpc('getbestblockhash', [] )
    const header = await this.getBlockHeader(r)
    return header
  }

  async getMempoolInfo() {
    const res = await this.rpc('getmempoolinfo', [] )
    return res
  }

  async getRawMempool() {
    const res = await this.rpc('getrawmempool', [] )
    return res
  }
  async last(d) {
    const delay = d || this.config.delay
    await new Promise((r) => setTimeout(r, delay))
    const node = await this.getLatestHeader()
    return node
  }

  async getRandomBlock(max) {
    const height = Math.floor(Math.random() * Math.floor(max))
    const hash = await this.getBlockHash(height)
    return {
      height: height,
      hash: hash,
    }
  }

}


module.exports = Bitsim

