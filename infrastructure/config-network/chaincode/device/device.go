package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

type SmartContract struct {
}

type device struct {
	Name		string 	`json:"name"`
	Serial		string 	`json:"serial"`
	IpAddress	string 	`json:"ipAddress"`
	Value		int32 	`json:"value"`
}

func (s *SmartContract) Init(stub shim.ChaincodeStubInterface) sc.Response {
	fmt.Println('============= START : Initialize Ledger ===========')
	initDevice = device{
		Name: "initName", 
		Serial: "initSerialNumber", 
		IpAddress: "initIpAddress", 
		Value: -1,
	}

	deviceAsBytes, _ := json.Marshal(initDevice)

	stub.PutState(initDevice.Serial, deviceAsBytes)

	indexName := "serial~ipAddress"
	serialNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{initDevice.Serial, initDevice.IpAddress})
	if err != nil {
		return shim.Error(err.Error())
	}

	value := []byte{0x00}
	stub.PutState(serialNameIndexKey, value)

	fmt.Println('============= END : Initialize Ledger ===========')

	return shim.Success(nil)
}

func (s *SmartContract) Invoke(stub shim.ChaincodeStubInterface) sc.Response {
	function, args := stub.GetFunctionAndParameters()
	fmt.Println("Invoke\n Function: " + function + "\n Args: " + args)

	if function == "queryDevice" {
		return s.queryDevice(stub, args)
	} else if function == "addDevice" {
		return s.addDevice(stub, args)
	} else if function == "updateDevice" {
		return s.updateDevice(stub, args)
	} else if function == "deleteDevice" {
		return s.deleteDevice(stub, args)
	} 

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) queryDevice(stub shim.ChaincodeStubInterface, args []string) sc.Response {
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

func (s *SmartContract) addDevice(stub shim.ChaincodeStubInterface, , args []string) sc.Response {
	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	var newDevice = device{
		Name: args[0], 
		Serial: args[1], 
		IpAddress: args[2], 
		Value: args[3],
	}
	
	deviceAsBytes, _ := json.Marshal(newDevice)
	stub.PutState(newDevice.Serial, deviceAsBytes)

	indexName := "serial~ipAddress"
	serialNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{newDevice.Serial, newDevice.IpAddress})
	if err != nil {
		return shim.Error(err.Error())
	}

	value := []byte{0x00}
	stub.PutState(serialNameIndexKey, value)

	return shim.Success(nil)
}

func (s *SmartContract) updateDevice(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	serial := args[0]
	value := args[1]

	deviceAsBytes, err := stub.GetState(serial)
	if err != nil {
		return shim.Error("Failed to get device:" + err.Error())
	} else if deviceAsBytes == nil {
		return shim.Error("Device does not exist")
	}

	updateDevice := device{}
	err = json.Unmarshal(deviceAsBytes, &updateDevice)
	if err != nil {
		return shim.Error(err.Error())
	}

	updateDevice.Value = value
	DeviceJSONasBytes, _ := json.Marshal(updateDevice)
	err = stub.PutState(serial, DeviceJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func (s *SmartContract) deleteDevice(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	serial := args[0]
	deviceAsBytes, err := stub.GetState(serial)
	if err != nil {
		return shim.Error("Failed to get device:" + err.Error())
	} else if deviceAsBytes == nil {
		return shim.Error("Device does not exist")
	}

	deleteDevice := Device{}
	err = json.Unmarshal([]byte(deviceAsBytes), &deleteDevice)
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to decode JSON of: " + serial + "\"}"
		return shim.Error(jsonResp)
	}

	err = stub.DelState(serial)
	if err != nil {
		return shim.Error("Failed to delete state:" + err.Error())
	}

	// maintain the index
	indexName := "serial~ipAddress"
	serialNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{deleteDevice.Serial, deleteDevice.IpAddress})
	if err != nil {
		return shim.Error(err.Error())
	}

	//  Delete index entry to state.
	err = stub.DelState(serialNameIndexKey)
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