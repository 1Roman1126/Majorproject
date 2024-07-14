// AWS SDK Configuration
//project
AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:8059f8ce-6b06-4913-96aa-c63ce3cda46e'
    })
});

const s3 = new AWS.S3();

document.addEventListener('DOMContentLoaded', function () {
    fetchLatestCsv().then(data => {
        createPriceChart(data);
        createTradeChart(data);
        createMarketChart(data);
    }).catch(error => {
        console.error('Error fetching or parsing CSV:', error);
    });
});

async function fetchLatestCsv() {
    let date = new Date();
    for (let i = 0; i < 7; i++) {  // Try the last 7 days
        let dateString = date.toISOString().split('T')[0];  // Formats to "YYYY-MM-DD"
        let key = `nepse_data_${dateString}.csv`;
        try {
            const data = await fetchCsv(key);
            console.log(`Successfully fetched data for ${dateString}`);
            return data;
        } catch (error) {
            console.error(`No data available for ${dateString}:`, error.message);
            date.setDate(date.getDate() - 1);  // Go to the previous day
        }
    }
    throw new Error('No available CSV files found in the past week.');
}

function fetchCsv(key) {
    const params = {
        Bucket: 'minorproject-forbes',
        Key: key
    };

    return new Promise((resolve, reject) => {
        s3.getObject(params, function(err, data) {
            if (err) {
                reject(new Error(`Failed to fetch ${key} from S3: ${err.message}`));
            } else {
                const csvData = new TextDecoder("utf-8").decode(data.Body).replace(/^\uFEFF/, '');
                Papa.parse(csvData, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: results => resolve(results.data),
                    error: err => reject(new Error(`Parsing error: ${err.message}`))
                });
            }
        });
    });
}

function createPriceChart(data) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.SECURITY_NAME),
            datasets: [{
                label: 'Open Price',
                data: data.map(item => item.OPEN_PRICE),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'High Price',
                data: data.map(item => item.HIGH_PRICE),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }, {
                label: 'Low Price',
                data: data.map(item => item.LOW_PRICE),
                borderColor: 'rgb(255, 205, 86)',
                tension: 0.1
            }, {
                label: 'Close Price',
                data: data.map(item => item.CLOSE_PRICE),
                borderColor: 'rgb(201, 203, 207)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function createTradeChart(data) {
    const ctx = document.getElementById('tradeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.SECURITY_NAME),
            datasets: [{
                label: 'Total Traded Quantity',
                data: data.map(item => item.TOTAL_TRADED_QUANTITY),
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }, {
                label: 'Total Trades',
                data: data.map(item => item.TOTAL_TRADES),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createMarketChart(data) {
    const ctx = document.getElementById('marketChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.SECURITY_NAME),
            datasets: [{
                label: 'Market Capitalization',
                data: data.map(item => item.MARKET_CAPITALIZATION),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
//update in progress
