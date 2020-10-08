import React, { useState } from "react"
import { navigate } from "gatsby"
import { Table, Button } from "reactstrap";

export default function TableData(props) {
  
  function getKeys(data, editable) {
    let keys = Object.keys(data);
    let index = keys.indexOf('__typename');

    if (index > -1) {
      keys.splice(index, 1);
    }

    if (editable) {
      keys.push('Editar');
    }

    return keys;
  }

  function editDataRow(event) {
    const index = event.target.value;
    const row = props.data[index];
  
    navigate('/' + props.redirect, {state: { data: row }});
  }

  const RenderRow = (props) =>{
    return props.keys.map((key, index)=>{
      if (key === "Editar") {
        return <td key={index}><Button color="warning" onClick={editDataRow} value={props.index}>Editar</Button></td>
      } else if (key === "txId"){
        return <td key={props.data[key]} className="td-reduce">{props.data[key].toString()}</td>
      } else {
        return <td key={props.data[key]}>{props.data[key].toString()}</td>
      }
    })
  }

  const editable = (props.editable === 'true')

  const [dataState] = useState({
    keysHeader: getKeys(props.data[0], editable).map(key => key.charAt(0).toUpperCase() + key.slice(1)),
    keys: getKeys(props.data[0], editable),
    items: props.data
  })

  const headers = dataState.keysHeader.map((key) => {
    return <th key={key}>{key}</th>
  })

  const rows = dataState.items.map((row, index) => {
    return <tr key={index}><RenderRow key={index} data={row} keys={dataState.keys} index={index}/></tr>
  })
  
  return (
    <Table dark className="table-round">
      <thead>
        <tr>
          {headers}
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </Table>
  );
}