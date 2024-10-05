import requests
from bs4 import BeautifulSoup
import re

class Product:
    def __init__(self, name, price, link, description=None, availability=None):
        self.name = name
        self.price = price
        self.link = link
        self.description = description
        self.availability = availability

def validate_price(price):
    price_value = re.sub(r'[Â£,]', '', price)
    try:
        return float(price_value)
    except ValueError:
        return None
    
def validate_name(name):
    return name and len(name.strip()) > 3

base_url = 'http://books.toscrape.com/'
response = requests.get(base_url)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    products = []
    for product in soup.find_all('article', class_='product_pod'):
        name = product.h3.a['title']
        price = product.find('p', class_='price_color').text
        link = product.h3.a['href']

        if validate_name(name) and (validated_price := validate_price(price)) is not None:
            products.append(Product(name, validated_price, link))
        else:
            print(f"Invalid product: {name} - {price}")

    def scrape_product_data(product_link):
        response = requests.get(base_url + product_link)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            description = soup.find('meta', {'name': 'description'})['content']
            availability = soup.find('p', class_='instock availability').text.strip()
            return description, availability
        else:
            return None, None

    for product in products:
        description, availability = scrape_product_data(product.link)
        if description and availability:
            product.description = description
            product.availability = availability

    # Print the data
    for product in products:
        print(f"Name: {product.name}")
        print(f"Price: £{product.price:.2f}")
        print(f"Link: {product.link}")
        print(f"Description: {product.description[:100] if product.description else 'N/A'}...")
        print(f"Availability: {product.availability if product.availability else 'N/A'}")
        print("---")
else:
    print(f"Failed to retrieve the webpage. Status code: {response.status_code}")