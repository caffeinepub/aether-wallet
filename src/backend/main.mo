import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";

import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Transaction "Transaction";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type User = Principal;
  type Amount = Float;
  type Timestamp = Int;
  type TxId = Text;
  type Address = Text;

  module Wallet {
    public type Transaction = Transaction.Transaction;
    public type TransactionType = Transaction.TransactionType;
    public type TransactionStatus = Transaction.TransactionStatus;

    public func compare(wallet1 : Wallet, wallet2 : Wallet) : Order.Order {
      switch (Text.compare(wallet1.owner.toText(), wallet2.owner.toText())) {
        case (#equal) { Float.compare(wallet1.balance, wallet2.balance) };
        case (order) { order };
      };
    };
  };

  public type Wallet = {
    owner : User;
    balance : Amount;
    transactions : List.List<Transaction.Transaction>;
  };

  public type UserProfile = {
    name : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let wallets = Map.empty<User, Wallet>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func getWallet(user : User) : Wallet {
    switch (wallets.get(user)) {
      case (null) {
        // Create new wallet with starting balance
        let newWallet : Wallet = {
          owner = user;
          balance = 100.0;
          transactions = List.empty<Transaction.Transaction>();
        };
        wallets.add(user, newWallet);
        newWallet;
      };
      case (?wallet) { wallet };
    };
  };

  func updateWallet(wallet : Wallet) {
    wallets.add(wallet.owner, wallet);
  };

  func calculateBalance(transactions : List.List<Transaction.Transaction>) : Amount {
    var balance : Amount = 100.0;
    for (transaction in transactions.values()) {
      switch (transaction.txType) {
        case (#send) {
          if (transaction.status == #completed) {
            balance -= transaction.amount;
          };
        };
        case (#receive) {
          if (transaction.status == #completed) {
            balance += transaction.amount;
          };
        };
        case (#stealthSend) {
          if (transaction.status == #completed) {
            balance -= transaction.amount;
          };
        };
      };
    };
    balance;
  };

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Wallet functions
  public shared ({ caller }) func sendICP(to : Address, amount : Amount, stealth : Bool) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send ICP");
    };

    if (amount <= 0.0) {
      return "Error: Amount must be greater than 0";
    };
    if (to == "") {
      return "Error: Recipient address cannot be empty";
    };

    let wallet = getWallet(caller);
    if (wallet.balance < amount) {
      return "Error: Insufficient balance";
    };

    let txId = "tx_" # wallet.transactions.size().toText();
    let txType : Transaction.TransactionType = if (stealth) { #stealthSend } else { #send };

    let transaction = Transaction.createTransaction(
      txId,
      txType,
      to,
      amount,
      Time.now(),
      #completed,
      true,
    );

    wallet.transactions.add(transaction);
    let updatedWallet = { wallet with balance = wallet.balance - amount };
    updateWallet(updatedWallet);

    txId;
  };

  public shared ({ caller }) func receiveICP(from : Address, amount : Amount) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can receive ICP");
    };

    if (amount <= 0.0) {
      return "Error: Amount must be greater than 0";
    };
    if (from == "") {
      return "Error: Sender address cannot be empty";
    };

    let wallet = getWallet(caller);
    let txId = "tx_" # wallet.transactions.size().toText();

    let transaction = Transaction.createTransaction(
      txId,
      #receive,
      from,
      amount,
      Time.now(),
      #completed,
      true,
    );

    wallet.transactions.add(transaction);
    let updatedWallet = { wallet with balance = wallet.balance + amount };
    updateWallet(updatedWallet);

    txId;
  };

  public query ({ caller }) func getTransactions() : async [Transaction.Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    let wallet = getWallet(caller);
    wallet.transactions.toArray().sort();
  };

  public shared ({ caller }) func toggleTransactionVisibility(txId : TxId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify transactions");
    };

    let wallet = getWallet(caller);
    
    // Verify transaction ownership
    var found = false;
    for (tx in wallet.transactions.values()) {
      if (tx.id == txId) {
        found := true;
      };
    };
    
    if (not found) {
      Runtime.trap("Unauthorized: Transaction does not belong to caller");
    };

    let updatedTransactions = wallet.transactions.map<Transaction.Transaction, Transaction.Transaction>(
      func(tx) {
        if (tx.id == txId) {
          Transaction.toggleVisibility(tx);
        } else {
          tx;
        };
      }
    );
    let updatedWallet = { wallet with transactions = updatedTransactions };
    updateWallet(updatedWallet);
  };

  public query ({ caller }) func getBalance() : async Amount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balance");
    };

    let wallet = getWallet(caller);
    calculateBalance(wallet.transactions);
  };

  public query ({ caller }) func getPrincipal() : async Text {
    caller.toText();
  };

  public shared ({ caller }) func seedDemoData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can seed demo data");
    };

    let wallet = getWallet(caller);
    if (wallet.transactions.isEmpty()) {
      let demoTransactions = List.empty<Transaction.Transaction>();
      demoTransactions.add(Transaction.createTransaction("demo_tx_1", #send, "address_1", 10.0, Time.now(), #completed, true));
      demoTransactions.add(Transaction.createTransaction("demo_tx_2", #receive, "address_2", 20.0, Time.now(), #completed, true));
      demoTransactions.add(Transaction.createTransaction("demo_tx_3", #stealthSend, "address_3", 5.0, Time.now(), #completed, true));
      demoTransactions.add(Transaction.createTransaction("demo_tx_4", #send, "address_4", 15.0, Time.now(), #completed, true));
      demoTransactions.add(Transaction.createTransaction("demo_tx_5", #receive, "address_5", 25.0, Time.now(), #completed, true));
      let updatedWallet = { wallet with transactions = demoTransactions };
      updateWallet(updatedWallet);
    };
  };
};
