import requests

#the website to be scraped
url = "https://999.md"

#here I send a request to the website
response = requests.get(url)

if response.status_code == 200:
    print("The request was successful")
    print("Response cotent typeL",  response.headers['content-type'])
    print("First 200 chars of HTML content: ", response.text[:200])
else:
    print("The request was unsuccessful")
    print("Status code: ", response.status_code)