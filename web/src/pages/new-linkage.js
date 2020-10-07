import React from "react"
import Layout from "../components/layout"
import FormLinkage from "../components/form-linkage"
import { CardTitle } from "reactstrap"

export default function NewLinkage() {
  return (
    <Layout> 
      <CardTitle className="is-light-text text-x-large letter-spacing"> Nuevo enlace </CardTitle>
      <FormLinkage/>
    </Layout>
  )
}