import React, {useEffect, createContext, useState } from "react";
import {ethers} from "ethers";
import {contractABI, contractAddress} from '../utils/constants'

export const TransactionContext = createContext();

const {ethereum} = window;

const getEthereumContract = async () =>{
    let signer = null;
    let provider;
    if (window.ethereum == null) {
        console.log("MetaMask not installed; using read-only defaults")
        provider = ethers.getDefaultProvider()
    } else {
        provider = new ethers.BrowserProvider(window.ethereum)
        signer = await provider.getSigner();
    }
    const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log(transactionsContract);
    return transactionsContract;
}


export const TransactionProvider = ({children}) =>{
    const [currentAccount, setCurrentAccount] = useState('')
    const [formData, setFormData] = useState({addressTo :"", amount : "", keyword : "", message : ""})
    const  [isLoading, setisLoading] = useState(false)
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"))
    const [transactions, setTransactions] = useState([]);

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
      };

    const getAllTransaction = async () =>{
        try {
            if(!ethereum) return alert("Please install metamask");
            const transactionsContract = await getEthereumContract();
            const availableTransactions = await transactionsContract.getAllTransactions();
            const structuredTransactions = await availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(Number(transaction.timestamp) * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(availableTransactions[0].amount) / (10 ** 18)
            }));
      
            console.log("Structured transactions:", structuredTransactions);
    
            setTransactions(structuredTransactions);

        } catch (error) {
            console.log(error);
        }
    }

    const checkIfWalletIsConnected = async () =>{
        try {
            if(!ethereum) return alert("Please install metamask");

            const accounts = await ethereum.request({ method: "eth_accounts" });
    
            if(accounts.length){
                setCurrentAccount(accounts[0]);
                getAllTransaction();
            }else{
                console.log("No accounts found");
            }
        } catch (error) {
            console.log(error);

            throw new Error("No Ethereum object.")            
        }
    }

    const checkIfTransactionsExist = async () =>{
        try {
            const transactionsContract = await getEthereumContract();
            const transactionsCount = await transactionsContract.getTransactionCount();

            window.localStorage.setItem("transactionCount", transactionCount);
        } catch (error) {
            console.log(error);

            throw new Error("No Ethereum object.")
        }
    }

    const connectWallet = async() =>{
        try{
            if(!ethereum) return alert("Please install metamask");
            const accounts = await ethereum.request({method : 'eth_requestAccounts'});
            setCurrentAccount(accounts[0]);
        }catch(err){
            console.log(err);

            throw new Error("No Ethereum object.")
        }
    }

    const sendTransaction = async () =>{
        console.log("sender account" ,currentAccount);
        try {
            if (ethereum) {
                const { addressTo, amount, keyword, message } = formData;
                const transactionsContract = await getEthereumContract();
                // const parsedAmount = ethers.utils.parseEther(amount);
                const parsedAmount = ethers.parseEther(amount);
                console.log("parsedAmount", parsedAmount.toString(16));
                await ethereum.request({
                  method: "eth_sendTransaction",
                  params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: "0x5208",
                    value: parsedAmount.toString(16),
                  }],
                });
        
                const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
        
                setisLoading(true);
                console.log(`Loading - ${transactionHash.hash}`);
                await transactionHash.wait();
                console.log(`Success - ${transactionHash.hash}`);
                setisLoading(false);
        
                const transactionsCount = await transactionsContract.getTransactionCount();
        
                setTransactionCount(Number(transactionsCount));
                window.reload();
            } else {
                console.log("No ethereum object");
            }

        } catch (error) {
            console.log(error);

            throw new Error("No Ethereum object.")
        }
    }

    useEffect(()=>{
        checkIfWalletIsConnected();
        checkIfTransactionsExist();
    }, [])

    return(
        <TransactionContext.Provider value = {{connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction, transactions, isLoading}}>
            {children}
        </TransactionContext.Provider>
    )
}

