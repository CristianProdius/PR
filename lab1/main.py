import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timezone
from functools import reduce

class Product:
    def __init__(self, name, price, link, description=None, availability=None, currency='GBP'):
        self.name = name
        self.price = price
        self.link = link
        self.description = description
        self.availability = availability
        self.currency = currency

def validate_price(price):
    # Remove currency symbol and the comma separator and after that its convering to dlout
    price_value = re.sub(r'[Â£,]', '', price)
    try:
        return float(price_value)
    except ValueError:
        return None

def validate_name(name):
    return name and len(name.strip()) > 3

def convert_currency(price, from_currency, to_currency):
    GBP_TO_MDL_RATE = 23.12
    
    if from_currency == 'GBP' and to_currency == 'MDL':
        return price * GBP_TO_MDL_RATE
    else:
        return price  # here it return original price if conversion not supported

#Base URL of the page to scrape
base_url = 'http://books.toscrape.com/'
response = requests.get(base_url)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    products = []
    for product in soup.find_all('article', class_='product_pod'):
        name = product.h3.a['title']
        price = product.find('p', class_='price_color').text
        link = product.h3.a['href']


         # Validate the name and price of the product
        if validate_name(name) and (validated_price := validate_price(price)) is not None:
            products.append(Product(name, validated_price, link))
        else:
            print(f"Invalid product: {name} - {price}")


    # Function to scrape the product data futher
    def scrape_product_data(product_link):
        response = requests.get(base_url + product_link)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            description = soup.find('meta', {'name': 'description'})['content']
            availability = soup.find('p', class_='instock availability').text.strip()
            return description, availability
        else:
            return None, None

    # Scrape the product data
    for product in products:
        description, availability = scrape_product_data(product.link)
        if description and availability:
            product.description = description
            product.availability = availability

    # Convert prices from GBP to MDL
    def map_currency(product):
        if product.currency == 'GBP':
            product.price = convert_currency(product.price, 'GBP', 'MDL')
            product.currency = 'MDL'
        return product

    products = list(map(map_currency, products))

    # Filter products within a price range
    min_price, max_price = 250, 1000  #MDL PRice range
    filtered_products = list(filter(lambda p: min_price <= p.price <= max_price, products))

    # Sum up the prices of filtered products
    total_price = reduce(lambda acc, p: acc + p.price, filtered_products, 0)

    # Create a new data structure with filtered products, sum, and timestamp
    result = {
        'filtered_products': filtered_products,
        'total_price': total_price,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }

    # Print the results
    print(f"Number of filtered products: {len(result['filtered_products'])}")
    print(f"Total price of filtered products: {result['total_price']:.2f} MDL")
    print(f"Timestamp: {result['timestamp']}")
    print("\nFiltered Products:")
    for product in result['filtered_products']:
        print(f"Name: {product.name}")
        print(f"Price: {product.price:.2f} {product.currency}")
        print(f"Link: {product.link}")
        print(f"Description: {product.description[:100] if product.description else 'N/A'}...")
        print(f"Availability: {product.availability if product.availability else 'N/A'}")
        print("---")
else:
    print(f"Failed to retrieve the webpage. Status code: {response.status_code}")