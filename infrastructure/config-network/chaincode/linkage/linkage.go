package main

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
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
	Cond	 	string 	`json:"cond"`
	Actuator	string 	`json:"actuator"`
	Status	 	bool 	`json:"status"`
	Region	 	string 	`json:"region"`
}

func (s *SmartContract) Init(stub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

func (s *SmartContract) Invoke(stub shim.ChaincodeStubInterface) sc.Response {
	function, args := stub.GetFunctionAndParameters()

	if function == "initLinkage" {
		return s.initLinkage(stub)
	} else if function == "queryLinkage" {
		return s.queryLinkage(stub, args)
	} else if function == "addLinkage" {
		return s.addLinkage(stub, args)
	} else if function == "updateLinkage" {
		return s.updateLinkage(stub, args)
	} else if function == "deleteLinkage" {
		return s.deleteLinkage(stub, args)
	} else if function == "historyLinkage" {
		return s.historyLinkage(stub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) initLinkage(stub shim.ChaincodeStubInterface) sc.Response {
	fmt.Println("============= START : Initialize Ledger ===========")
	data := md5.Sum([]byte("initSensor" + "initActuator"))
	id := hex.EncodeToString(data[:])

	initLinkage := linkage{
		Id: id, 
		Sensor: "initSensor", 
		Cond: "true", 
		Actuator: "initActuator",
		Status: true,
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

	fmt.Println("============= END : Initialize Ledger ===========")

	return shim.Success(nil)
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

	data := md5.Sum([]byte(args[0] + args[2]))
	id := hex.EncodeToString(data[:])

	status, err := strconv.ParseBool(args[3])
   	if err != nil {
		return shim.Error("Failed to convert status:" + err.Error())
   	}

	newLinkage := linkage{
		Id: id, 
		Sensor: args[0], 
		Cond: args[1], 
		Actuator: args[2],
		Status: status,
		Region: args[4],
	}
	
	linkageAsBytes, _ := json.Marshal(newLinkage)
	stub.PutState(newLinkage.Id, linkageAsBytes)

	indexName := "sensor~actuator"
	saNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{newLinkage.Sensor, newLinkage.Actuator})
	if err != nil {
		return shim.Error(err.Error())
	}

	value := []byte{0x00}
	stub.PutState(saNameIndexKey, value)

	return shim.Success([]byte(`{"data": true}`))
}

func (s *SmartContract) updateLinkage(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	id := args[0]
	cond := args[1]

	status, err := strconv.ParseBool(args[2])
   	if err != nil {
		return shim.Error("Failed to convert status:" + err.Error())
   	}
	
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
	err = stub.PutState(id, linkageJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte(`{"data": true}`))
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
		jsonResp := "{\"Error\":\"Failed to decode JSON of: " + id + "\"}"
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
	err = stub.DelState(saNameIndexKey)
	if err != nil {
		return shim.Error("Failed to delete state:" + err.Error())
	}

	return shim.Success([]byte(`{"data": true}`))
}

func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) (*bytes.Buffer, error) {
	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("{\"data\": [")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"" + string(queryResponse.Key) + "\"")

		// Record is a JSON object, so we write as-is
		if !bytes.Equal(queryResponse.Value, []byte{0x00}) {
			buffer.WriteString(",\"Record\":")
			buffer.WriteString(string(queryResponse.Value))
		}
		
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]}")

	return &buffer, nil
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

func (s *SmartContract) historyLinkage(stub shim.ChaincodeStubInterface, args []string) sc.Response {
	type LinkageHistory struct {
		TxId     string    `json:"txId"`
		Record   linkage   `json:"value"`
	}
	type Response struct {
		Data     []LinkageHistory   `json:"data"`
	} 

	var history []LinkageHistory;
	var link linkage
	var response Response;

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	linkageId := args[0]
	fmt.Printf("- start historyLinkage: %s\n", linkageId)

	// Get History
	resultsIterator, err := stub.GetHistoryForKey(linkageId)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		var tx LinkageHistory
		tx.TxId = historyData.TxId                    
		json.Unmarshal(historyData.Value, &link)    
		if historyData.Value == nil {                 
			var emptyLinkage linkage
			tx.Record = emptyLinkage                
		} else {
			json.Unmarshal(historyData.Value, &link)
			tx.Record = link                     
		}
		history = append(history, tx)             
	}
	fmt.Printf("- historyLinkage returning:\n%s", history)

	response.Data = history

	historyAsBytes, _ := json.Marshal(response)    
	return shim.Success(historyAsBytes)
}

func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}