const axios = require('axios');
const fs = require('fs');
const util = require('util');
const csv = require('csv-parser');
require('dotenv').config();

// const apiUrl = 'https://api.covalenthq.com/v1/1/tokens/0xa711BCC2b6f5c4fc3DFaCcc2a01148765CBbAb1C/token_holders_v2/';
const apiKey = process.env.API_KEY;

const pageNumber = 10000; // Set the number of pages you want to fetch

const readFile = util.promisify(fs.readFile);
const tokenData = [];
// const failedAddress = [];
let totalAddresses = 63826071;
let lastStartPoint = 131959

const failedAddressFilePath = './tokens/failed_addresses.txt';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function readCsvFile(filePath) {
    try {
        const fileContent = await readFile(filePath, 'utf8');

        // Assuming tab ('\t') is the separator for tab-separated values
        const rows = fileContent.split('\n');

        rows.forEach((row) => {
            const columns = row.split(',');
            const [address, name, symbol] = columns.map((column) => column.trim());
            tokenData.push({ address, name, symbol });
        });

        // Process the parsed data
        // console.log(tokenData);
    } catch (error) {
        console.error('Error reading CSV file:', error.message);
    }
}

function isValidEthAddress(address) {
    const addressRegex = /^(0x)?[0-9a-fA-F]{40}$/;
    return addressRegex.test(address);
}

function appendFailedAddressToFile(address) {
    fs.appendFileSync(failedAddressFilePath, address + '\n');
}

async function getTotalAddresses(start, batchSize) {
    const requests = [];
    let end = Math.min(start+batchSize, tokenData.length);

    // console.log('-----------------------');
    // console.log('start - end', start, end)
    for (let i = start; i < end; i++) {
        if (!isValidEthAddress(tokenData[i]['address'])) {
            console.log('skip i', i)
            continue;
        }
        const apiUrl = 'https://api.covalenthq.com/v1/1/tokens/' + tokenData[i]['address'] + '/token_holders_v2/';
        // console.log('i :', i, tokenData[i]['symbol']);
        // console.log('apiUrl :', apiUrl);
        const params = {
            'key': apiKey,
            'page-number': pageNumber,
        };

        requests.push(axios.get(apiUrl, { params }));
        // await sleep(1000);
    }

    let i = start;
    try {
        const responses = await Promise.all(requests);

        responses.forEach(response => {
           if (response.status === 404) {
                console.log("404 Bad request :", response.data['code'])
                console.log({
                    "message": "404 Bad Request",
                    "code": response.data['code'],
                    "i": i,
                    "symbol": tokenData[i]['symbol']
                })
                // failedAddress.push(tokenData[i]['address']);
                appendFailedAddressToFile(tokenData[i]['address']);
            } if (isValidEthAddress(tokenData[i]['address'])) {

                let totalCount = response.data['data']['pagination']['total_count'];
                totalAddresses += totalCount;
                // console.log('totalCount index i:', i, totalCount);
            } else {
               console.log('skip i', i)
            }
            i += 1;
        });

        console.log('totalAddresses:', start, end, totalAddresses);
    } catch (error) {
        console.log({
            "code": error['code'],
            "i": i,
            "symbol": tokenData[i]['symbol']
        })
        if (isValidEthAddress(tokenData[i]['address'])) {
            appendFailedAddressToFile(tokenData[i]['address']);
        }
    }
}

async function run() {
    await readCsvFile('./tokens/tokens_eth.csv');

    let batchSize = 50;
    let i = lastStartPoint;
    do {
        await getTotalAddresses(i, batchSize);
        await sleep(1000)
        i += batchSize;
    } while (i < tokenData.length);
}

run();
