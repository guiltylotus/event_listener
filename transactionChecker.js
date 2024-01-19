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
    currentBlock;


    constructor() {
        this.web3 = new Web3(new Web3.providers.HttpProvider('https://bsc.kyberengineering.io/'));
        this.web3ws = new Web3(new Web3.providers.WebsocketProvider('wss://bsc.publicnode.com'));
        this.currentBlock = {
            'blockNumber': null,
            'blockHash': null,
        }
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

        let totalEvent = 0;
        if (block.transactions != null) {
            for (let txHash of block.transactions) {
                let receipt = await this.web3.eth.getTransactionReceipt(txHash);

                if (receipt && receipt.logs) {
                    let events = receipt.logs.filter(log => log.topics[0] === topic)

                    if (events.length > 0) {
                        console.log({
                            "txHash": txHash,
                            // "blockNumber": receipt.blockNumber,
                            // "events": events,
                        })

                        totalEvent += events.length
                    }
                    // this.decodeTransferEvent(events);
                }
            }
        }
        console.log('totalEvent: ', totalEvent)

        return number
    }

    async getPastEvent(number, topic) {
        console.log("different rpc node, wait to sync data...")
        await new Promise(resolve => setTimeout(resolve, 500));

        let events = await this.web3.eth.getPastLogs(
            {topics:[topic], fromBlock:number, toBlock:number}
        )
        if (events.length === 0) {
            await this.getPastEvent(number, topic);
        } else {
            console.log({
                "message": "get events",
                "blockNumber": number,
                "topic": topic,
                "eventCount": events.length,
            });
        }

        // this.decodeTransferEvent(events);
    }

    decodeTransferEvent(events) {
        events.forEach(event => {
            const decoded = this.web3.eth.abi.decodeLog(
                TransferABI,
                event.data,
                event.topics.slice(1) // Remove the first topic (event signature)
            );
            console.log({
                'message': 'decoded event',
                'contractAddress': event.address,
                'topic': event.topics[0],
                'topic1': event.topics.slice(1),
                'eventData': event.data,
                'decoded': decoded,
            })
        })
    }

    subscribe(topic) {
        this.subscription = this.web3ws.eth.subscribe(
            'newBlockHeaders',
            (err, res) => {
                if (err) {
                    console.error('subscribe error :', err);
                }
        })
            .on("connected", function(subscriptionId){
                console.log('subscriptionId :', subscriptionId);
            })
    }

     onSubscribe(topic) {
        console.log('Watching all Transfer events...');
        this.subscription.on('data', async  latest => {
            let finalized = await this.web3.eth.getBlock('finalized');
            console.log('-------------------------------------')
            console.log('finalized block: ', finalized.number, finalized.hash, finalized.parentHash)
            console.log('latest block: ', latest.number, latest.hash, latest.parentHash)

            let start = latest.number;
            if (this.currentBlock.blockNumber !== null) {
                start = this.currentBlock.blockNumber + 1;
            }
            let end = latest.number;

            // Handle re-org
            if (this.currentBlock.blockHash !== null && latest.parentHash !== this.currentBlock.blockHash) {
                console.log({
                    "message": "found reorg",
                    "from": finalized.number,
                    "to": latest.number,
                });
                start = finalized.number;
            }

            console.log("start to end", start, end);

            // Update event
            for (let i = start; i <= end; i++) {
                await this.getPastEvent(i, topic)
            }

            // Update block
            this.currentBlock = {
                blockNumber: latest.number,
                blockHash: latest.hash
            }
            console.log({
                "message": "saved currentBlock",
                "blockNumber": this.currentBlock.blockNumber,
                "blockHash": this.currentBlock.blockHash,
            })
        })
    }

}

class Runner {
   constructor() {

   }

   async run() {
        let listener = new EventListener();
        let transferTopic = listener.getTopic(TransferEvent);
        // let blockNumber = await listener.getAllEventsInLatestBlock(transferTopic);
        // listener.getPastEvent(blockNumber, transferTopic);
       listener.subscribe(transferTopic)
       listener.onSubscribe(transferTopic)
   }
}


let runner = new Runner();
runner.run();