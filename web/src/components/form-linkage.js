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

const ADD_LINKAGE = gql`
  mutation AddLinkage($sensor: String!, $cond: String!, $actuator: String!, $region: String!) {
    addLinkage(sensor: $sensor, cond: $cond, actuator: $actuator, region: $region) {
      sensor
      cond
      actuator
      status
      region
    }
  }
`;

const EDIT_LINKAGE = gql`
  mutation updateLinkage($id: ID!, $cond: String, $region: String) {
    updateLinkage(id: $id, cond: $cond, region: $region) {
      id
      sensor
      cond
      actuator
      status
      region
    }
  }
`;

export default function FormLinkage(props) {
  const [addLinkage] = useMutation(ADD_LINKAGE, {onCompleted: successMessage});
  const [updateLinkage] = useMutation(EDIT_LINKAGE, {onCompleted: successMessage});

  let linkage = {
    id: "",
    sensor: "",
    cond: "",
    actuator: "",
    region: "",
    mode: "add"
  }

  if (props.data) {
    linkage = {  
      id: props.data.id,
      sensor: props.data.sensor,
      cond: props.data.cond,
      actuator: props.data.actuator,
      region: props.data.region,
      mode: "edit"
    }
  }

  const [linkageState, setState] = useState(linkage)

  function handleInputChange(event) {
    const {name , value} = event.target
    setState( prevState => ({
        ...prevState,
        [name] : value
    }))
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (linkageState.mode === "add") {
      addLinkage({ 
        variables: { 
          sensor: linkageState.sensor,
          cond: linkageState.cond,
          actuator: linkageState.actuator,
          region: linkageState.region,
        } 
      });
    } else if (linkageState.mode === "edit") {
      updateLinkage({ 
        variables: { 
          id: linkageState.id, 
          cond: linkageState.cond, 
          region: linkageState.region
        } 
      });
    }
  }

  function successMessage () {
    setState('');
    navigate('/linkages/', {state: { success: true, message: 'Se ha guardado con exito', policy: "cache-and-network"}})
  }

  const mode = linkageState.mode;

  return (  
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label for="Serial">Sensor</Label>
        { mode !== "add"
          ? <Input type="text" name="sensor" id="Sensor" placeholder="Número serial del sensor" value={linkageState.sensor} disabled />
          : <Input type="text" name="sensor" id="Sensor" placeholder="Número serial del sensor" onChange={handleInputChange} />
        }
      </FormGroup>
      <FormGroup>
        <Label for="Actuator">Actuador</Label>
        { mode !== "add"
          ? <Input type="text" name="actuator" id="Actuator" placeholder="Número serial del actuador" value={linkageState.actuator} disabled />
          : <Input type="text" name="actuator" id="Actuator" placeholder="Número serial del actuador" onChange={handleInputChange} />
        }
      </FormGroup>
      <Row form className="outer">
        <Col md={4}>
          <FormGroup>
            <Label for="Cond">Condición</Label>
            <Input type="text" name="cond" id="Cond" placeholder='Condicion de activación' value={linkageState.cond} onChange={handleInputChange}/>
          </FormGroup> 
        </Col>
        <Col md={4}>
          <FormGroup>
            <Label for="Region">Región</Label>
            <Input type="text" name="region" id="Region" placeholder="Región donde se encuentra el enlace" value={linkageState.region} onChange={handleInputChange}/>
          </FormGroup> 
        </Col>
        <Col md={4}>
          <div className="inner">
            <Button type="submit" color="success" className="button-form"> Guardar </Button>
            <Link to="/linkages" state={{ policy: "cache-first" }}><Button outline color="danger" className="button-form"> Cancelar </Button></Link>
          </div>
        </Col> 
      </Row>
    </Form>
  );
}