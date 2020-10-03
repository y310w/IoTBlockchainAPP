import React from "react"
import Layout from "../components/layout"
import { Link } from "gatsby"

export default function Error() {
  return (
    <Layout>
      <h1 className="is-light-text text-x-large letter-spacing">Página no encontrada</h1>
      <Link to="/">
        <h3>Volver</h3>
      </Link>
    </Layout>
  )
}