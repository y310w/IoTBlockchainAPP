import React from "react"
import { navigate } from "gatsby"
import Layout from "../components/layout"
import FormDevice from "../components/form-device"
import TableData from "../components/table";
import { useQuery, useMutation, gql } from "@apollo/client"
import { Button, CardTitle } from "reactstrap"

const REMOVE_DEVICE = gql`
  mutation DeleteDevice($serial: String!) {
    deleteDevice(serial: $serial)
  }
`;

const HISTORY_DEVICE = gql`
  query HistoryDevice($serial: String!) {
    historyDevice(serial: $serial) {
      txId
      serial
      name
      ipAddress
      value
    }
  }
`;

export default function EditDevice({ location }) {
  const device = location.state ? location.state.data : undefined;
  const serial = device ? device.serial : undefined;

  const { loading, error, data } = useQuery(HISTORY_DEVICE, {
    variables: { serial: serial },
    fetchPolicy: "cache-and-network"
  });

  const [deleteDevice] = useMutation(REMOVE_DEVICE, {onCompleted: successMessage});

  function successMessage() {
    navigate('/devices/', {state: { success: true, message: 'Se ha borrado con exito', policy: "cache-and-network"}})
  }

  if (device) {
    let output = (
      <div>
        { !loading && <TableData data={data.historyDevice} editable="false"/> }
      </div>
    );

    if (loading) output = <div><p>Loading...</p></div>
    if (error) output = <div><p>Error, no se ha podido recopilar el historial. {error}</p></div> 

    function removeDevice() {
      deleteDevice({ 
        variables: {  
          serial: serial, 
        } 
      });
    }

    return (
      <Layout> 
        <div className="outer">
          <div className="inner">
            <CardTitle className="is-light-text text-x-large letter-spacing"> Editar dispositivo </CardTitle>
          </div>
          <div className="inner add-button">
            <Button color="danger" onClick={removeDevice} className="button-form"> - Eliminar dispositivo </Button>
          </div>
        </div>
        <FormDevice data={device} />
        <div>
          <CardTitle className="is-light-text text-x-large letter-spacing"> Historial </CardTitle>
          {output}
        </div>
      </Layout>
    )
  } else {
    return (
      <Layout> 
        <div className="outer">
          <div className="inner">
            <CardTitle className="is-light-text text-x-large letter-spacing"> Editar dispositivo </CardTitle>
          </div>
        </div>
        <div>
          <CardTitle className="is-light-text text-x-large letter-spacing"> Historial </CardTitle>
        </div>
      </Layout>
    )
  }
}