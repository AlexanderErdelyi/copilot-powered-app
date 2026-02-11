import http.client
import json

def make_request(method, path, body=None):
    conn = http.client.HTTPConnection('localhost', 5002)
    headers = {'Content-Type': 'application/json'} if body else {}
    
    body_data = json.dumps(body) if body else None
    conn.request(method, path, body_data, headers)
    
    response = conn.getresponse()
    data = response.read().decode()
    
    try:
        return response.status, json.loads(data)
    except:
        return response.status, data

# Get shopping lists
print('📋 Fetching shopping lists...')
status, lists = make_request('GET', '/api/shopping-lists')

if not lists:
    # Create a new list
    print('➕ Creating new shopping list...')
    status, new_list = make_request('POST', '/api/shopping-lists', {'name': 'My Shopping List'})
    list_id = new_list['id']
    print(f'✅ Created list with ID: {list_id}')
else:
    # Use the first list
    list_id = lists[0]['id']
    print(f'✅ Using existing list ID: {list_id}')

# Items to add
items = ['banana', 'kefir', 'mug', 'potato', 'onion']

print(f'\n🛒 Adding {len(items)} items to shopping list...')
for item_name in items:
    status, response = make_request('POST', f'/api/shopping-lists/{list_id}/items', {
        'itemName': item_name,
        'quantity': 1
    })
    
    if status == 201:
        print(f'✅ Added: {item_name}')
    else:
        print(f'❌ Failed to add {item_name}: {response}')

# Get the updated list
print('\n📋 Final shopping list:')
status, final_list = make_request('GET', f'/api/shopping-lists/{list_id}')
print(json.dumps(final_list, indent=2))
