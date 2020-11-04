import React from "react"
import Layout from "../components/layout"
import { Link } from "gatsby"
import { Container } from "reactstrap"

export default function Home() {
  return (
    <Layout>
      <Container>
        <h1 className="is-light-text text-x-large letter-spacing">Home</h1>
        <p>
          IoTBlockchainApp es una aplicación distribuida basada en Blockchain para dar soporte a IoT.
          Dentro de la aplicación podrás llevar la gestión de dispositivos IoT dentro de una red 
          domótica, y gracias a la tecnología Blockchain, se mantendrá una lista creciente de records,
          donde podrás ver toda la trazabilidad de las transacciones con su respectivo Hash.
        </p>

        <p>
          Debido a su diseño, un Blockchain es resistente a la modificación de los datos. Todo ello 
          está gestionado por una red peer-to-peer adheridos colectivamente al protocolo de 
          comunicación establecido entre nodos y validación de nuevos bloques.
        </p>
      </Container>
      
      <Container className="text-container">
        <h1 className="is-light-text text-large letter-spacing">Descripción de la aplicación</h1>
        <p>
          De forma introductoria, la aplicación consiste en dos partes principalmente, por un lado 
          tenemos los dispositivos que pueden ser sensores, como actuadores. Y por el otro, los 
          enlaces, que viene a representar la relación que hay entre un sensor y un actuador.
        </p>
      </Container>

      <Container className="text-container">
        <h1 className="is-light-text text-large letter-spacing">Dispositivos</h1>
        <p>
          En <Link to="/devices">Dispositivos</Link> podrás añadir, editar, borrar y mostrar el 
          historial. Para añadir un nuevo dispositivo, debemos indicar un nombre, el número serial, 
          la dirección IP y un valor numérico. Este último indicará los distintos valores que va 
          tomando el dispositivo (sensor) y se profundizará más adelante. En el caso de ser un 
          actuador, valdrá -1.
        </p>
      </Container>

      <Container className="text-container">
        <h1 className="is-light-text text-large letter-spacing">Enlaces</h1>
        <p>
          Por otra parte, en los <Link to="/linkages">Enlaces</Link> se debe de indicar los dispositivos
          que van a formar parte de un enlace. Para ello, determinamos el número serial de ambas partes
          (sensor y actuador), una región dónde se localice dicho enlace y por último, una condición. 
          Dicha condición va a estar formado por una variable "value", acompañado de un operador de 
          comparación y un valor numérico. Ahora aparece en escena, el valor detectado por el sensor
          mencionado anteriormente.  
        </p>

        <p>
          Un enlace va a estar condicionado por el cumplimiento de la condición establecida. Por defecto,
          el enlace creado va a estar habilitado. Cuando un sensor recibe un valor, se comprobará cada 
          uno de sus enlaces establecidos. En el caso de que se cumpla la condición, el enlace se habilita 
          y se mandará una señal de activación al actuador gracias a la dirección IP proporcionada.
        </p>
    
        <p>
          Cabe mencionar, que los enlaces se pueden añadir, modificar, borrar, habilitar, deshabilitar y 
          mostrar el historial.
        </p>
      </Container>
    </Layout>
  )
}