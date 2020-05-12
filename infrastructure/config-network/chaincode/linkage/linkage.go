package main

import (
	"bytes"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

type SmartContract struct {
}

type linkage struct {
	Id	 		string 	`json:"id"`
	Sensor	 	string 	`json:"sensor"`
	Cond	 	string 	`json:"thresh"`
	Actuator	string 	`json:"actuator"`
	Status	 	bool 	`json:"status"`
	Region	 	string 	`json:"region"`
}

func (s *SmartContract) Init(stub shim.ChaincodeStubInterface) sc.Response {
	fmt.Println('============= START : Initialize Ledger ===========')
	data := []byte("initSensor" + "initActuator")

	initLinkage = linkage{
		Id: md5.Sum(data), 
		Sensor: "initSensor", 
		Cond: "true", 
		Actuator: "initActuator",
		Status: "true",
		Region: "initRegion",
	}

	linkageAsBytes, _ := json.Marshal(initLinkage)

	stub.PutState(initLinkage.Id, linkageAsBytes)

	indexName := "sensor~actuator"
	saNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{initLinkage.Sensor, initLinkage.Actuator})
	if err != nil {
		return shim.Error(err.Error())
	}

	value := []byte{0x00}
	stub.PutState(saNameIndexKey, value)

	fmt.Println('============= END : Initialize Ledger ===========')

	return shim.Success(nil)
}

func (s *SmartContract) Invoke(stub shim.ChaincodeStubInterface) sc.Response {
	function, args := stub.GetFunctionAndParameters()
	fmt.Println("Invoke\n Function: " + function + "\n Args: " + args)

	if function == "queryLinkage" {
		return s.queryLinkage(stub, args)
	} else if function == "addLinkage" {
		return s.addLinkage(stub, args)
	} else if function == "updateLinkage" {
		return s.updateLinkage(stub, args)
	} else if function == "deleteLinkage" {
		return s.deleteLinkage(stub, args)
	} 

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) queryLinkage(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	queryString := args[0]

	queryResults, err := getQueryResultForQueryString(stub, queryString)
	
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(queryResults)
}

func (s *SmartContract) addLinkage(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}

	data := []byte(args[0] + args[2])

	var newLinkage = linkage{
		Id: md5.Sum(data), 
		Sensor: args[0], 
		Cond: args[1], 
		Actuator: args[2],
		Status: args[3],
		Region: args[4],
	}
	
	linkageAsBytes, _ := json.Marshal(newLinkage)
	stub.PutState(newLinkage.Id, linkageAsBytes)

	indexName := "sensor~actuator"
	saNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{newLinkage.Sensor, initLinkage.Actuator})
	if err != nil {
		return shim.Error(err.Error())
	}

	value := []byte{0x00}
	stub.PutState(saNameIndexKey, value)

	return shim.Success(nil)
}

func (s *SmartContract) updateLinkage(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	id := args[0]
	cond := args[1]
	status := args[2]
	region := args[3]

	linkageAsBytes, err := stub.GetState(id)
	if err != nil {
		return shim.Error("Failed to get linkage:" + err.Error())
	} else if linkageAsBytes == nil {
		return shim.Error("linkage does not exist")
	}

	updateLinkage := linkage{}
	err = json.Unmarshal(linkageAsBytes, &updateLinkage)
	if err != nil {
		return shim.Error(err.Error())
	}

	updateLinkage.Cond = cond
	updateLinkage.Status = status
	updateLinkage.Region = region

	linkageJSONasBytes, _ := json.Marshal(updateLinkage)
	err = stub.PutState(serial, linkageJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func (s *SmartContract) deleteLinkage(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	id := args[0]
	linkageAsBytes, err := stub.GetState(id)
	if err != nil {
		return shim.Error("Failed to get linkage:" + err.Error())
	} else if linkageAsBytes == nil {
		return shim.Error("linkage does not exist")
	}

	deleteLinkage := linkage{}
	err = json.Unmarshal([]byte(linkageAsBytes), &deleteLinkage)
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to decode JSON of: " + id + "\"}"
		return shim.Error(jsonResp)
	}

	err = stub.DelState(id)
	if err != nil {
		return shim.Error("Failed to delete state:" + err.Error())
	}

	// maintain the index
	indexName := "sensor~actuator"
	saNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{deleteLinkage.Sensor, deleteLinkage.Actuator})
	if err != nil {
		return shim.Error(err.Error())
	}

	//  Delete index entry to state.
	err = stub.Delate(saNameIndexKey)
	if err != nil {
		return shim.Error("Failed to delete state:" + err.Error())
	}

	return shim.Success(nil)
}

func getQueryResultForQueryString(stub shim.ChaincodeStubInterface, queryString string) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	buffer, err := constructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return nil, err
	}

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", buffer.String())

	return buffer.Bytes(), nil
} 

func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}