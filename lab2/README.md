# CRUD

## GET All Products

```
GET http://localhost:3000/api/products
```

## GET Product by ID

```
GET http://localhost:3000/api/products/1
```

## GET Products by Name

```
GET http://localhost:3000/api/products?name=book
```

## GET Products by Price Range

```
GET http://localhost:3000/api/products?minPrice=10&maxPrice=50
```

## Create Product (POST)

```
POST http://localhost:3000/api/products
Headers:
Content-Type: application/json

Body:
{
    "name": "Test Book",
    "price": 19.99,
    "link": "/test-book",
    "description": "A test book description",
    "availability": "In stock",
    "currency": "GBP"
}
```

## Update Product (PUT)

```
PUT http://localhost:3000/api/products/1
Headers:
Content-Type: application/json

Body:
{
    "price": 29.99,
    "availability": "Out of stock"
}
```

## Delete Product (DELETE)

```
DELETE http://localhost:3000/api/products/1
```

3. Add Tests to your requests:

For GET requests:

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(Array.isArray(jsonData)).to.be.true;
});

pm.test("Products have required fields", function () {
  var jsonData = pm.response.json();
  if (Array.isArray(jsonData)) {
    jsonData.forEach(function (product) {
      pm.expect(product).to.have.property("id");
      pm.expect(product).to.have.property("name");
      pm.expect(product).to.have.property("price");
      pm.expect(product).to.have.property("link");
    });
  }
});
```

For POST request:

```javascript
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Product is created with correct data", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.name).to.eql("Test Book");
  pm.expect(jsonData.price).to.eql(19.99);
  pm.expect(jsonData.currency).to.eql("GBP");
});

// Store the created product ID for later use
if (pm.response.code === 201) {
  pm.environment.set("productId", pm.response.json().id);
}
```

For PUT request:

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Product is updated correctly", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.price).to.eql(29.99);
  pm.expect(jsonData.availability).to.eql("Out of stock");
});
```

For DELETE request:

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Verify product is deleted
pm.test("Product is deleted", function () {
  pm.expect(pm.response.json().message).to.eql("Product deleted");
});
```

4. Create an Environment:

- Click "Environments" in Postman
- Create a new environment called "Local"
- Add these variables:

```
BASE_URL: http://localhost:3000
productId: (leave empty, will be set by tests)
```

# Pagination

// Examples of API calls

// Get paginated products
fetch('/api/products?page=1&pageSize=10')

// Search with pagination
fetch('/api/products?name=book&page=1&pageSize=5')

// Filter with pagination
fetch('/api/products?minPrice=10&maxPrice=50&currency=GBP&page=2&pageSize=5')

// Get single product
fetch('/api/products/1')

// Update product
fetch('/api/products/1', {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ price: 29.99 })
})

// Delete product
fetch('/api/products/1', { method: 'DELETE' })
