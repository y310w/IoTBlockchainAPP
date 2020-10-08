import React from "react"
import {
  Container,
  Navbar,
  Nav,
  NavItem,
  NavLink
} from "reactstrap";

export default function Sidebar() {
  return (
    <Container className="nav-secondary container-sm">
      <Navbar>
        <Nav navbar>
          <NavItem>
              <NavLink href="/devices" className="is-light-text text-medium letter-spacing">Dispositivos</NavLink>
              <NavLink href="/linkages" className="is-light-text text-medium letter-spacing">Enlaces</NavLink>
          </NavItem>
        </Nav>
      </Navbar>
    </Container>
  )
}