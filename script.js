/* 1. Grab the elements from the page */
const transaction_form = document.getElementById('transactionForm');
const transaction_list = document.getElementById('transactionList');
const category_list = document.getElementById('categoryList');
const form_error = document.getElementById('formError');

const total_balance = document.getElementById('totalBalance');
const total_income = document.getElementById('totalIncome');
const total_expense = document.getElementById('totalExpense');

/* 2. The data */
/* Load saved transactions, or start with an empty array. */
const all_transaction = JSON.parse(localStorage.getItem("transactions")) || [];

/* Save the array to the browser so it survives a refresh. */
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(all_transaction));
}

/* Turn a number like 1200 into text like "$1,200.00". */
function formatMoney(number) {
    return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/* 3. Show one transaction in the list */
function updateList(type, amount, date, category) {
    const itemEl = document.createElement("li");
    const iconEl = document.createElement("div");
    const detailsEl = document.createElement("div");
    const nameEl = document.createElement("div");
    const dateEl = document.createElement("div");
    const amountEl = document.createElement("div");
    const deleteEl = document.createElement("button");

    itemEl.classList.add("transaction-item");
    iconEl.classList.add("transaction-icon");
    detailsEl.classList.add("transaction-details");
    nameEl.classList.add("transaction-name");
    dateEl.classList.add("transaction-date");
    amountEl.classList.add("transaction-amount");
    deleteEl.classList.add("transaction-delete");

    iconEl.innerText = type === "Income" ? "↑" : "↓";
    iconEl.classList.add(type === "Income" ? "income" : "expense");

    nameEl.innerText = category;
    dateEl.innerText = new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });

    amountEl.innerText = (type === "Income" ? "+" : "-") + formatMoney(Number(amount));
    amountEl.classList.add(type === "Income" ? "income" : "expense");

    deleteEl.innerText = "✕";
    deleteEl.setAttribute("aria-label", "Delete " + category);
    deleteEl.addEventListener("click", deleteTransaction);

    detailsEl.appendChild(nameEl);
    detailsEl.appendChild(dateEl);
    itemEl.appendChild(iconEl);
    itemEl.appendChild(detailsEl);
    itemEl.appendChild(amountEl);
    itemEl.appendChild(deleteEl);

    transaction_list.prepend(itemEl);
}

/* 4. Delete a transaction */
function deleteTransaction(event) {
    const btn = event.currentTarget;
    const itemEl = btn.closest(".transaction-item");

    const index = Array.from(transaction_list.children).indexOf(itemEl);
    all_transaction.splice(index, 1);
    itemEl.remove();

    updateBalance();
    updateCategories();
    saveTransactions();
}

/* 5. Recalculate the three totals */
function updateBalance() {
    let income = 0;
    let expense = 0;

    all_transaction.forEach((transaction) => {
        if (transaction.type === "Income") {
            income += Number(transaction.amount);
        } else {
            expense += Number(transaction.amount);
        }
    });

    total_balance.innerText = formatMoney(income - expense);
    total_income.innerText = formatMoney(income);
    total_expense.innerText = formatMoney(expense);
}

/* 6. Spending by category */
function updateCategories() {
    const totals = {};
    let all_spending = 0;

    /* Add up the expenses for each category. */
    all_transaction.forEach((transaction) => {
        if (transaction.type === "Expense") {
            const name = transaction.category.trim().toLowerCase();
            const amount = Number(transaction.amount);

            totals[name] = (totals[name] || 0) + amount;
            all_spending += amount;
        }
    });

    /* Biggest category first. */
    const names = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);

    /* Clear the old rows, then build a new row for each category. */
    category_list.innerHTML = "";

    names.forEach((name) => {
        const rowEl = document.createElement("li");
        const nameEl = document.createElement("div");
        const amountEl = document.createElement("div");
        const barEl = document.createElement("div");
        const fillEl = document.createElement("div");

        rowEl.classList.add("category-row");
        nameEl.classList.add("category-name");
        amountEl.classList.add("category-amount");
        barEl.classList.add("category-bar");
        fillEl.classList.add("category-fill");

        nameEl.innerText = name;
        amountEl.innerText = formatMoney(totals[name]);

        /* The bar's width is this category's share of all spending. */
        fillEl.style.width = (totals[name] / all_spending) * 100 + "%";

        barEl.appendChild(fillEl);
        rowEl.appendChild(nameEl);
        rowEl.appendChild(amountEl);
        rowEl.appendChild(barEl);

        category_list.appendChild(rowEl);
    });
}

/* 7. When the form is submitted */
transaction_form.addEventListener("submit", function(event) {
    event.preventDefault();

    const type = event.target.type.value;
    const amount = Number(event.target.amount.value);
    const date = event.target.date.value;
    const category = event.target.category.value.trim();

    /* Validation: stop here if something is wrong. */
    if (isNaN(amount) || amount <= 0) {
        form_error.innerText = "Enter an amount greater than 0, using numbers only.";
        return;
    }

    if (date === "" || category === "") {
        form_error.innerText = "Choose a date and enter a category.";
        return;
    }

    form_error.innerText = "";

    updateList(type, amount, date, category);
    all_transaction.unshift({ type, amount, date, category });

    updateBalance();
    updateCategories();
    saveTransactions();

    transaction_form.reset();
});

/* 8. When the page first loads */
/* Show the saved transactions, oldest first so the newest ends up on top. */
[...all_transaction].reverse().forEach((transaction) => {
    updateList(transaction.type, transaction.amount, transaction.date, transaction.category);
});
updateBalance();
updateCategories();