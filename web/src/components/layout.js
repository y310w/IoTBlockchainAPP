import React from "react"
import Header from "../components/header"
import Sidebar from "../components/sidebar"

import { Container } from "reactstrap"

export default function Layout({ children }) {
  return (
    <div>     
      <Header/>
      <Sidebar/>
      <Container className="grid-card">
        {children}
      </Container>
    </div>
  )
}