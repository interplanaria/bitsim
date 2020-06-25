const Bitsim = require('../index')

const bitsim = new Bitsim()


;(async()=>{
  await bitsim.init()
  await bitsim.add(5)
  const mem = await bitsim.getMempool()
  console.log('mempool length', mem.length)
  console.log('mempool ', mem)
  await bitsim.mine()
  const mem2 = await bitsim.getMempool()
  console.log('mempool length', mem2.length)
  console.log('mempool ', mem2)
})()






