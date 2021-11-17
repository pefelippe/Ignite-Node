const express = require("express");

const { v4: uuid } = require("uuid");

const app = express();

const customers = [];

//Middleware's

function validateAccountCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((costumer) => costumer.cpf === cpf);
 
  if (!customer) {
    return res.status(400).json({ error: "Customer not found" });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  return statement.reduce((acc, operation) => {
    return operation.type === "credit" ?  acc + operation.amount :  acc - operation.amount
  }, 0)
}

app.use(express.json());

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const isAlreadyCreated = customers.some((customer) => customer.cpf === cpf);

  if (isAlreadyCreated) {
    return res.status(404).json({ error: "Customer already exists" });
  }

  customers.push({
    id: uuid(),
    cpf,
    name,
    statement: [],
  });

  return res.status(201).send();
});

app.get("/statement", validateAccountCPF, (req, res) => {

  const { customer } = req;
  return res.json(customer.statement);
});

app.get("/statement/date", validateAccountCPF, (req, res) => {

  const { customer } = req;
  const {date} = req.query;

  const dateFormat = new Date(date + " 00:00")

  const statement = customer.statement.filter(statement => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

  return res.json(statement);
});

app.post("/deposit", validateAccountCPF, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

// app.use(validateAccountCPF)

app.post("/withdraw", validateAccountCPF, (req, res) => {
  const { amount } = req.body;
  
  const { customer } = req;
  
  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return res.status(400).json({error: "Insufficient funds"})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation)
  console.log(customer.statement)
  return res.status(201).send()
})


app.put("/account", validateAccountCPF, (req, res) => {
  const {name} = req.body;
  const {customer} = req;

  customer.name = name;

  return res.status(201).send()
})

app.get("/account", validateAccountCPF, (req, res) => {
  const {customer} = req;
  return res.json(customer)
})

app.delete("/account", validateAccountCPF, (req, res) => {
    const {customer} = req;

    customers.splice(customer, 1)

    return res.status(200).json(customers)
})
app.listen(3333);
