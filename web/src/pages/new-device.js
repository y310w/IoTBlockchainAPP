import React from "react"
import Layout from "../components/layout"
import FormDevice from "../components/form-device"
import { CardTitle } from "reactstrap"

export default function NewDevice() {
  return (
    <Layout> 
      <CardTitle className="is-light-text text-x-large letter-spacing"> Nuevo dispositivo </CardTitle>
      <FormDevice/>
    </Layout>
  )
}