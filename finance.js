
// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionList = document.getElementById('transactionList');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const netBalanceEl = document.getElementById('netBalance');
const dateInput = document.getElementById('date');
const clearAllButton = document.getElementById('clearAllButton');
const expenseChartCanvas = document.getElementById('expenseChart');
let expenseChart; // To hold the chart instance

// Initialize transactions array from localStorage or empty
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Set default date to today
dateInput.valueAsDate = new Date();

// Function to generate unique ID
function generateID() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    if (description === '' || isNaN(amount) || amount <= 0 || date === '') {
        // Basic validation, can be improved with specific messages
        alert('Please fill in all fields correctly.');
        return;
    }

    const transaction = {
        id: generateID(),
        type,
        description,
        amount,
        category,
        date
    };

    transactions.push(transaction);
    updateLocalStorage();
    renderTransactions();
    updateSummary();
    renderExpenseChart();
    transactionForm.reset();
    dateInput.valueAsDate = new Date(); // Reset date to today after submission
}

// Delete transaction by ID
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    renderTransactions();
    updateSummary();
    renderExpenseChart();
}

// Clear All Transactions
function clearAllTransactions() {
    if (confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
        transactions = [];
        updateLocalStorage();
        renderTransactions();
        updateSummary();
        renderExpenseChart();
    }
}

// Render transactions in the DOM
function renderTransactions() {
    transactionList.innerHTML = ''; // Clear existing list

    if (transactions.length === 0) {
        transactionList.innerHTML = '<p class="text-gray-500 text-center py-4">No transactions yet. Add some to get started!</p>';
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));


    sortedTransactions.forEach(transaction => {
        const item = document.createElement('div');
        item.classList.add('transaction-item');

        const amountClass = transaction.type === 'income' ? 'amount-income' : 'amount-expense';
        const sign = transaction.type === 'income' ? '+' : '-';

        item.innerHTML = `
            <div class="transaction-details">
                <p class="font-semibold text-gray-800">${transaction.description} <span class="transaction-category">${transaction.category}</span></p>
                <p class="text-sm text-gray-500">${new Date(transaction.date).toLocaleDateString()}</p>
            </div>
            <div class="flex items-center">
                <p class="${amountClass} mr-4 text-lg">${sign}$${transaction.amount.toFixed(2)}</p>
                <button onclick="deleteTransaction('${transaction.id}')" class="btn btn-danger btn-sm p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        `;
        transactionList.appendChild(item);
    });
}

// Update balance, income, and expense summary
function updateSummary() {
    const amounts = transactions.map(transaction => transaction.amount);

    const totalIncome = transactions
        .filter(transaction => transaction.type === 'income')
        .reduce((acc, transaction) => acc + transaction.amount, 0);

    const totalExpenses = transactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((acc, transaction) => acc + transaction.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    totalIncomeEl.textContent = `$${totalIncome.toFixed(2)}`;
    totalExpensesEl.textContent = `$${totalExpenses.toFixed(2)}`;
    netBalanceEl.textContent = `$${netBalance.toFixed(2)}`;

    if (netBalance < 0) {
        netBalanceEl.classList.remove('text-blue-500', 'text-green-500');
        netBalanceEl.classList.add('text-red-500');
    } else if (netBalance > 0) {
        netBalanceEl.classList.remove('text-blue-500', 'text-red-500');
        netBalanceEl.classList.add('text-green-500');
    } else {
        netBalanceEl.classList.remove('text-green-500', 'text-red-500');
        netBalanceEl.classList.add('text-blue-500');
    }
}

// Render Expense Chart
function renderExpenseChart() {
    const expenseData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});

    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);

    if (expenseChart) {
        expenseChart.destroy(); // Destroy existing chart before creating a new one
    }
    
    if (labels.length === 0) {
         document.getElementById('expenseChartContainer').innerHTML = '<p class="text-gray-500 text-center py-4">No expense data to display in chart.</p>';
         return;
    } else {
         // Ensure canvas is there if it was removed
         if (!document.getElementById('expenseChart')) {
            document.getElementById('expenseChartContainer').innerHTML = '<canvas id="expenseChart"></canvas>';
         }
    }


    const ctx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctx, {
        type: 'bar', // Can be 'pie', 'doughnut', 'bar', etc.
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses by Category',
                data: data,
                backgroundColor: [ // Add more colors if you have more categories
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)',
                    'rgba(83, 102, 255, 0.7)',
                    'rgba(40, 159, 64, 0.7)',
                    'rgba(210, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(83, 102, 255, 1)',
                    'rgba(40, 159, 64, 1)',
                    'rgba(210, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                     callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}


// Update localStorage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Initial render on page load
function init() {
    renderTransactions();
    updateSummary();
    renderExpenseChart();
}

// Event Listeners
transactionForm.addEventListener('submit', addTransaction);
clearAllButton.addEventListener('click', clearAllTransactions);

// Initialize the app
init();