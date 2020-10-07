import React from "react"
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink
} from "reactstrap";
import SEO from "./seo"

export default function Header(props) {
  const test = props ? (props.test === 'true') : false;

  return (
    <div>
      { !test && <SEO/>}
      <Navbar className="is-white">
        <NavbarBrand className="text-large is-dark-text"> IoTBlockchainApp </NavbarBrand>
        <Nav navbar>
          <NavItem>
              <NavLink href="https://github.com/Thejokeri/IoTBlockchainAPP" className="text-small is-dark-text-light letter-spacing"> Github </NavLink>
          </NavItem>
        </Nav>
      </Navbar>
      <Navbar className="is-dark">
        <NavbarBrand href="/" className="text-large is-light-text letter-spacing"> Dashboard </NavbarBrand>
      </Navbar>
    </div>
  )
}