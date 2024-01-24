const axios = require('axios');
const fs = require('fs');
const util = require('util');
const csv = require('csv-parser');

// const apiUrl = 'https://api.covalenthq.com/v1/1/tokens/0xa711BCC2b6f5c4fc3DFaCcc2a01148765CBbAb1C/token_holders_v2/';
const apiKey = 'cqt_rQc8qrQvdVdYTYVK4rrPM8FDMdPc'; // Replace with your Covalent API key

const pageNumber = 10000; // Set the number of pages you want to fetch

const readFile = util.promisify(fs.readFile);
const tokenData = [];
let totalAddresses = 0;

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

async function getTotalAddresses(start, batchSize) {
    const requests = [];
    let end = Math.min(start+batchSize, tokenData.length);

    console.log('-----------------------');
    console.log('start - end', start, end)
    for (let i = start; i < end; i++) {
        const apiUrl = 'https://api.covalenthq.com/v1/1/tokens/' + tokenData[i]['address'] + '/token_holders_v2/';
        console.log('i :', i, tokenData[i]['symbol']);
        console.log('apiUrl :', apiUrl);
        const params = {
            'key': apiKey,
            'page-number': pageNumber,
        };

        requests.push(axios.get(apiUrl, { params }));
        await sleep(500);
    }

    try {
        const responses = await Promise.all(requests);

        let i = 1;
        responses.forEach(response => {
            let totalCount = response.data['data']['pagination']['total_count'];
            totalAddresses += totalCount;
            console.log('totalCount index i:', i, totalCount);
            i += 1;
        });

        console.log('totalAddresses:', totalAddresses);
    } catch (error) {
        console.error('API Error:', error.message);
    }
}

async function run() {
    await readCsvFile('./tokens/tokens_eth.csv');

    let batchSize = 100;
    let i = 1;
    do {
        await getTotalAddresses(i, batchSize);
        i += batchSize;
    } while (i < tokenData.length);
}

run();
