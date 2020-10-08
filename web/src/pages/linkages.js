import React, { useState } from "react"
import Layout from "../components/layout"
import TableData from "../components/table";
import { useQuery, gql } from '@apollo/client'
import { Alert, Button, CardTitle } from "reactstrap"

export const LINKAGES = gql`
  query {
    linkages {
      id
      sensor
      cond
      actuator
      status
      region
    }
  }`;

export default function Linkages({ location }) {
  const [visible, setVisible] = useState(true);

  const success = location.state ? location.state.success : false;
  const message = location.state ? location.state.message : undefined;
  const policy = location.state ? location.state.policy : "cache-and-network";

  setTimeout(onDismiss, 5000)
  
  function onDismiss() {
    setVisible(false);
  } 

  const { loading, error, data } = useQuery(LINKAGES, {
    fetchPolicy: policy
  });
  
  let output = (
    <div>
      { !loading && <TableData data={data.linkages} redirect="edit-linkage" editable="true"/> }
    </div>
  );

  if (loading) output = <div><p>Loading...</p></div>
  if (error) output = <div><p>Error, no se ha podido recopilar los enlaces. {error}</p></div>

  return (
    <Layout>
      { (success && message) && <Alert color="success" isOpen={visible}> {message} </Alert>}
      <div className="outer">
        <div className="inner">
          <CardTitle className="is-light-text text-x-large letter-spacing"> Enlaces </CardTitle>
        </div>
        <div className="inner add-button">
          <Button href="/new-linkage" color="primary"> + Nuevo enlace </Button>
        </div>
      </div>
      {output}
    </Layout>
  )
}