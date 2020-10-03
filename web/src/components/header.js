import React from "react"

import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink
} from 'reactstrap';

export default function Header() {
  return (
      <Navbar className="is-dark">
        <NavbarBrand href="/" className="text-large is-light-text letter-spacing"> IoTBlockchainApp </NavbarBrand>
        <Nav navbar>
          <NavItem>
              <NavLink href="https://github.com/Thejokeri/IoTBlockchainAPP" className="text-small is-dark-text-light letter-spacing">Github</NavLink>
          </NavItem>
        </Nav>
      </Navbar>
  )
}