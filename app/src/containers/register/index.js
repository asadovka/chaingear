import React, { Component } from 'react';


import { browserHistory } from 'react-router';

import {
    ActionLink, LinkHash,
    MainContainer,
    AddItemButton,
    AddItemButtonText,

    Section,
    SectionContent,

    Centred,

    Button,

    FundContainer,
    BoxTitle,
    StatusBar
} from '@cybercongress/ui';
import * as cyber from '../../utils/cyber';


import TransferForm from './TransferForm';

import { RegistryItem, RegistryList } from './RegistryItem';
import ValueInput from '../../components/ValueInput';
import FormField from './FormField';


const moment = require('moment');

class Register extends Component {
    state = {
        items: [],
        fields: [],
        registries: [],
        newItem: {},
        loading: false,
        balance: null,
        isOwner: false,
        total_fee: 0,
        funded: '???',

        registryContract: null,
        web3: null,

        name: '',
        description: '',
        tag: '',
        registrationTimestamp: null,
        entryCreationFee: 0,
        entriesAmount: 0,
        admin: '',
        userAccount: null,

        contractVersion: null,
        registryAddress: null,
        entryCoreAddress: null,
        ipfsHash: null,
    }

    componentDidMount() {
        this.setState({
            loading: true,
        });


        const address = this.props.params.adress;


        // const address = this.props.params.adress;
        cyber.init()
            .then(({ web3, accounts }) => {
                const userAccount = accounts[0];

                this.setState({
                    userAccount,
                });
                cyber.getRegistry().then(({ items }) => {
                    const registryID = this.getRegistryID(items);
                    // alert(registryID)

                    cyber.getChaingearContract().then(({ contract, web3 }) => {
                        // contract.paused((e, data) => {
                        //     debugger
                        // })
                        console.log('items ', items);
                        console.log('registryID ', registryID);
                        contract.readRegistryBalance(registryID, (e, data) => {
                            const funded = web3.fromWei(web3.toDecimal(data[0].toNumber()));
                            //                this.componentDidMount();

                            this.setState({
                                funded,
                            });
                        });
                    });


                    const registries = items;
                    const registry = registries.find(x => x.address === address);

                    if (!registry) { return; }


                    this.setState({
                        name: registry.name,
                        registrationTimestamp: registry.registrationTimestamp,
                        admin: registry.admin,
                        contractVersion: registry.contractVersion,
                        // isOwner: userAccount === registry.owner,
                        // owner: registry.owner,
                        tag: '',
                        web3,
                        registryAddress: address,
                    });
                    const r = cyber.getRegistryByAddress(registry.address);

                    // debugger
                    // contract.getEntryMeta(registryID, (e, data) => {
                    //     debugger
                    // });
                    r.getAdmin((e, owner) => {
                        this.setState({

                            isOwner: userAccount === owner,
                            owner,

                        });
                    });

                    web3.eth.getBalance(registry.address, (e, balance) => {
                        balance = web3.fromWei(web3.toDecimal(balance), 'ether');
                        this.setState({
                            total_fee: balance,
                        });
                    });

                    r.getRegistryDescription((e, description) => {
                        this.setState({
                            description,
                        });
                    });

                    r.symbol((e, data) => {
                        this.setState({
                            symbol: data,
                        });
                    });

                    // r.getRegistryTags((e, data) => {
                    //     debugger
                    // })

                    r.getInterfaceEntriesContract((e, ipfsHash) => {
                        r.getEntryCreationFee((e, data) => {
                            const fee = web3.fromWei(data, 'ether').toNumber();

                            // console.log(ipfsHash)
                            this.setState({
                                entryCreationFee: fee,
                                registryContract: r,
                            });
                            cyber.getFieldByHash(ipfsHash)
                                .then(({ abi, fields }) => {
                                    cyber.getRegistryData(address, fields, abi)
                                        .then(({
                                            fee, items, fields, entryAddress,
                                        }) => {
                                            Promise.all(
                                                items.map(item => new Promise((resolve, reject) => {
                                                // console.log(index)
                                                    r.readEntryMeta(item.__index, (e, data) => resolve(data));
                                                })),
                                            ).then((data) => {
                                                const _items = items.map((item, index) => {
                                                    const currentEntryBalanceETH = web3.fromWei(data[index][4]).toNumber();
                                                    // debugger
                                                    const owner = data[index][0];

                                                    return {
                                                        ...item,
                                                        currentEntryBalanceETH,
                                                        owner,
                                                        id: item.__index,
                                                    };
                                                });

                                                this.setState({
                                                    ipfsHash,
                                                    entryCoreAddress: entryAddress,
                                                    items: _items,
                                                    fields,
                                                    registries,
                                                    entriesAmount: items.length,
                                                    loading: false,
                                                });
                                            });
                                        });
                                });
                        });
                    });
                });
            });
    }

  deleted = (e, result) => {
      const index = result.args.entryId.toNumber();

      this.setState({
          items: this.state.items.filter((x, i) => i !== index),
          loading: false,
      });
  }


  add = (values) => {
      // cyber.addRegistryItem(this.contract, args);
      const { registries } = this.state;
      const address = this.props.params.adress;
      const registry = registries.find(x => x.address === address);

      if (!registry) { return; }
      const r = cyber.getRegistryByAddress(registry.address);

      r.getInterfaceEntriesContract((e, ipfsHash) => {
          // const ipfsHash = registry.ipfsHash;
          cyber.addItem(address)
              .then((entryId) => {
                  this.componentDidMount();
                  // return cyber.updateItem(address, ipfsHash, entryId, values)
              });
      });
  }

  onUpdate = (values, entryId) => {
      const { registries } = this.state;
      const address = this.props.params.adress;
      const registry = registries.find(x => x.address === address);

      if (!registry) { return; }
      const r = cyber.getRegistryByAddress(registry.address);

      r.getInterfaceEntriesContract((e, ipfsHash) => {
          // const ipfsHash = registry.ipfsHash;
          cyber.updateItem(address, ipfsHash, entryId, values)
              .then((entryId) => {
                  this.componentDidMount();
                  // return cyber.updateItem(address, ipfsHash, entryId, values)
              });
      });
  }

  removeItemClick = (id) => {
      this.setState({ loading: true });
      const address = this.props.params.adress;

      cyber.removeItem(address, id)
          .then(() => {
              const newItems = this.state.items.filter((item, index) => index !== id);

              this.setState({ items: newItems, loading: false });
          });
      // alert(id)
      // this.contract.deleteEntry(id, function(e, r){

      // });
      // this.setState({
      //   loading: true
      // })
  }


  validate = (e) => {
      e.preventDefault();
      console.log(e.target.value);
  }

  claim = () => {
      this.contract.claim((e, d) => {
          this.setState({ balance: 0 });
      });
  }

    removeContract = () => {
        const address = this.props.params.adress;

        cyber.removeRegistry(address).then(() => {
            this.contract.destroy((e, d) => {
                browserHistory.push('/');
            });
        });
    }

    fundEntryClick = (index, value) => {
        this.setState({ loading: true });
        const address = this.props.params.adress;

        cyber.fundEntry(address, index, value)
            .then(() => {
                this.setState({ loading: false });
            });
    }

    changeName = (name) => {
        alert('TODO');
    }

    changeDescription = (description) => {
        this.state.registryContract.updateRegistryDescription(description, (e, data) => {
            this.setState({
                description,
            });
        });
    }

    changeTag = (tag) => {
        this.state.registryContract.addRegistryTag(tag, () => {
            this.setState({
                tag,
            });
        });
    }

    changeEntryCreationFee = (entryCreationFee) => {
        const address = this.props.params.adress;

        cyber.updateEntryCreationFee(address, entryCreationFee);
    }

    clameRecord = (entryID, amount) => {
        this.state.registryContract.claimEntryFunds(entryID, this.state.web3.toWei(amount, 'ether'), (e, data) => {
            this.componentDidMount();
        });
    }

    getRegistryID = (registries) => {
        const address = this.props.params.adress;

        let index = null;

        (registries || this.state.registries).forEach((reg, _index) => {
            if (reg.address === address) {
                index = _index;
            }
        });

        return index;
    }

    fundRegistry = (amount) => {
        const registryID = this.getRegistryID();
        // alert(registryID);

        cyber.getChaingearContract().then(({ contract, web3 }) => {
            contract.fundRegistry(registryID, { value: web3.toWei(amount, 'ether') }, (e, data) => {
                this.componentDidMount();
            });
        });
    }

    clameRegistry = (amount) => {
        const registryID = this.getRegistryID();

        cyber.getChaingearContract().then(({ contract, web3 }) => {
            contract.claimRegistryFunds(registryID, web3.toWei(amount, 'ether'), (e, data) => {
                this.componentDidMount();
            });
        });
    }

    clameFee = (amount) => {
        this.state.registryContract.claim((e, data) => {

        });
    }

    transferRegistry = (userAccount, newOwner) => {
        const registryID = this.getRegistryID();

        cyber.getChaingearContract().then(({ contract, web3 }) => {
            contract.transferFrom(userAccount, newOwner, registryID, (e, data) => {
                this.componentDidMount();
            });
        });
    }

    transferItem = (userAccount, newOwner, entryID) => {
        this.state.registryContract.transferFrom(userAccount, newOwner, entryID, (e, data) => {
            this.componentDidMount();
        });
    }

    render() {
        const {
            fields, items, loading, isOwner, userAccount,
        } = this.state;


        const rows = items.map((item, index) => (
            <RegistryItem
                clameRecord={ this.clameRecord }
                removeItemClick={ this.removeItemClick }
                fundEntryClick={ this.fundEntryClick }
                userAccount={ userAccount }
                onUpdate={ values => this.onUpdate(values, index) }
                onTransfer={ newOwner => this.transferItem(userAccount, newOwner, index) }
                fields={ fields }
                item={ item }
                index={ index }
                key={ index }
            />
        ));
        const address = this.props.params.adress;

        const {
            name,
            description,
            registrationTimestamp,
            entryCreationFee,
            admin,
            total_fee,
            funded,
            tag,
            symbol,
            owner,
            contractVersion,
            registryAddress,
            entryCoreAddress,
            ipfsHash,
        } = this.state;

        return (
            <div>
                <StatusBar
                    open={ loading }
                  message='loading...'
                />
                <MainContainer>
                    <Section>
                        <div style={ { marginLeft: '15px' } }>
                            <ActionLink to='/'>BACK TO CHAINGEAR</ActionLink>
                        </div>
                    </Section>
                    <Section title='General'>
                        <SectionContent style={ { width: '25%' } }>
                            <Centred>
                                <BoxTitle>
                    Created:
                                </BoxTitle>
                                <div style={ { height: 100, color: '#000000' } }>
                                    {registrationTimestamp ? moment(new Date(registrationTimestamp.toNumber() * 1000)).format('DD/MM/YYYY mm:hh:ss') : ''}
                                </div>
                            </Centred>
                        </SectionContent>

                        <SectionContent style={ { width: '25%' } }>
                            <Centred>
                                <BoxTitle>Admin:</BoxTitle>
                                <div style={ { height: 100 } }>
                                    <LinkHash value={ admin } />
                                </div>
                            </Centred>
                        </SectionContent>

                        <SectionContent style={ { width: '25%' } }>
                            <Centred>
                                <BoxTitle>
                    FUNDED:
                                </BoxTitle>

                                <FundContainer style={ { height: 100, justifyContent: isOwner ? 'space-around' : 'start' } }>
                                    <span>
                                        {funded}
                                        {' '}
ETH
                                    </span>

                                    {isOwner && (
                                        <ValueInput
                                            onInter={ this.clameRegistry }
                                            buttonLable='claim funds'
                                          color='second'
                                        />
                                    )}

                                </FundContainer>
                            </Centred>
                        </SectionContent>

                        <SectionContent style={ { width: '25%' } }>
                            <Centred>
                                <BoxTitle>
                    FEES:
                                </BoxTitle>

                                <FundContainer style={ { height: 100, justifyContent: isOwner ? 'space-around' : 'start' } }>
                                    <span>
                                        {total_fee}
                                        {' '}
ETH
                                    </span>
                                    {isOwner && <Button style={ { width: 119 } } onClick={ this.clameFee }>clame fee</Button>}
                                </FundContainer>

                            </Centred>
                        </SectionContent>

                    </Section>

                    <Section title='Overview'>
                        <SectionContent grow={ 0 } style={ { width: '25%' } }>
                            <Centred>
                                <div>
                                    {/* <QRCode hash={address} size={160} /> */}
                                    <TransferForm
                                        height={ 140 }
                                        address={ owner }
                                      isOwner={ isOwner }
                                      onTransfer={ newOwner => this.transferRegistry(userAccount, newOwner) }
                                    />
                                </div>
                                <ValueInput
                                  onInter={ this.fundRegistry }
                                    buttonLable='fund registry'
                                    width='100%'
                                />
                            </Centred>
                        </SectionContent>

                        <SectionContent grow={ 3 }>
                            <FormField
                              label='Name'
                              value={ name }
                            />
                            <FormField
                              label='Symbol'
                              value={ symbol }
                            />
                            <FormField
                              label='Fee'
                              value={ `${entryCreationFee.toString()} ETH` }
                              onUpdate={ isOwner && this.changeEntryCreationFee }
                            />
                            <FormField
                              label='Description'
                              value={ description }
                              onUpdate={ isOwner && this.changeDescription }
                            />
                            <FormField
                              label='Tags'
                              value={ tag }
                            />
                            <FormField
                              label='Entries'
                              value={ rows.length }
                            />
                            <FormField
                              label='Registry Type'
                              value={ contractVersion }
                            />
                            <FormField
                              label='Registry address'
                              value={ registryAddress }
                            />
                            <FormField
                              label='Entry Core address'
                              value={ entryCoreAddress }
                            />
                            <FormField
                              label='LINK TO ABI'
                              value={ <a href={ `http://localhost:8080/ipfs/${ipfsHash}` } target='_blank'>{ipfsHash}</a> }
                            />
                        </SectionContent>
                    </Section>


                    <RegistryList>
                        {rows}
                    </RegistryList>

                </MainContainer>
                <AddItemButton onClick={ this.add }>
                    <AddItemButtonText>Add Record</AddItemButtonText>
                    <span>
Fee:
                        {entryCreationFee}
                        {' '}
ETH
                    </span>
                </AddItemButton>
            </div>
        );
    }
}


export default Register;
