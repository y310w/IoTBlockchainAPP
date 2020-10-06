import React, { useState } from "react"
import { Table } from "reactstrap";

export default function TableData(props) {
  
  function getKeys(props) {
    let keys = Object.keys(props);
    let index = keys.indexOf('__typename');

    if (index > -1) {
      keys.splice(index, 1);
    }

    return keys;
  }

  const [dataState] = useState({
    keysHeader: getKeys(props.data[0]).map(key => key.charAt(0).toUpperCase() + key.slice(1)),
    keys: getKeys(props.data[0]),
    items: props.data
  })

  const headers = dataState.keysHeader.map((key) => {
    return <th key={key}>{key}</th>
  })

  const rows = dataState.items.map((row, index) => {
    return <tr key={index}><RenderRow key={index} data={row} keys={dataState.keys}/></tr>
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

const RenderRow = (props) =>{
  return props.keys.map((key)=>{
    return <td key={props.data[key]}>{props.data[key]}</td>
  })
}