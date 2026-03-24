const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
    loadStatistics();
    loadLoans();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('syncButton').addEventListener('click', syncLoans);
    document.getElementById('statusFilter').addEventListener('change', loadLoans);
    document.getElementById('searchInput').addEventListener('input', loadLoans);
}

async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        const data = await response.json();
        
        document.getElementById('totalLoans').textContent = data.total_loans;
        document.getElementById('totalAmount').textContent = formatCurrency(data.total_amount);
        document.getElementById('averageLoan').textContent = formatCurrency(data.average_amount);
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadLoans() {
    try {
        const status = document.getElementById('statusFilter').value;
        const url = new URL(`${API_URL}/loans`);
        
        if (status) {
            url.searchParams.append('status', status);
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        displayLoans(data.loans);
    } catch (error) {
        console.error('Error loading loans:', error);
    }
}

function displayLoans(loans) {
    const tbody = document.getElementById('loansTableBody');
    tbody.innerHTML = '';
    
    if (loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No loans found</td></tr>';
        return;
    }
    
    loans.forEach(loan => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${loan.borrower_name}</td>
            <td>${formatCurrency(loan.loan_amount)}</td>
            <td><span class="status-badge status-${loan.loan_status}">${loan.loan_status}</span></td>
            <td>${loan.loan_type}</td>
            <td>${loan.interest_rate ? loan.interest_rate.toFixed(2) + '%' : 'N/A'}</td>
            <td>${loan.term_months || 'N/A'}</td>
            <td><button class="btn-view" onclick="viewLoan(${loan.id})">View</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function syncLoans() {
    try {
        const button = document.getElementById('syncButton');
        button.disabled = true;
        button.textContent = 'Syncing...';
        
        const response = await fetch(`${API_URL}/sync`, { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
            alert('Loans synced successfully!');
            loadLoans();
            loadStatistics();
        } else {
            alert('Failed to sync loans: ' + data.error);
        }
    } catch (error) {
        console.error('Error syncing loans:', error);
        alert('Error syncing loans');
    } finally {
        const button = document.getElementById('syncButton');
        button.disabled = false;
        button.textContent = 'Sync Loans';
    }
}

function viewLoan(loanId) {
    alert('Viewing loan ' + loanId);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}