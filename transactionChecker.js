const Web3 = require('web3');

const TransferEvent = 'Transfer(address,address,uint256)'
const TransferABI = [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
];
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

    // async getEventFromTransaction(txHash) {
    //     let logs = await this.web3.eth.getPastLogs()
    // }
    async getAllEventsInLatestBlock(topic) {
        let block = await this.web3.eth.getBlock('latest');
        let number = block.number;
        console.log('blockNumber ' + number);
        console.log('block :', block)
        if (block.transactions != null) {
            for (let txHash of block.transactions) {
                let receipt = await this.web3.eth.getTransactionReceipt(txHash);

                if (receipt && receipt.logs) {
                    let events = receipt.logs.filter(log => log.topics[0] === topic)

                    if (events.length > 0) {
                        console.log({
                            "txHash": txHash,
                            "blockNumber": receipt.blockNumber,
                            "events": events,
                        })
                    }

                    events.forEach(event => {
                        const decoded = this.web3.eth.abi.decodeLog(
                            TransferABI,
                            event.data,
                            event.topics.slice(1) // Remove the first topic (event signature)
                        );
                        console.log({
                            'contractAddress': event.address,
                            'topic': event.topics[0],
                            'topic1': event.topics.slice(1),
                            'eventData': event.data,
                            'decoded': decoded,
                        })
                    })
                }
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
let transferTopic = listener.getTopic(TransferEvent);
listener.getAllEventsInLatestBlock(transferTopic);
