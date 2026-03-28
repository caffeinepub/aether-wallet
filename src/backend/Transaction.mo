import Time "mo:core/Time";
import Order "mo:core/Order";
import Float "mo:core/Float";
import Text "mo:core/Text";

module {
  public type TransactionId = Text;
  public type Address = Text;

  public type TransactionType = {
    #send;
    #receive;
    #stealthSend;
  };

  public type TransactionStatus = {
    #pending;
    #completed;
    #failed;
  };

  public type Transaction = {
    id : TransactionId;
    txType : TransactionType;
    toFrom : Address;
    amount : Float;
    timestamp : Time.Time;
    status : TransactionStatus;
    isHidden : Bool;
  };

  public func createTransaction(id : TransactionId, txType : TransactionType, toFrom : Address, amount : Float, timestamp : Time.Time, status : TransactionStatus, isHidden : Bool) : Transaction {
    {
      id;
      txType;
      toFrom;
      amount;
      timestamp;
      status;
      isHidden;
    };
  };

  func transactionTypeToInt(txType : TransactionType) : Int {
    switch (txType) {
      case (#send) { 0 };
      case (#receive) { 1 };
      case (#stealthSend) { 2 };
    };
  };

  func statusToInt(status : TransactionStatus) : Int {
    switch (status) {
      case (#pending) { 0 };
      case (#completed) { 1 };
      case (#failed) { 2 };
    };
  };

  public func compareByTransactionId(t1 : Transaction, t2 : Transaction) : Order.Order {
    Text.compare(t1.id, t2.id);
  };

  public func compareByAmount(t1 : Transaction, t2 : Transaction) : Order.Order {
    Float.compare(t1.amount, t2.amount);
  };

  public func compareByTimestamp(t1 : Transaction, t2 : Transaction) : Order.Order {
    Int.compare(t1.timestamp, t2.timestamp);
  };

  // Returns
  public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
    switch (compareByTimestamp(t1, t2)) {
      case (#equal) { compareByTransactionId(t1, t2) };
      case (order) { order };
    };
  };

  public func toggleVisibility(transaction : Transaction) : Transaction {
    {
      transaction with
      isHidden = not transaction.isHidden;
    };
  };

  public func updateStatus(transaction : Transaction, newStatus : TransactionStatus) : Transaction {
    {
      transaction with
      status = newStatus;
    };
  };
};
