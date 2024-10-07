import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timezone
from functools import reduce
import socket

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
    

#HTTP requst handle wsing TCP socket
def get_http_response(url):
    # Parse the URL
    protocol, _, host, path = url.split('/', 3)
    path = '/' + path

    # Create a TCP socket
    # using with to ensure closing after the block
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        # Connect to the host
        s.connect((host, 80))
        # Prepare the HTTP GET request
        http_request = f"GET {path} HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n"
        # Send the request
        s.sendall(http_request.encode())
        # Receive the response
        response = b''
        while True:
            data = s.recv(4096)
            if not data:
                break
            response += data

    # Split the response into headers and body
    response = response.decode('utf-8')
    headers, body = response.split('\r\n\r\n', 1)
    return body

#Base URL of the page to scrape
base_url = 'http://books.toscrape.com/'
response = get_http_response(base_url)



try:
    response = get_http_response(base_url)
    soup = BeautifulSoup(response, 'html.parser')
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
        response = get_http_response(base_url + product_link)
        soup = BeautifulSoup(response, 'html.parser')
        description = soup.find('meta', {'name': 'description'})['content'] if soup.find('meta', {'name': 'description'}) else None
        availability = soup.find('p', class_='instock availability').text.strip() if soup.find('p', class_='instock availability') else None
        return description, availability
            

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
except Exception as e:
    print(f"Failed to retrieve the webpage. Status code: {str(e)}")