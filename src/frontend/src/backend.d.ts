import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Address = string;
export type TransactionId = string;
export type Time = bigint;
export type TxId = string;
export type Amount = number;
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: TransactionId;
    status: TransactionStatus;
    toFrom: Address;
    isHidden: boolean;
    timestamp: Time;
    txType: TransactionType;
    amount: number;
}
export enum TransactionStatus {
    pending = "pending",
    completed = "completed",
    failed = "failed"
}
export enum TransactionType {
    receive = "receive",
    send = "send",
    stealthSend = "stealthSend"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getBalance(): Promise<Amount>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPrincipal(): Promise<string>;
    getTransactions(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    receiveICP(from: Address, amount: Amount): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedDemoData(): Promise<void>;
    sendICP(to: Address, amount: Amount, stealth: boolean): Promise<string>;
    toggleTransactionVisibility(txId: TxId): Promise<void>;
}
