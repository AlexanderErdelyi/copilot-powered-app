import sqlite3
import sys

conn = sqlite3.connect('receipts.db')
cursor = conn.cursor()

# Get receipts for Feb 6th
cursor.execute("""
    SELECT r.Id, r.Vendor, r.Date, r.TotalAmount 
    FROM Receipts r 
    WHERE date(r.Date) = '2026-02-06' 
    ORDER BY r.Date
""")
receipts = cursor.fetchall()

if not receipts:
    print("No receipts found for February 6th, 2026")
    sys.exit(0)

print(f"Found {len(receipts)} receipt(s) on February 6th, 2026:\n")

for receipt in receipts:
    receipt_id, vendor, date, total = receipt
    print(f"Receipt #{receipt_id}: {vendor}")
    print(f"Date: {date}")
    print(f"Total: {total} EUR")
    
    # Get items for this receipt
    cursor.execute("""
        SELECT Name, Category, Price, Quantity 
        FROM ReceiptItems 
        WHERE ReceiptId = ? 
        ORDER BY Category, Name
    """, (receipt_id,))
    items = cursor.fetchall()
    
    print(f"Items ({len(items)}):")
    for item in items:
        name, category, price, qty = item
        print(f"  - {name} ({category}): {price} EUR x {qty}")
    print()

conn.close()
