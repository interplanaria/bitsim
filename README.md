# bitsim

> bitcoin simulator

bitsim is the controller for the your bitcoin simulation environment. bitsim consists of:

1. Bitcoin simulation node Docker image 
2. Node module for interacting with the simulation container


![d3](./images/d3.png)

> NOTE: Bitsim node is a modified version of a "regtest mode" which supports mainnet address format and mainnet magic bytes. This allows more seamless plug and play testing environment for applications.

---

# prerequisites
- [docker](https://docs.docker.com/get-docker/)
- nodejs

---

# installation    
```
npm i --save-dev bitsim
```
---

# quickstart

We are going to testdrive bitsim by first booting up a bitsim docker container, and then using node.js REPL to interact with it programmatically. 

## 1. start Bitsim node

```
docker run --name bitsim -d -p 18332-18333:18332-18333 -p 18444:18444 planaria/bitsim:0.0.1
```

## 2. enter NodeJS REPL

```bash
node
```

> for more information on how to use NodeJS REPL, see the [docs](https://nodejs.org/api/repl.html)

> we will be using [`.then`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) syntax to read the callbacks in realtime without async scope. it's worth noting that ordinarily, you'd probably want to use async/await. 

## 3. initialize new Bitsim controller

```javascript
const Bitsim = require('bitsim')
const bitsim = new Bitsim()
```

![q1](./images/qs1.gif)

## 4. mine some blocks

```javascript
// mine a single block
bitsim.mine().then(r => console.log(r))

// mine 5 blocks
bitsim.mine(5).then(r => console.log(r))

// check status (most recent block header)
bitsim.last().then(r => console.log(r))
```

![q2](./images/qs2.gif)

## 5. submit transactions

```javascript
// initial fund step (more details below)
bitsim.init().then(r => console.log(r))

// add 10 "default" data transactions (more details below)
bitsim.add(10)

// add 1000 data transactions
bitsim.add(1000)

// add 100 custom data transaction
let dataOut = [ { "o0": "OP_0", "o1": "OP_RETURN", "s2": "Hello My Custom Transaction" } ]
bitsim.add(100, dataOut)

// check the mempool
bitsim.getMempoolInfo().then(r => console.log(r))

```

![q3](./images/qs3.gif)

> NOTE: initial funding requires mining 100 blocks to make the coinbase bitcoin eligible for spending. this coinbase transaction is used to fund a local toychain which builds and submits to the Bitsim peer.

> NOTE: the term "default transaction" refers to the default prototype data out transaction provided by the Bitsim library. 

## 6. create a fork 

```javascript
// get the last block header
let lastHeight; 
bitsim.getLatestHeader().then(r => console.log(r); lastHeight = r.height; )

// create a fork 3 blocks back
bitsim.fork(lastHeight - 3)

// get the new last block header
let newHeight
bitsim.getLatestHeader().then(r => console.log(r); newHeight = r.height; )
```

![q4](./images/qs4.gif)

---

# API

## 1. initialize

```javascript
const Bitsim = require('bitsim')
const bitsim = new Bitsim()
```

## 2. core methods

```javascript

;(async()=>{

  await bitsim.init()
  // initializes and bootstraps toychain
  // 1. funds toychain with coinbase tx
  // 2. mines 100 blocks so those coin are spendable
  // 3. bootstraps tx tree to avoid mempool limit

  await bitsim.last()
  // returns last block header from node 

  await bitsim.mine(n, address)
  // mines `n` number of blocks to `address`
  // parameters are optional. will use default if blank
  
  await bitsim.add(n, prototype)
  // adds `n` data-only transactions to mempool with prototype (output array)

  await bitsim.fork(height)
  // creates fork at given block `height` by invalidating `height + 1`

  await bitsim.rpc(method, [params])
  // return arbitrary rpc method response. accepts array of params or no params

})()

```

## 3. convenience methods

```javascript
;(async()=>{

  await bitsim.getRandomBlock(max)
  // provides random block height and hash from chain within limit
  // useful for creating tests

  await bitsim.getLatestHeader()
  // wrapper for `getbestblockhash` rpc call

  await bitsim.getBlockHeader()
  // wrapper for `getblockheader` rpc call

  await bitsim.getMempoolInfo()
  // wrapper for `getmempoolinfo` rpc call

  await bitsim.getRawMempool()
  // wrapper for `getrawmempool` rpc call

  await bitsim.getBlockHash()
  // wrapper for `getblockhash` rpc call

  await bitsim.invalidateBlock()
  // wrapper for `invalidateBlock` rpc call

})()

```

> NOTE: Bitsim works great when integrated with other unit testing frameworks, like [TAPE](https://www.npmjs.com/package/tape).

---

# settings

pass configuration options to bitsim as an object on initialization:

```javascript
const bitsim = new Bitsim({
  mine: 1,
  delay: 1000,
  rpc: 'http://root:bitcoin@127.0.0.1:18332',
  xpriv: 'xprv9s21ZrQH143K2AUh9yj3SmnzFVpHFgfGh23tz9iQb6p86yee29B1CcUenjSvWUFtNQ6oBho8PwPZNPi758kTFvJnxs1SoYbtUbyZeTK9zBC' 
})
```

> NOTE: The above represents the default configuration, and need not be specified for most basic single-player mode use cases. 


