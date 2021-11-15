const { request } = require("express");
const express = require("express");

const { v4: uuid } = require("uuid");

const app = express();

const customers = [];

//Middleware
function validateAccountCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((costumer) => costumer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: "Customer not found" });
  }

  request.customer = customer;

  return next();
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
  const { customer } = request;
  return res.json(customer.statement);
});

app.get("/deposit", validateAccountCPF, (req, res) => {
  const { description, amount } = request.body;
  const { costumer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  costumer.statement.push(statementOperation);

  return res.status(201).send();
});
// app.use(validateAccountCPF)

app.listen(3333);
