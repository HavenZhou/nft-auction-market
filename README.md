# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
# sepolia deploy messgage
$ npx hardhat deploy --network sepolia --tags MyNFT
[dotenv@17.2.1] injecting env (5) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
Nothing to compile
Deploying MyNFT contract...
deploying "MyNFT" (tx: 0xb3ccb2700fa75b899b80a418f41f4a08c5be7df39fad05c094cdd90729caa647)...: deployed at 0x2595Ff234Cf42B086d69e68cD197bEEd981eD784 with 1101897 gas
MyNFT deployed at: 0x2595Ff234Cf42B086d69e68cD197bEEd981eD784

zxx@LAPTOP-U9U1TA67 MINGW64 /d/solidityWorkSpace/nft-auction-market
$ npx hardhat deploy --network sepolia --tags AuctionFactory
[dotenv@17.2.1] injecting env (5) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
Nothing to compile
Deploying Auction implementation...
deploying "AuctionImpl" (tx: 0x894e0bf2b1e9aa1d5ce1413be468dd17a3829e9c18ba64fc38101901a77ba0a3)...: deployed at 0xcFa0097bFBbE712a1FADCeDa6Ca84e1F74B39C1a with 1605923 gas
Auction deployed to: 0xcFa0097bFBbE712a1FADCeDa6Ca84e1F74B39C1a
Using Auction implementation at: 0xcFa0097bFBbE712a1FADCeDa6Ca84e1F74B39C1a
Deploying AuctionFactory as UUPS proxy...
AuctionFactory deployed to: 0x55c44ed8Fa784b3aD875EA38eeB92c83fA2a8fc2

zxx@LAPTOP-U9U1TA67 MINGW64 /d/solidityWorkSpace/nft-auction-market
$ npx hardhat deploy --network sepolia --tags AuctionFactoryUpgrade
[dotenv@17.2.1] injecting env (5) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
Nothing to compile
Deploying Auction implementation...
reusing "AuctionImpl" at 0xcFa0097bFBbE712a1FADCeDa6Ca84e1F74B39C1a
Auction deployed to: 0xcFa0097bFBbE712a1FADCeDa6Ca84e1F74B39C1a
Using Auction implementation at: 0xcFa0097bFBbE712a1FADCeDa6Ca84e1F74B39C1a
Deploying AuctionFactory as UUPS proxy...
AuctionFactory deployed to: 0x07462743c606daD5591693681cf59ABA72521f05
Upgrading AuctionFactory to V2...
AuctionFactory upgraded to V2
New implementation address: 0x737Ccd2Cd65306FB6291c7Ef2542AF5A512fbBb5