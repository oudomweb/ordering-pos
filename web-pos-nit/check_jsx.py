import re

with open(r'c:\Users\pongc\Desktop\PO_System\pos-coffee\web-pos-nit\src\component\layout\MainLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Simple tag counter
tags = re.findall(r'<([a-zA-Z0-9]+)|</([a-zA-Z0-9]+)>', content)
open_tags = {}
for ot, ct in tags:
    if ot:
        open_tags[ot] = open_tags.get(ot, 0) + 1
    if ct:
        open_tags[ct] = open_tags.get(ct, 0) - 1

print("Tag balances:", {k: v for k, v in open_tags.items() if v != 0})

# Braces
print("Braces:", content.count('{') - content.count('}'))
print("Parens:", content.count('(') - content.count(')'))
