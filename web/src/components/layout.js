import React from "react"
import Header from "../components/header"
import Sidebar from "../components/sidebar"
import { Card, Container } from "reactstrap"

export default function Layout({ children }) {
  return (
    <div>     
      <Header/>
      <Sidebar/>
      <Container>
        <Card className="card grid-card is-card-dark">
          {children}
        </Card>
      </Container>
    </div>
  )
}