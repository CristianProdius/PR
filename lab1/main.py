import requests
from bs4 import BeautifulSoup

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
        products.append({'name': name, 'price': price, 'link': link})

    
    # Function to scrape the product data futher
    def scrape_product_data(product_link):
        response = requests.get(base_url + product_link)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            description = soup.find('meta', {'name': 'description'})['content']
            availability = soup.find('p', class_='instock availability').text.strip()
            return {'description': description, 'availability': availability}
        else:
            return None

    for product in products:
        data = scrape_product_data(product['link'])
        if data:
            product.update(data)

    # Printts the data
    for product in products:
        print(f"Name: {product['name']}")
        print(f"Price: {product['price']}")
        print(f"Link: {product['link']}")
        print(f"Description: {product['description'][:100]}...")  #here is only the firs100 characters
        print(f"Availability: {product['availability']}")
        print("---")
else:
    print(f"Failed to retrieve the webpage. Status code: {response.status_code}")