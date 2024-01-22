const { Multicall } = require('ethereum-multicall');
const Web3 = require('web3');
const erc20ABI = require('./abi/erc20.json');

const web3 = new Web3('https://bsc.kyberengineering.io');

const multicall = new Multicall({ web3Instance: web3, tryAggregate: true });

let contextCalls = {
    reference: 'UsdcContract',
    contractAddress: '0x55d398326f99059fF775485246999027B3197955',
    abi: erc20ABI,
    calls: [],
}

for (let i=0; i<2500; i++) {
    let call = { reference: 'balanceOfCall', methodName: 'balanceOf', methodParameters: ['0xd958BfE08aF9419C56D07B451F753DCD9b4eDe1A'] }
    contextCalls['calls'].push(call);
}

console.log('all call', contextCalls['calls'].length);


multicall.call(contextCalls)
.then((results) => {
    console.log(results);
    console.log(results['results']['UsdcContract']['callsReturnContext'].length);
    console.log(results['results']['UsdcContract']['callsReturnContext'][0]['returnValues']);
})
.catch((error) => {
    console.error('error', error);
});