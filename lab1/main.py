import os
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timezone
from functools import reduce
import socket
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import xml.etree.ElementTree as ET

'''
#Request handler class for the HTTP server
class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            # List files in the current directory
            files = os.listdir('.')
            file_list = '<br>'.join(files)
            self.wfile.write(f"Files in the directory:<br>{file_list}".encode())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/upload':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            content_type = self.headers['Content-Type']

            if content_type == 'application/xml':
                try:
                    # Parse XML data
                    root = ET.fromstring(post_data)
                    # Process XML data here
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b"XML data received successfully")
                except ET.ParseError:
                    self.send_error(400, "Invalid XML data")
            elif content_type == 'application/json':
                try:
                    # Parse JSON data
                    json_data = json.loads(post_data)
                    # Process JSON data here
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b"JSON data received successfully")
                except json.JSONDecodeError:
                    self.send_error(400, "Invalid JSON data")
            else:
                self.send_error(415, "Unsupported Media Type")
        else:
            self.send_error(404, "Not Found")
'''

class Product:
    def __init__(self, name, price, link, description=None, availability=None, currency='GBP'):
        self.name = name
        self.price = price
        self.link = link
        self.description = description
        self.availability = availability
        self.currency = currency

    #JSON representation of the object
    def to_json(self):
        json_str = f"""{{
            "name": "{self.name}",
            "price": {self.price},
            "link": "{self.link}",
            "description": "{self.description}" if self.description else "null",
            "availability": "{self.availability}" if self.availability else "null",
            "currency": "{self.currency}"
        }}"""
        return json_str
    
    #XML representation of the object
    def to_xml(self):
        xml_str = f"""
        <product>
        <name>{self.name}</name>
        <price>{self.price}</price>
        <link>{self.link}</link>
        <description>{self.description}</description>
        <availability>{self.availability}</availability>
        <currency>{self.currency}</currency>
        </product>
        """
        return xml_str
    
    #Serialization of the object
    def serialize(self):
        # Convert the Product object to a string representation
        # Format: "Product:name:price:link:description:availability:currency"
        return f"Product:{self.name}:{self.price}:{self.link}:{self.description}:{self.availability}:{self.currency}"

    #Deserialization of the object
    @classmethod #class method reciving cls indead of an instance of the class, cla is the clase itself aka Product
    def deserialize(cls, data):
        # Create a Product object from a serialized string
        type_tag, content = data.split(':', 1)
        if type_tag != 'Product':
            raise ValueError(f"Invalid type tag for Product: {type_tag}")
        # Split the content into individual attributes
        name, price, link, description, availability, currency = content.split(':')
        return cls(name, float(price), link, description, availability, currency)

    #Serialization of the object
    @staticmethod
    def serialize_object(obj):
        #Serialize various types of objects
        if isinstance(obj, Product):
            return obj.serialize()
        elif isinstance(obj, list):
            # For lists, serialize each item and join with commas
            return f"List:{','.join(Product.serialize_object(item) for item in obj)}"
        elif isinstance(obj, dict):
             # For dicts, serialize each key-value pair and join with commas
            return f"Dict:{','.join(f'{Product.serialize_object(k)}={Product.serialize_object(v)}' for k, v in obj.items())}"
        elif isinstance(obj, str):
            return f"Str:{obj}"
        elif isinstance(obj, int):
            return f"Int:{obj}"
        elif isinstance(obj, float):
            return f"Float:{obj}"
        elif obj is None:
            return "None:"
        else:
            raise TypeError(f"Type {type(obj)} not serializable")

    #Deserialization of the object
    @staticmethod
    def deserialize_object(data):
        # Deserialize objects based on their type tag
        type_tag, *content = data.split(':', 1)
        content = content[0] if content else ''

        if type_tag == 'Product':
            return Product.deserialize(data)
        elif type_tag == 'List':
            # For lists, split the content and deserialize each item
            return [Product.deserialize_object(item) for item in content.split(',')] if content else []
        elif type_tag == 'Dict':
            # For dicts, split into key-value pairs and deserialize each pair
            return {Product.deserialize_object(k): Product.deserialize_object(v) for k, v in [item.split('=') for item in content.split(',')]} if content else {}
        elif type_tag == 'Str':
            return content
        elif type_tag == 'Int':
            return int(content)
        elif type_tag == 'Float':
            return float(content)
        elif type_tag == 'None':
            return None
        else:
            raise ValueError(f"Unknown type tag: {type_tag}")

    def __str__(self):
        # Provide a readable string representation of the Product object
        return f"Product(name='{self.name}', price={self.price}, link='{self.link}', description='{self.description}', availability='{self.availability}', currency='{self.currency}')"



# Test the serialization and deserialization
def test_serialization():
    # Test with a Product object
    product = Product("Book", 19.99, "/book", "A great book", "In stock")
    serialized_product = product.serialize()
    deserialized_product = Product.deserialize(serialized_product)
    print("Product Test:")
    print(f"Original: {product}")
    print(f"Serialized: {serialized_product}")
    print(f"Deserialized: {deserialized_product}")
    print()
    
    # Test with a list of mixed types
    mixed_list = [1, "two", 3.0, Product("Item", 9.99, "/item")]
    serialized_list = Product.serialize_object(mixed_list)
    deserialized_list = Product.deserialize_object(serialized_list)
    print("List Test:")
    print(f"Original: {mixed_list}")
    print(f"Serialized: {serialized_list}")
    print(f"Deserialized: {deserialized_list}")
    print()

    # Test with a dictionary
    test_dict = {"key1": "value1", "key2": 2, "key3": Product("DictItem", 5.99, "/dictitem")}
    serialized_dict = Product.serialize_object(test_dict)
    deserialized_dict = Product.deserialize_object(serialized_dict)
    print("Dictionary Test:")
    print(f"Original: {test_dict}")
    print(f"Serialized: {serialized_dict}")
    print(f"Deserialized: {deserialized_dict}")
    print()


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

    # Print JSON representation of the first filtered product as an example
    if filtered_products:
        print("\nJSON representation of the first filtered product:")
        print(filtered_products[0].to_json())

    # Print XML representation of the secound filtered product as an example
    if filtered_products:
        print("\nXML representation of the second filtered product:")
        print(filtered_products[1].to_xml())
    
except Exception as e:
    print(f"Failed to retrieve the webpage. Status code: {str(e)}")


# Test the serialization and deserialization
print("idkkk test ")
test_serialization()

'''
def run_server():
    PORT = 8000
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"Server running on port {PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
'''

#this 2 comand to build and run the docker image
#docker build -t lab1-image .
#docker run -p 8000:8000 lab1-image
#http://localhost:8000/ to see the result