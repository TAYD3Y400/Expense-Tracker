const fs = require("fs");
const { Command } = require("commander");
const cmndr = new Command();
const filePath = "./tasks.json";
const csvFilePath = "./expenses.csv";


cmndr
    .name('expense-tracker')
    .description('A program to track your expenses')
    .version('0.1.0');

cmndr.command('add')
    .description('A command that adds a expense did, with their respective description, amount and date. This command returns the expense id to have the option to use other commands with this expense id.')
    .option('-d, --description <item>', 'A little description or the name of the product that you bought or the service that you had.')
    .option('-a, --amount <price>', 'The amount of money that the expense represent.')
    .option('-t, --date <date>', 'The date time of the expense. If not provided, the current date will be used.', new Date())
    .option('-c, --category <category>', 'The category of the expense.', 'General')
    .action((options) => {
        addExpense(options.description, options.amount, options.date, options.category);
    });

cmndr.command('delete')
    .description('A command that deletes a expense by its id.')
    .option('-i, --id <id>', 'The id of the expense that you want to delete.')
    .action((options) => {
       deleteExpense(options.id);
    });

cmndr.command('update')
    .description('A command that updates a expense by its id.')
    .option('-i, --id <id>', 'The id of the expense that you want to update.')
    .option('-d, --description <item>', 'A little description or the name of the product that you bought or the service that you had.')
    .option('-a, --amount <price>', 'The amount of money that the expense represent.')
    .option('-t, --date <date>', 'The date time of the expense. If not provided, the current date will be used.')
    .option('-c, --category <category>', 'The category of the expense.')
    .action((options) => {
        updateExpense(options.id, options.description, options.amount, options.date, options.category);
    });

cmndr.command('list')
    .description('A command that lists all the expenses.')
    .action(() => {
        listExpenses();
    });

cmndr.command('summary')
    .description('A command that shows a summary of the expenses.')
    .option('-m, --month <month>', 'The month that you want to see the summary. If not provided, the current month will be display a total summary of all months.')
    .option('-c, --category <category>', 'The category that you want to see the summary. If not provided, the summary will be for all categories.')
    .action((options) => {
        getSummary(options.month, options.category);
    });

cmndr.command('export')
    .description('A command that exports the expenses to a CSV file.')
    .option('-f, --file <file>', 'The file path where the expenses will be exported.', csvFilePath)
    .action((options) => {
        exportExpensesAsCSV(options.file);
    });

cmndr.parse();

function loadExpenses(file){
    if (fs.existsSync(file)){
        const data = fs.readFileSync(filePath, "utf-8")
        return JSON.parse(data);
    }
    return []
}

function saveExpenses(file, tasks){
    fs.writeFile(file, JSON.stringify(tasks, null, 2), function (err) {
        if (err) throw err;
      });
}

function exportExpensesAsCSV(file){
    const expenses = loadExpenses(filePath);
    const csv = expenses.map((item) => `${item.id},${item.description},${item.amount},${item.category},${item.date}`).join("\n");
    fs.writeFile(file, csv, function (err) {
        if (err) throw err;
      });
}

function getNextId(data){
    const ids = data.map((item) => item.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

function verifyId(data, id){
    const item = data.find((item) => item.id == id);
    if (!item){
        console.log(`Expense with id ${id} not found`);
        process.exit(1);
    }
}

function addExpense(description, amount, expenseDate, category){
    const date = expenseDate ? new Date(expenseDate) : new Date();
    const expenses = loadExpenses(filePath);
    const newExpense = {id:getNextId(expenses), description, amount, category, date};
    expenses.push(newExpense);
    saveExpenses(filePath, expenses);
    console.log(`Expense added with id: ${newExpense.id}`);
}

function deleteExpense(id){
    const expenses = loadExpenses(filePath);
    verifyId(expenses, id);
    const newExpenses = expenses.filter((item) => item.id != id);
    saveExpenses(filePath, newExpenses);
    console.log(`Expense with id ${id} deleted`);
}

function updateExpense(id, description, amount, date, category){
    const expenses = loadExpenses(filePath);
    verifyId(expenses, id);
    const newExpenses = expenses.map((item) => {
        if (item.id == id){
            const newDescription = description ? description : item.description;
            const newAmount = amount ? amount : item.amount;
            const newDate = date ? new Date(date) : item.date;
            const newCategory = category ? category : item.category;
            return {id, description: newDescription, amount: newAmount, category:newCategory, date: newDate};
        }
        return item;
    });
    saveExpenses(filePath, newExpenses);
    console.log(`Expense with id ${id} updated`);
} 

function listExpenses(){
    const expenses = loadExpenses(filePath);
    expenses.forEach((item) => {
        console.log(`Id: ${item.id}, Description: ${item.description}, Amount: $${item.amount}, Category: ${item.category} Date: ${item.date}`);
    });
}

function getSummary(month, category){
    const expenses = loadExpenses(filePath);
    let expensesMonth = [];
    let label = "";
    if (month){
        expensesMonth = expenses.filter((item) => new Date(item.date).getMonth()+1 == month);
        label = " for month " + month;
    } else {
        expensesMonth = expenses;
    }
    if (category){
        expensesMonth = expensesMonth.filter((item) => item.category == category);
        label = label + " for category " + category + ":";
    } else {
        label = label + " for all categories:";
    }
    const total = expensesMonth.reduce((acc, item) => acc + parseInt(item.amount), 0);
    console.log(`Total expenses${label} $${total}`);
}
