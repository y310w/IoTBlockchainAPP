import React from "react"

import { Table } from 'reactstrap';

export default class TableData extends React.Component {
 
  constructor(props){
    super(props);

    this.getHeader = this.getHeader.bind(this);
    this.getRowsData = this.getRowsData.bind(this);
    this.getKeys = this.getKeys.bind(this);
  }

  getKeys = function(){
    let keys = Object.keys(this.props.data[0]);
    let index = keys.indexOf('__typename');

    if (index > -1) {
      keys.splice(index, 1);
    }

    return keys;
  }
  
  getHeader = function(){
    let keys = this.getKeys().map(key => key.charAt(0).toUpperCase() + key.slice(1));

    return keys.map((key)=>{
      return <th key={key}>{key}</th>
    })
  }
  
  getRowsData = function(){
    let items = this.props.data;
    let keys = this.getKeys();

    return items.map((row, index)=>{
      return <tr key={index}><RenderRow key={index} data={row} keys={keys}/></tr>
    })
  }
  
  render() {
    return (
      <Table dark className="table-round">
        <thead>
          <tr>
            {this.getHeader()}
          </tr>
        </thead>
        <tbody>
          {this.getRowsData()}
        </tbody>
      </Table>
    );
  }
}

const RenderRow = (props) =>{
  return props.keys.map((key)=>{
    return <td key={props.data[key]}>{props.data[key]}</td>
  })
}