# Objectives

Listen all Transfer event `Transfer(address,address,uint256)` and handle reorgs. 

# How does this work?
1. Listen new block header events
2. With each new block event:
- detect reorg: compare latestBlock.parentHash with currentStoragedBlock.hash if different so detecting reorg 
  - if reorg -> overwrite event from finalizedBlock to latest block 
  - if not reorg -> add new event of latest block

# How to run 
```
node transactionChecker.js
```