const { Multicall } = require('ethereum-multicall');
const Web3 = require('web3');
const erc20ABI = require('./abi/erc20.json');

const web3 = new Web3('https://bsc.kyberengineering.io');

const multicall = new Multicall({ web3Instance: web3, tryAggregate: true });

const contractCallContext = [
    {
        reference: 'UsdcContract',
        contractAddress: '0x55d398326f99059fF775485246999027B3197955',
        abi: [
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "_owner",
                        "type": "address"
                    }
                ],
                "name": "balanceOf",
                "outputs": [
                    {
                        "name": "balance",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
        ],
        calls: [{ reference: 'balanceOfCall', methodName: 'balanceOf', methodParameters: ['0xd958BfE08aF9419C56D07B451F753DCD9b4eDe1A'] }],
    }
];

multicall.call(contractCallContext)
.then((results) => {
    console.log(results['results']['UsdcContract']);
    console.log(results['results']['UsdcContract']['callsReturnContext'][0]['returnValues']);
})
.catch((error) => {
    console.error('error', error);
});