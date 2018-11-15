import ChaingearBuild from '../../../build/contracts/Chaingear.json'

//TODO: move in npm package

import generateContractCode from './generateContractCode';

import Web3 from 'web3'

export const loadCompiler = (cb) => {
    setTimeout(() => {
        window.BrowserSolc.loadVersion("soljson-v0.4.25+commit.59dbf8f1.js", cb);
    }, 30);
}

const Dependencies = require('../Dependencies.sol');

export const compileRegistry = (code, contractName, compiler) => {
    return new Promise((resolve, reject) => {
        const input = {
            'Dependencies.sol': Dependencies,
            [contractName]: 'pragma solidity ^0.4.25; ' + code,
        };

        setTimeout(() => {
            var compiledContract = compiler.compile({
                sources: input
            }, 1);
            console.log(compiledContract);
            if (compiledContract.errors && compiledContract.errors.length > 0) {
                reject(compiledContract.errors[0]);
                return;
            }

            try {
                var abi = compiledContract.contracts[contractName + ":" + contractName].interface;
                var bytecode = '0x' + compiledContract.contracts[contractName + ":" + contractName].bytecode;

                resolve({
                    abi,
                    bytecode
                });
            } catch (e) {
                reject(e);
            }

        }, 20);
    })
}

let getWeb3 = new Promise(function(resolve, reject) {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener('load', function() {
        var results;
        var web3 = window.web3;
        // Checking if Web3 has been injected by the browser (Mist/MetaMask)


        if (typeof web3 !== 'undefined') {
            // Use Mist/MetaMask's provider.

            if (web3.currentProvider && web3.currentProvider.isMetaMask) {
                web3 = new Web3(web3.currentProvider);
            } else {
                var provider = new Web3.providers.HttpProvider();
                web3 = new Web3(provider);
            }

            results = {
                web3: web3
            }

            console.log('Injected web3 detected.');

            resolve(results)
        } else {
            // Fallback to localhost if no web3 injection. We've configured this to
            // use the development console's port by default.
            var provider = new Web3.providers.HttpProvider('https://kovan.infura.io/eKZdJzgmRo31DJI94iSO')

            web3 = new Web3(provider)

            results = {
                web3: web3
            }

            console.log('No web3 instance injected, using Local web3.');

            resolve(results)
        }
    })
})

export const estimateNewRegistryGas = (bytecode) => {
    return new Promise((resolve, reject) => {
        getWeb3.then(({
            web3
        }) => {
            web3.eth.estimateGas({
                data: bytecode
            }, (e, gasEstimate) => {
                if (e) {
                    reject(e);
                } else {
                    resolve({
                        web3,
                        gasEstimate
                    })
                }
            })
        })
    })
}

export const deployRegistry = (bytecode, abi, web3, opt) => {
    const {
        gasEstimate,
        contractName,
        permissionType,
        entryCreationFee,
        description,
        tags
    } = opt;

    return new Promise((resolve, reject) => {

        let Contract = web3.eth.contract(JSON.parse(abi));
        const currentAccount = web3.eth.accounts[0];
        // TODO need frontend for _benefitiaries and _shares
        var _benefitiaries = [currentAccount]; // ???
        var _shares = [100]; // ???
        var _entryCreationFee = web3.toWei(entryCreationFee, 'ether'); // ???

        Contract.new(
            _benefitiaries,
            _shares, [{
                a: '0xa3564D084fabf13e69eca6F2949D3328BF6468Ef',
                count: 5
            }],
            permissionType,
            _entryCreationFee,
            contractName,
            description,
            tags, {
                from: currentAccount,
                data: bytecode,
                gas: gasEstimate
            }, (err, myContract) => {
                if (err) {
                    reject(err);
                } else {
                    if (myContract.address) {
                        resolve(myContract.address)
                    }
                }
            });


    })
}

const getItems = (contract, count, array, mapFn) => {
    return new Promise(resolve => {
        contract[count]().then(lengthData => {
            const length = lengthData.toNumber();
            let promises = [];
            for (let i = 0; i < length; i++) {
                promises.push(contract[array](i));
            }

            Promise.all(promises).then(data => {
                const results = data.map(mapFn);
                resolve(results);
            })
        })
    })
}

export const getContract = () => {
    return getWeb3
        .then(results => {
            const web3 = results.web3;
            const contract = web3.eth.contract(ChaingearBuild.abi).at(ChaingearBuild.networks['5777'].address);
            // registryContract.setProvider(results.web3.currentProvider);
            results.web3.eth.defaultAccount = results.web3.eth.accounts[0];

            return new Promise(resolve => {
                results.web3.eth.getAccounts((e, accounts) => {
                    resolve({
                        contract,
                        web3: results.web3,
                        accounts
                    })
                })
            })
        })
}

export const register = (name, adress, hash) => {
    return new Promise(resolve => {
        getContract().then(({
            contract,
            web3
        }) => {
            contract.register(name, adress, hash, {
                from: web3.eth.accounts[0]
            }).then(x => {
                resolve();
            })
        })
    })
}

export const getRegistry = () => {
    let accounts = null;
    return getContract().then(({
        contract,
        web3,
        accounts
    }) => {
        _accounts = accounts;
        return getItems2(contract, 'getRegistriesIDs', 'readRegistry', (items) => {
            return ({
                name: items[0],
                symbol: items[1],
                address: items[2],
                contractVersion: items[3],
                registrationTimestamp: items[4],
                ipfsHash: "",
                admin: items[5],
                supply: items[6]
            })

        }).then(items => {
            return {
                accounts: _accounts,
                items: items
            }
        })
    })
}

export const removeRegistry = (address, cb) => {
    return getContract().then(({
        contract,
        web3
    }) => {
        return contract.deleteRegistry(address, {
            from: web3.eth.accounts[0]
        });
    })
}

export const getFieldByHash = (ipfsHash) => {
    return new Promise(resolve => {
        ipfs.get(ipfsHash, (err, files) => {
            const buf = files[0].content;
            var abi = JSON.parse(buf.toString());
            // TODO move extraction from entries to other ABIs object, 
            // entries should be internal, now public for supporting frontend
            var fields = abi.filter(x => x.name === 'entries')[0].outputs;
            fields = fields.filter(x => x.name !== 'metainformation' && x.name !== 'owner' && x.name !== 'lastUpdateTime');
            resolve({
                abi,
                fields
            })
        });
    })
}

export const getContractByAbi = (address, abi) => {
    return new Promise(resolve => {
        getWeb3.then(({
            web3
        }) => {
            web3.eth.defaultAccount = web3.eth.accounts[0];
            const CoursetroContract = web3.eth.contract(abi);
            const contract = CoursetroContract.at(address);
            resolve({
                web3,
                contract
            })
        })
    })
}

export const getItems2 = (contract, ids, array, mapFn) => {
    return new Promise(topResolve => {
        contract[ids]((e, idsNumbers) => {
            const arr = idsNumbers.map(id => id.toNumber());
            const promises = arr.map(id => new Promise((itemResolve, itemReject) => {
                contract[array](id, (e, data) => {
                    if (e) itemReject(e);
                    else itemResolve({
                        data,
                        id
                    });
                });
            }));

            Promise.all(promises).then(data => {
                const results = data.map(item => mapFn(item.data, item.id));
                topResolve(results);
            })
        })
    })
}

export const addRegistryItem = (contract, data) => {
    return new Promise((resolve, reject) => {
        const args = [...data];
        contract.entryCreationFee.call((e, data) => {
            args.push({
                value: data
            })

            args.push(function(e, r) {
                if (e) {
                    reject(e)
                } else {
                    resolve(r);
                }
            });
            contract.createEntry.apply(contract, args);
        });
    })
}

export {
    getWeb3,
    generateContractCode
};

const IPFS = require('ipfs-api');

export const ipfs = new IPFS({
    host: 'localhost',
    port: 5001,
    protocol: 'http'
});

export const saveInIPFS = (jsonStr) => {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.from(jsonStr);
        ipfs.add(buffer, (err, ipfsHash) => {
            if (err) {
                reject(err);
            } else {
                const hash = ipfsHash[0].path;
                resolve(hash)
            }
        })
    })
}

// Public API

let _bytecode;
let _ipfsHash;

export const createRegistry = (name, symbol, fields) => {
    const code = generateContractCode(name, fields);

    return new Promise((resolve, reject) => {
        loadCompiler((compiler) => {
            compileRegistry(code, name, compiler)
                .then(({
                    abi,
                    bytecode
                }) => {
                    _bytecode = bytecode
                    return saveInIPFS(abi)
                })
                .then(ipfsHash => {
                    _ipfsHash = ipfsHash;
                    return getContract()

                })
                .then(({
                    contract,
                    web3,
                    accounts
                }) => {
                    contract.getRegistrationFee(function(e, data) {
                        var buildingFee = data.toNumber();
                        contract.registerRegistry.sendTransaction(
                            "V1", [accounts[0]], [100], name, symbol, {
                                value: buildingFee
                            },
                            function(e, data, a, b) {
                                if (e) {
                                    reject(e)
                                } else {
                                    var event = contract.RegistryRegistered();

                                    event.watch((ee, results) => {
                                        event.stopWatching();
                                        if (ee) {
                                            reject(ee)
                                        } else {
                                            const registry = web3.eth.contract(Registry.abi).at(results.args.registryAddress);
                                            registry.initializeRegistry(_ipfsHash, _bytecode, function(e, data) {
                                                resolve(results.args)
                                            })
                                        }
                                    })
                                }
                            }
                        )
                    })
                }).catch(reject)
        })
    })
}

let _contract;
let _web3;
let _accounts;

import Registry from '../../../build/contracts/Registry.json';

export const init = () => {
    return new Promise(resolve => {
        if (_web3) {
            resolve({
                contract: _contract,
                web3: _web3,
                accounts: _accounts
            })
        } else {
            getContract()
                .then(({
                    contract,
                    web3,
                    accounts
                }) => {
                    _contract = contract;
                    _web3 = web3;
                    _accounts = accounts;
                    resolve({
                        contract,
                        web3,
                        accounts
                    })
                })
        }
    })
}

export const getRegistryByAddress = (address) => {
    return _web3.eth.contract(Registry.abi).at(address);
}

export const getRegistryData = (address, fields, abi) => {
    return new Promise(resolve => {
        const registry = _web3.eth.contract(Registry.abi).at(address);

        registry.getEntriesStorage((e, entryAddress) => {


            const entryCore = _web3.eth.contract(abi).at(entryAddress);

            const mapFn = (item, id) => {
                const aItem = Array.isArray(item) ? item : [item];
                return fields.reduce((o, field, index) => {
                    o[field.name] = aItem[index];
                    return o;
                }, {
                    __index: id
                })
            }
            // TODO here getEntriesIDs should be called from registry, then entry reads from Schema by ids
            // in schema contract now there is redirect method to registry for supporting frontend
            getItems2(entryCore, 'getEntriesIDs', 'readEntry', mapFn)
                .then(items => {
                    registry.getEntryCreationFee((e, data) => {
                        var fee = data.toNumber();

                        resolve({
                            fee,
                            items: items,
                            fields,
                            entryAddress
                        })
                    })
                });
        })
    })
}

export const getEntryMeta = () => {

}

export const removeItem = (address, id) => {
    return new Promise(resolve => {
        const registryContract = _web3.eth.contract(Registry.abi).at(address);

        var event = registryContract.EntryDeleted();
        event.watch((e, results) => {
            event.stopWatching();
            resolve(results.args);
        })
        registryContract.deleteEntry(id, (e, d) => {});
    })
}

export const fundEntry = (address, id, value) => {
    return new Promise(resolve => {
        const registryContract = _web3.eth.contract(Registry.abi).at(address);

        var event = registryContract.EntryFunded();
        event.watch((e, results) => {
            event.stopWatching();
            resolve(results.args);
        })
        registryContract.fundEntry(id, {
            value: _web3.toWei(value, 'ether')
        }, (e, d) => {

        });

    });
}

export const addItem = (address) => {
    return new Promise(resolve => {
        const registryContract = _web3.eth.contract(Registry.abi).at(address);

        var event = registryContract.EntryCreated();

        event.watch((e, results) => {
            event.stopWatching();
            resolve(results.args.entryID.toNumber());
        })

        registryContract.getEntryCreationFee((e, data) => {
            var fee = data.toNumber();

            registryContract.createEntry({
                value: fee
            }, (e, d) => {})
        })
    });

}

export const getSafeBalance = (address) => {
    return new Promise(resolve => {
        const registryContract = _web3.eth.contract(Registry.abi).at(address);
        registryContract.safeBalance((e, data) => {
            resolve(data);
        })
    })
}

export const updateEntryCreationFee = (address, newfee) => {
    return new Promise((resolve, reject) => {
        const registry = _web3.eth.contract(Registry.abi).at(address);
        registry.updateEntryCreationFee(_web3.toWei(newfee, 'ether'), function(e, data) {
            if (e) reject(e)
            else resolve(data);
        })
    })
}

export const updateItem = (address, ipfsHash, newEntryId, values) => {
    return new Promise(resolve => {
        const registryContract = _web3.eth.contract(Registry.abi).at(address);
        debugger
        getFieldByHash(ipfsHash)
            .then(({
                abi
            }) => {

                registryContract.getEntriesStorage((e, entryAddress) => {
                    const entryCore = _web3.eth.contract(abi).at(entryAddress);

                    var args = [newEntryId, ...values, function(e, dat) {
                        resolve(dat);
                    }]

                    entryCore.updateEntry.apply(entryCore, args)
                })
            })
    });
}
