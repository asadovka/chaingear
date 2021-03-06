import React from 'react';
import { Subscribe } from 'unstated';
import {
    FlexContainer, FlexContainerLeft, FlexContainerRight, AddNewRecordButton,
    DatabaseItemsContainer, TableRecords, DbMenuPoints, MenuPopup,
    MenuPopupItem, MenuPopupTransferIcon, MenuPopupEditIcon, MenuPopupDeleteIcon,
    MenuSeparator, MenuPopupAccountIcon, LinkHash,
} from '@cybercongress/ui';
import page from './page';

const Permission = {
    OnlyAdmin: 0,
    Whitelist: 1,
    AllUsers: 2,
};

const Records = () => (
    <Subscribe to={ [page] }>
        {(dbPage) => {
            const {
                fields, items, isOwner, isSchemaExist,
                isDbPaused, permissionGroup, userAccount,
            } = dbPage.state;

            const actionsThs = items.map(item => (
                <th key={ item.id }>
                    <DbMenuPoints>
                        <MenuPopup>
                            { userAccount === item.owner && [
                                <MenuPopupItem
                                  key='recordTranser'
                                  icon={ <MenuPopupAccountIcon /> }
                                  onClick={ () => dbPage.onRecordTransferOwnership(item) }
                                >
                                    Transfer Ownership
                                </MenuPopupItem>,
                                <MenuSeparator
                                  key='recordSeparator0'
                                />,
                            ]}
                            <MenuPopupItem
                              key='recordFund'
                              icon={ <MenuPopupTransferIcon /> }
                              onClick={ () => dbPage.onFundRecord(item) }
                            >
                                Fund
                            </MenuPopupItem>
                            { userAccount === item.owner && [
                                <MenuPopupItem
                                  key='recordClaimFund'
                                  icon={ <MenuPopupTransferIcon /> }
                                  onClick={ () => dbPage.onClaimRecordFunds(item) }
                                >
                                    Claim Funds
                                </MenuPopupItem>,
                                <MenuSeparator
                                  key='recordSeparator1'
                                />,
                                <MenuPopupItem
                                  key='recordEdit'
                                  icon={ <MenuPopupEditIcon /> }
                                  onClick={ () => dbPage.onRecordEdit(item) }
                                >
                                    Edit
                                </MenuPopupItem>,
                                <MenuPopupItem
                                  key='recordDelete'
                                  icon={ <MenuPopupDeleteIcon /> }
                                  onClick={ () => dbPage.onDeleteRecord(item) }
                                >
                                    Delete
                                </MenuPopupItem>,
                            ]}
                        </MenuPopup>
                    </DbMenuPoints>
                </th>
            ));

            const idsThs = items.map(item => (
                <th key={ item.id }>
                    {item.id}
                </th>
            ));

            const fundedThs = items.map(item => (
                <th key={ item.id }>
                    {item.currentEntryBalanceETH}
                </th>
            ));

            const ownersThs = items.map(item => (
                <th key={ item.id }>
                    <LinkHash value={ item.owner } noPadding noCopy />
                </th>
            ));

            const itemsTrs = fields.map((field) => {
                const itemsFields = items.map(item => (
                    <td key={ `${item.id}${field.name}` }>
                        {item[field.name].toString()}
                    </td>
                ));

                return (
                    <tr key={ field.name }>
                        <td>{field.name}</td>
                        {itemsFields}
                    </tr>
                );
            });

            const showAddButton = (isOwner || permissionGroup === Permission.AllUsers)
                && !isDbPaused && isSchemaExist;

            return (
                <div>
                    {isSchemaExist
                        && (
                            <div>
                                <FlexContainer line>

                                    <FlexContainerLeft>
                                        RECORDS
                                    </FlexContainerLeft>

                                    <FlexContainerRight>
                                        {showAddButton
                                            && (
                                                <AddNewRecordButton
                                                  onClick={ dbPage.addRecord }
                                                >
                                                    Add new record
                                                </AddNewRecordButton>
                                            )
                                        }
                                    </FlexContainerRight>

                                </FlexContainer>

                                <DatabaseItemsContainer disabled={ isDbPaused }>
                                    <TableRecords>
                                        <thead>
                                            <tr>
                                                <th>Action</th>
                                                {actionsThs}
                                            </tr>
                                            <tr>
                                                <th>Id</th>
                                                {idsThs}
                                            </tr>
                                            <tr>
                                                <th>Funded</th>
                                                {fundedThs}
                                            </tr>
                                            <tr>
                                                <th>Owner</th>
                                                {ownersThs}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsTrs}
                                        </tbody>
                                    </TableRecords>
                                </DatabaseItemsContainer>
                            </div>
                        )
                    }
                </div>
            );
        }}
    </Subscribe>
);

export default Records;
