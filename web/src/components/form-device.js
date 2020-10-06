import React, { useState } from "react"
import { Link, navigate } from "gatsby"
import { useMutation, gql } from "@apollo/client"
import { 
  Button, 
  Col, 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Row 
} from "reactstrap";

const ADD_DEVICE = gql`
  mutation AddDevice($name: String!, $serial: String!, $ipAddress: String!) {
    addDevice(name: $name, serial: $serial, ipAddress: $ipAddress) {
      name
      serial
      ipAddress
      value
    }
  }
`;

const EDIT_DEVICE = gql`
  mutation setValue($serial: String!, $value: Int!) {
    setValue(serial: $serial, value: $value)
  }
`;

export default function FormDevice(props) {
  const [addDevice] = useMutation(ADD_DEVICE, {onCompleted: successMessage});
  const [setValue] = useMutation(EDIT_DEVICE, {onCompleted: successMessage});

  let device = {
    name: "",
    serial: "",
    ipAddress: "",
    value: -1,
    mode: "add"
  }

  if (props.data) {
    device = {  
      name: props.data.name,
      serial: props.data.serial,
      ipAddress: props.data.ipAddress,
      value: props.data.value,
      mode: "edit"
    }
  }

  const [deviceState, setState] = useState(device)

  function handleInputChange(event) {
    const {name , value} = event.target
    setState( prevState => ({
        ...prevState,
        [name] : value
    }))
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (deviceState.mode === "add") {
      addDevice({ 
        variables: { 
          name: deviceState.name, 
          serial: deviceState.serial, 
          ipAddress: deviceState.ipAddress, 
        } 
      });
    } else if (deviceState.mode === "edit") {
      setValue({ 
        variables: { 
          serial: deviceState.serial, 
          value: parseInt(deviceState.value), 
        } 
      });
    }
  }

  function successMessage () {
    setState('');
    navigate('/devices/', {state: { success: true, message: 'Se ha guardado con exito', policy: "cache-and-network"}})
  }

  const mode = deviceState.mode;

  return (  
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label for="Name">Nombre</Label>
        { mode !== "add"
          ? <Input type="text" name="name" id="Name" placeholder="Nombre del dispositivo" value={deviceState.name} disabled />
          : <Input type="text" name="name" id="Name" placeholder="Nombre del dispositivo" onChange={handleInputChange} />
        }
      </FormGroup>
      <Row form>
        <Col md={6}>
          <FormGroup>
            <Label for="Serial">Número serial</Label>
            { mode !== "add"
              ? <Input type="text" name="serial" id="Serial" placeholder="Número serial del dispositivo" value={deviceState.serial} disabled />
              : <Input type="text" name="serial" id="Serial" placeholder="Número serial del dispositivo" onChange={handleInputChange} />
            }
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="IpAddress">Dirección IP</Label>
            { mode !== "add"
              ? <Input type="text" name="ipAddress" id="IpAddress" placeholder="Dirección IP del dispositivo" value={deviceState.ipAddress} disabled />
              : <Input type="text" name="ipAddress" id="IpAddress" placeholder="Dirección IP del dispositivo" onChange={handleInputChange} />
            }
          </FormGroup>
        </Col>
      </Row>
      <Row form className="outer">
        <Col md={4}>
          <FormGroup>
            <Label for="value">Valor</Label>
            { mode !== "add"
              ? <Input type="number" name="value" id="value" placeholder="-1" value={deviceState.value} onChange={handleInputChange} />
              : <Input type="number" name="value" id="value" placeholder="-1" disabled/>
            }
          </FormGroup> 
        </Col>
        <div className="inner">
          <Button type="submit" color="success" className="button-form"> Guardar </Button>
          <Link to="/devices" state={{ policy: "cache-first" }}><Button outline color="danger" className="button-form"> Cancelar </Button></Link>
        </div>
      </Row>
    </Form>
  );
}