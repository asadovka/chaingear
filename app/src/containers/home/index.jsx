import React, { Component } from 'react';

import { Link } from 'react-router';

import { Title } from "@cybercongress/ui";

var moment = require('moment');


import * as cyber from '../../utils/cyber';

import {Badge, FooterButton} from '../../components/chaingear/'
import { Table } from '../../components/Table/';
import { Container, Text, Link as ActionLink } from '../../components/CallToAction/';

const dateFormat = 'DD/MM/YYYY mm:hh';

import {
    Section,
    SectionContent,

} from '../../components/chaingear/'

import {
    LinkHash
} from '../../components/LinkHash/'

class Home extends Component {
    constructor(props) {
      super(props)

      this.state = {
        registries: [],
        account: null
      }
    }

    componentDidMount() {
      cyber.getRegistry().then(({ items, accounts }) => {
        this.setState({
        registries: items,
        account: accounts[0]
      })
      })
    }

  render() {
    const { registries, account } = this.state;

    const rows = registries.map((register, index) => (
                <tr key={register.name}>
                    <td>
                        <Link
                          to={`/registers/${register.address}`}
                        >{register.name}</Link>
                    </td>
                    <td>
                        {register.symbol}
                    </td>
                    <td>
                        {register.supply.toNumber()}
                    </td>
                    <td>
                        {register.contractVersion}
                    </td>
                    <td>
                        <LinkHash value={register.admin} />
                    </td>
                    <td>
                        {moment(new Date(register.registrationTimestamp.toNumber() * 1000)).format(dateFormat)}
                    </td>
                </tr>
          ));

    const myRows = registries.filter(x => x.admin === account).map((register, index) => (
                <tr key={register.name}>
                    <td>
                        <Link
                          to={`/registers/${register.address}`}
                        >{register.name}</Link>
                    </td>
                    <td>
                        {register.symbol}
                    </td>
                    <td>
                        {register.supply.toNumber()}
                    </td>
                    <td>
                        {register.contractVersion}
                    </td>
                    <td>
                        <LinkHash value={register.admin} />
                    </td>
                    <td>
                        {moment(new Date(register.registrationTimestamp.toNumber() * 1000)).format(dateFormat)}
                    </td>
                </tr>
          ))

    let content = (
        <div>
            <Title>My registries</Title>
        <Section title={<span>My registries<Badge>{myRows.length}</Badge></span>}>
            <SectionContent>
          <Container>
              <Text>You haven't created registries yet!</Text>
              <ActionLink to='/new'>create and deploy right now</ActionLink>
          </Container>
        </SectionContent>
        </Section>
        </div>
    );

    if (myRows.length > 0 ){
        content = (
            <div>
                <Section title={<span>My registries<Badge>{myRows.length}</Badge></span>}>
                <SectionContent>
                <Table>
                    <thead>
                        <tr>
                            <th>NAME</th>
                            <th>SYMBOL</th>
                            <th>ENTRIES</th>
                            <th>VERSION</th>
                            <th>ADMIN</th>
                            <th>CREATED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myRows}
                    </tbody>
                </Table>
                  <FooterButton to='/new'>create new registry</FooterButton>
                  </SectionContent>
                </Section>
            </div>
        )
    }

    return (
      <div>
        <div>
            {content}
        </div>

        <Section title={<span>chaingear registries<Badge>{rows.length}</Badge></span>}>
        <SectionContent>
        <Table>
            <thead>
                <tr>
                    <th>NAME</th>
                    <th>SYMBOL</th>
                    <th>ENTRIES</th>
                    <th>VERSION</th>
                    <th>ADMIN</th>
                    <th>CREATED</th>
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </Table>
        </SectionContent>
        </Section>
      </div>
    );
  }
}


export default Home;
