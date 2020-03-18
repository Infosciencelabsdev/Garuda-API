import * as Mongoose from "mongoose";
import uuid = require("uuid");
import { TransactionReceipt } from 'web3-core';
export interface Transaction {
    transactionId: string;
    transactionType: transactionType;
    address: string;
    public?: NetworkTransaction;
    private?: NetworkTransaction;
    status: transactionStatus;
    scope?: string;
    sender: string; // from
    // to?
}
export enum scope {
    personal = "personal", user = "user", builder = "builder",
    government = "government", admin = "admin", superadmin = "superadmin"
}
export enum transactionType {
    Deposit = "Deposit",
    Withdraw = "Withdraw",
    CreateProperty = "Create_Property",
    ConfirmProperty = "Confirm_Property",
    CreateCertificate = "Create_Certificate",
    CreateContract = "Create_Contract",
    List = "List",
    Buy = "Buy",
    ConfirmBuy = "Confirm_Buy",
    Transfer = "Transfer",
    Confirm_Transfer = "Confirm_Transfer",
    Rent = "Rent",
    AddUser = "AddUser",
    Others = "Others"
}
export enum transactionStatus {
    In_Progress = "In_Progress", Submitted = "Submitted", Pending_Confirmations = "Pending_Confirmation", Success = "Success", Failed = "Failed"
}
export enum networkType {
    private = "private",
    public = "public"
}
export interface Receipt {
    hash?: string;
    message?: string;
    receipt?: {
        blockHash?: string;
        blockNumber?: number;
        contractAddress?: string;
        cumulativeGasUsed?: string;
        from?: string;
        gasUsed?: string;
        logs?: [
            {
                address?: string;
                blockHash?: string;
                blockNumber?: string;
                data?: string;
                logIndex?: string;
                removed?: boolean;
                topics?: [
                    string
                ];
                transactionHash?: string;
                transactionIndex?: string;
            }
        ],
        logsBloom?: string;
        status?: string;
        to?: string;
        transactionHash?: string;
        transactionIndex?: number;
    };
    status?: string;
}
// logs ?: Log[];
// events ?: {
//     [eventName: string]: EventLog;
// };
export const LogSchema = new Mongoose.Schema({
    address: { type: String, required: false },
    blockHash: { type: String, required: false },
    blockNumber: { type: String, required: false },
    data: { type: String, required: false },
    logIndex: { type: String, required: false },
    removed: { type: Boolean, required: false },
    topics: { type: [String], required: false },
    transactionHash: { type: String, required: false },
    transactionIndex: { type: String, required: false },
});
export const EventSchema = new Mongoose.Schema({
    event: { type: String, required: false },
    address: { type: String, required: false },
    returnValues: { type: Object, required: false },
    logIndex: { type: Number, required: false },
    transactionIndex: { type: Number, required: false },
    transactionHash: { type: String, required: false },
    blockHash: { type: String, required: false },
    blockNumber: { type: Number, required: false },
    raw: { type: String, required: false }, //{data: string; topics: any[]};
});
export const ReceiptSchema = new Mongoose.Schema({
    // hash: { type: String, required: false },
    // message: { type: String, required: false },
    // receipt: {
    transactionHash: { type: String, required: false },
    transactionIndex: { type: Number, required: false },
    blockHash: { type: String, required: false },
    blockNumber: { type: Number, required: false },
    from: { type: String, required: false },
    to: { type: String, required: false },
    contractAddress: { type: String, required: false },
    cumulativeGasUsed: { type: String, required: false },
    gasUsed: { type: String, required: false },
    logs: { type: [LogSchema], required: false },
    logsBloom: { type: String, required: false },
    status: { type: String, required: false },
    events: { type: [EventSchema], required: false },

    // },
    // status: { type: String, required: false },
});
export interface NetworkTransaction {
    hash: string;
    status: transactionStatus;
    message: string;
    receipt: TransactionReceipt | {};
    networkType: networkType;
}
export interface ITransaction extends Mongoose.Document, Transaction {
    id: string;
}
export const networkTrxSchema = new Mongoose.Schema(
    {
        hash: { type: String, unique: false, sparse: true },
        status: { type: transactionStatus, default: transactionStatus.In_Progress },
        message: { type: String, required: false },
        receipt: { type: ReceiptSchema, required: false, strict: false },
        networkType: { type: networkType, required: true },
    }
);
export const TransactionSchema = new Mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        transactionId: { type: String, required: true, unique: true },
        transactionType: { type: transactionType, required: true },
        address: { type: String, required: true },
        public: { type: networkTrxSchema, required: false },
        private: { type: networkTrxSchema, required: false },
        status: { type: transactionStatus, required: true, default: transactionStatus.In_Progress },
        message: { type: String, required: false },
        scope: { type: scope, required: false },
        sender: { type: String, required: true },
    },
    {
        timestamps: true
    });
TransactionSchema.pre('validate', function (next) {
    const self = this;
    self.id = uuid.v4();
    return next();
});
export const TransactionModel = Mongoose.model<ITransaction>('Transaction_s', TransactionSchema);
export async function TrxModel(trxId, payload) {
    let Transaction: Transaction = {
        transactionId: trxId,
        transactionType: payload.transactionType,
        address: payload.address,
        status: payload.status,
        scope: payload.scope ? payload.scope : scope.personal,
        sender: payload.sender,
        public: payload.public ? payload.public : undefined,
        private: payload.private ? payload.private : undefined
    };
    return Transaction;
}
export async function addNetworkTrx(payload) {
    let networkTransaction: NetworkTransaction = {
        hash: payload.hash,
        status: payload.status,
        message: payload.message,
        receipt: payload.receipt ? payload.receipt : undefined,
        networkType: payload.networkType
    };
    return networkTransaction;
}