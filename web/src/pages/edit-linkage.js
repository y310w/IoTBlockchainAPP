import React, { useState } from "react"
import { navigate } from "gatsby"
import Layout from "../components/layout"
import FormLinkage from "../components/form-linkage"
import TableData from "../components/table";
import { useQuery, useMutation, gql } from "@apollo/client"
import { Button, CardTitle, Container } from "reactstrap"

const ENABLE_LINKAGE = gql`
  mutation Enable($id: ID!) {
    enable(id: $id)
  }
`;

const DISABLE_LINKAGE = gql`
  mutation Disable($id: ID!) {
    disable(id: $id)
  }
`;

const REMOVE_LINKAGE = gql`
  mutation DeleteLinkage($id: ID!) {
    deleteLinkage(id: $id)
  }
`;

const HISTORY_LINKAGE = gql`
  query HistoryLinkage($id: ID!) {
    historyLinkage(id: $id) {
      txId
      id
      sensor
      cond
      actuator
      status
      region
    }
  }
`;

export default function EditLinkage({ location }) {
  const [mode, setState] = useState('')
  const linkage = location.state ? location.state.data : undefined;
  const id = linkage ? linkage.id : undefined;

  const { loading, error, data } = useQuery(HISTORY_LINKAGE, {
    variables: { id: id },
    fetchPolicy: "no-cache"
  });

  const [enable] = useMutation(ENABLE_LINKAGE, {onCompleted: successMessage});
  const [disable] = useMutation(DISABLE_LINKAGE, {onCompleted: successMessage});
  const [deleteLinkage] = useMutation(REMOVE_LINKAGE, {onCompleted: successMessage});

  console.log(data);

  function successMessage() {
    let message;

    if (mode === "enable") {
      message = 'Se ha habilitado con exito'
    } else if (mode === "disable") {
      message = 'Se ha deshabilitado con exito'
    } else if (mode === "remove") {
      message = 'Se ha borrado con exito'
    }
    navigate('/linkages/', {state: { success: true, message: message, policy: "cache-and-network"}})
  }

  if (linkage) {
    let output = (
      <div>
        { !loading && <TableData data={data.historyLinkage} editable="false"/> }
      </div>
    );

    if (loading) output = <div><p>Loading...</p></div>
    if (error) output = <div><p>Error, no se ha podido recopilar el historial. {error}</p></div> 

    function enableLinkage() {
      enable({ 
        variables: {  
          id: id, 
        } 
      });
      setState("enable");
    }

    function disableLinkage() {
      disable({ 
        variables: {  
          id: id, 
        } 
      });
      setState("disable");
    }

    function removeLinkage() {
      deleteLinkage({ 
        variables: {  
          id: id, 
        } 
      });
      setState("remove");
    }

    return (
      <Layout> 
        <div className="outer">
          <div className="inner">
            <CardTitle className="is-light-text text-x-large letter-spacing"> Editar enlace </CardTitle>
          </div>
          <div className="inner">   
            { linkage.status 
              ? <Button color="primary" onClick={disableLinkage} className="button-form"> Deshabilitar </Button>
              : <Button color="primary" onClick={enableLinkage} className="button-form"> Habilitar </Button>
            }
            <Button color="danger" onClick={removeLinkage} className="button-form"> - Eliminar enlace </Button>
          </div>
        </div>
        <FormLinkage data={linkage} />
        <div>
          <CardTitle className="is-light-text text-x-large letter-spacing"> Historial </CardTitle>
          <Container>
            {output}
          </Container>
        </div>
      </Layout>
    )
  } else {
    return (
      <Layout> 
        <div className="outer">
          <div className="inner">
            <CardTitle className="is-light-text text-x-large letter-spacing"> Editar enlace </CardTitle>
          </div>
        </div>
        <div>
          <CardTitle className="is-light-text text-x-large letter-spacing"> Historial </CardTitle>
        </div>
      </Layout>
    )
  }
}