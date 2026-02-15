const http = require('http');

async function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5100,
            path: path,
            method: method,
            headers: body ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(body))
            } : {}
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function addItems() {
    try {
        // Get shopping lists
        console.log('📋 Fetching shopping lists...');
        const listsResponse = await makeRequest('GET', '/api/shopping-lists');
        
        let listId;
        if (listsResponse.data.length === 0) {
            // Create a new list
            console.log('➕ Creating new shopping list...');
            const createResponse = await makeRequest('POST', '/api/shopping-lists', {
                name: 'My Shopping List'
            });
            listId = createResponse.data.id;
            console.log(`✅ Created list with ID: ${listId}`);
        } else {
            // Use the first list
            listId = listsResponse.data[0].id;
            console.log(`✅ Using existing list ID: ${listId}`);
        }

        // Items to add
        const items = ['banana', 'kefir', 'mug', 'potato', 'onion'];
        
        console.log(`\n🛒 Adding ${items.length} items to shopping list...`);
        for (const itemName of items) {
            const response = await makeRequest('POST', `/api/shopping-lists/${listId}/items`, {
                itemName: itemName,
                quantity: 1
            });
            
            if (response.status === 201) {
                console.log(`✅ Added: ${itemName}`);
            } else {
                console.log(`❌ Failed to add ${itemName}: ${JSON.stringify(response.data)}`);
            }
        }

        // Get the updated list
        console.log('\n📋 Final shopping list:');
        const finalResponse = await makeRequest('GET', `/api/shopping-lists/${listId}`);
        console.log(JSON.stringify(finalResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

addItems();
