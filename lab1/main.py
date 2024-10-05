import requests
from bs4 import BeautifulSoup

# Task 1: Select website and make an HTTP GET request
url = 'http://books.toscrape.com/'
response = requests.get(url)

# Checking if the response is valid
if response.status_code == 200:
    print("Successfully retrieved the webpage")
    print(f"Content type: {response.headers['Content-Type']}")
else:
    print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
    exit()

# Task 2: Using an HTML parser its extracting the name and price of the products
soup = BeautifulSoup(response.text, 'html.parser')

products = []
for product in soup.find_all('article', class_='product_pod'):
    name = product.h3.a['title']
    price = product.find('p', class_='price_color').text
    products.append({'name': name, 'price': price})

# Print the extracted products
for product in products:
    print(f"Name: {product['name']}")
    print(f"Price: {product['price']}")
    print("---")