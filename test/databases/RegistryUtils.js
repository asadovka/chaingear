const EntryCoreArtifacts = require("../../build/contracts/TeamSchema.json")
const Registry = artifacts.require("Registry")
const BigNumber = require("bignumber.js")


const CreateEntryPermissionGroup = {
    OnlyAdmin: 0,
    Whitelist: 1,
    AllUsers: 2
}

function isEntryCreatedEvent(log) {
    return log.event === 'EntryCreated'
}

const createTestRegistry = async function (
    ownerAccount, adminAccount, entryCreationFee = 100000,
    createEntryPermissionGroup = CreateEntryPermissionGroup.OnlyAdmin
) {

    const registry = {}
    registry.adminAccount = adminAccount
    registry.ownerAccount = ownerAccount
    registry.name = "EXPENSIVE_REGISTRY"
    registry.description = ""
    registry.symbol = "EXP"
    registry.linkToABIOfEntriesContract = "IPFS_CID"
    registry.fee = entryCreationFee

    registry.contract = await Registry.new(
        [adminAccount], [100], registry.name, registry.symbol,
        {from: ownerAccount, gas: 10000000}
    )
    await registry.contract.transferAdminRights(adminAccount, {from: ownerAccount})
    
    await registry.contract.updateCreateEntryPermissionGroup(createEntryPermissionGroup, {from: adminAccount})
    await registry.contract.updateEntryCreationFee(entryCreationFee, {from: adminAccount})
    await registry.contract.initializeRegistry(registry.linkToABIOfEntriesContract, EntryCoreArtifacts.bytecode,
        {from: adminAccount})
        
    /**
     * @returns {Promise<string>}
     */
    registry.getEntriesStorage = async function () {
        return await registry.contract.getEntriesStorage()
    }    

    /**
     * @param entryId to check existence
     * @returns {Promise<boolean>}
     */
    registry.containsEntry = async function (entryId) {
        return await registry.contract.exists(entryId)
    }

    /**
     * @param account to be used for invoking function
     * @param fee required by registry
     * @param gas attached to tx
     * @returns {*} execution result promise
     */
    registry.createEntryPromise = function (account, fee = registry.fee, gas = 500000) {
        return registry.contract.createEntry({from: account, value: fee, gas: gas})
    }

    /**
     * @param account to be used for invoking function
     * @param fee required by registry
     * @param gas attached to tx
     * @returns {Number} created entry tokenId
     */
    registry.createEntry = async function (account, fee = registry.fee, gas = 500000) {
        const executionResult = await registry.contract.createEntry(
            {
                from: account,
                value: fee,
                gas: gas
            }
        )
        return executionResult.logs.find(isEntryCreatedEvent).args.entryID
    }

    /**
     * @param account to be used for invoking function
     * @param entryId to delete
     * @returns {*} execution result promise
     */
    registry.deleteEntry = function (account, entryId) {
        return registry.contract.deleteEntry(entryId, {from: account})
    }

    /**
     * @param account to be used for invoking function
     * @param newDescription
     * @returns {*} execution result promise
     */
    registry.updateRegistryDescription = function (account, newDescription) {
        return registry.contract.updateRegistryDescription(newDescription, {from: account}).then(
            function (result) {
                registry.description = newDescription
                return result
            }
        )
    }

    /**
     * @param account to be used for invoking function
     * @param new name
     * @returns {*} execution result promise
     */
    registry.updateEntryCreationFee = function (account, newFee) {
        return registry.contract.updateEntryCreationFee(newFee, {from: account}).then(
            function (result) {
                registry.fee = newFee
                return result
            }
        )
    }

    /**
     * @returns {Promise<number>} entry creation permission group
     */
    registry.registryCreateEntryPermissionGroup = async function () {
        const permissionTypeEntries = await registry.contract.permissionsTypeEntries()
        return permissionTypeEntries.toNumber()
    }

    return registry
}

module.exports.CreateEntryPermissionGroup = CreateEntryPermissionGroup
module.exports.createTestRegistry = createTestRegistry
module.exports.isEntryCreatedEvent = isEntryCreatedEvent
