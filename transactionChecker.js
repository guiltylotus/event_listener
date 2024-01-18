const Web3 = require('web3');

const TransferEvent = 'Transfer(address,address,uint256)'
class EventListener {
    web3;
    web3ws;
    subscription;

    constructor() {
        this.web3 = new Web3(new Web3.providers.HttpProvider('https://bsc.kyberengineering.io/'));
        this.web3ws = new Web3(new Web3.providers.WebsocketProvider('wss://bsc.publicnode.com'));
    }

    getTopic(event) {
        let topic = this.web3.utils.sha3(event);
        console.log('event ', event, 'topic ', topic);
        return topic
    }

    async getAllTransactionInLatestBlock() {
        let block = await this.web3.eth.getBlock('latest');
        let number = block.number;
        console.log('blockNumber ' + number);
        console.log('block :', block)
        if (block.transactions != null) {
            for (let txHash of block.transactions) {
                let tx = await this.web3.eth.getTransaction(txHash);
                console.log('Transaction detail :', tx)
            }
        }
    }

    subscribe(topic) {
        this.subscription = this.web3ws.eth.subscribe(
            'pendingTransactions',
            (err, res) => {
            if (err)
                console.error('subscribe error :', err);
        })
            .on("connected", function(subscriptionId){
                console.log('subscriptionId :', subscriptionId);
            })
    }

     watchTransactions() {
        console.log('Watching all Transfer events...');
        this.subscription.on('data', event => {
            console.log('events :', event);
        })
    }

}


let listener = new EventListener();
// txChecker.getAllTransactionInLatestBlock();
let transferTopic = listener.getTopic(TransferEvent);
listener.subscribe(transferTopic);
listener.watchTransactions();

