const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
//app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// MySQL connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'staywellnycdb'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database');
});

// Define a route to fetch data
app.get('/', (req, res) => {
  connection.query('SELECT DISTINCT borough FROM property', (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StayWellNYC</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>StayWellNYC</h1>
    <form action="/properties" method="post">
      <label for="boroughType">Choose a borough:</label>
      <select name="borough">
`;

    let response = htmlContent;

    results.forEach((borough) => {
      response += '<option value =\"' + borough.borough + '\">' + borough.borough + '</option>';
    });

    const htmlContent2 = `
</select>
      <label for="accomodates">Number of guests:</label>
      <select name="accomodates">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
      <option value="8">8</option>
      <option value="9">9</option>
      <option value="10">10</option>
      </select>
      <label for="rating">Rating:</label>
      <input type="number" step="0.1" id="rating" name="rating"><br><br>
      <input type="submit" value="submit">
    </form>
    <pre id="output"></pre>
  </div>
  <script src="app.js"></script>
</body>
</html>
`;

    response += htmlContent2;

    res.send(response);
  });
});

app.post('/properties', (req, res) => {
  const borough = req.body.borough;
  const guests = req.body.accomodates;
  const rating = req.body.rating;

  const query = `
    SELECT p.name, o.host_name, p.listing_url, p.neighborhood, o.host_id, p.rating, p.accommodates
    FROM property p 
    JOIN owns w ON p.id = w.property_id 
    JOIN owner o ON w.host_id = o.host_id 
    WHERE p.borough = ? AND o.host_name IS NOT NULL AND p.accommodates >= ? AND p.rating >= ?
    LIMIT 100
  `;

  connection.query(query, [borough, guests, rating], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    let htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Requested Properties</title>
  <link rel="stylesheet" href="/styles.css"> <!-- Link to your CSS file -->
</head>
<body>
<div id="app">
  <h2>Requested Properties</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Property Name</th>
          <th>Host Name</th>
          <th>Airbnb Listing URL</th>
          <th>Property Neighborhood</th>
          <th>Rating</th>
          <th>Guests</th>
        </tr>
      </thead>
      <tbody>
`;

    results.forEach((propertyInfo) => {
      htmlPage += `
        <tr>
          <td>${propertyInfo.name}</td>
          <td><a href="/host/${propertyInfo.host_id}" target="_blank">${propertyInfo.host_name}</a></td>
          <td><a href="${propertyInfo.listing_url}" target="_blank">${propertyInfo.listing_url}</a></td>
          <td>${propertyInfo.neighborhood}</td>
          <td>${propertyInfo.rating}</td>
          <td>${propertyInfo.accommodates}</td>
        </tr>
`;
    });

    htmlPage += `
      </tbody>
    </table>
  </div>
</div>
</body>
</html>
`;

    res.send(htmlPage);
  });
});

app.get('/host/:host_id', (req, res) => {
  const host_id = req.params.host_id;

  const query = `
 SELECT 
    p.id,
    p.name, 
    p.description, 
    p.neighborhood, 
    p.borough, 
    p.rating, 
    p.price, 
    p.listing_url,
    o.host_name
  FROM 
    Property p
  JOIN 
    Owns w 
  ON 
    w.property_id = p.id 
  JOIN 
    Owner o
  ON 
    o.host_id = w.host_id
  WHERE 
    w.host_id = ?;
`;

  connection.query(query, [host_id], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    let host_name = '';
    if (results.length > 0){
      host_name = results[0];
    }
    let htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${host_name}</title>
  <link rel="stylesheet" href="/styles.css"> <!-- Link to your CSS file -->
</head>
<body>
<div id="app">
  <h2>${host_name.host_name}</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Property Name</th>
          <th>Description</th>
          <th>Property Neighborhood</th>
          <th>Borough</th>
          <th>Rating</th>
          <th>Price</th>
          <th>Listing URL</th>
          <th>Reviews</th>
          <th>Renter List</th>
        </tr>
      </thead>
      <tbody>
`;

    results.forEach((propertyInfo) => {
      htmlPage += `
        <tr>
          <td>${propertyInfo.name}</td>
          <td>${propertyInfo.description}</td>
          <td>${propertyInfo.neighborhood}</td>
          <td>${propertyInfo.borough}</td>
          <td>${propertyInfo.rating}</td>
          <td>${propertyInfo.price}</td>
          <td><a href="${propertyInfo.listing_url}" target="_blank">${propertyInfo.listing_url}</a></td>
          <td><a href="/reviews/${propertyInfo.id}" target="_blank">Click here to view reviews</a></td>
          <td><a href="/renters/${propertyInfo.id}" target="_blank">Click here to view previous renters</a></td>
        </tr>
`;
    });

    htmlPage += `
      </tbody>
    </table>
  </div>
</div>
</body>
</html>
`;

    res.send(htmlPage);
  });
});

app.get('/reviews/:id', (req, res) => {
  const property_id = req.params.id;

  const query = `
  SELECT 
    p.id, 
    p.name, 
    r.reviewId, 
    r.date, 
    r.rating, 
    r.description 
  FROM 
    reviews r
  JOIN 
    has h 
  ON 
    r.reviewId = h.review_id 
  JOIN 
    property p 
  ON 
    p.id = h.listing_id 
  WHERE 
    h.listing_id = ?;
`;
  const query2 = `
    SELECT name FROM property WHERE id = ?;
  `;

  let propertyName = '';
  connection.query(query2, [property_id], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    if (results.length > 0){
      propertyName = results[0];
    }
  });

  connection.query(query, [property_id], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    let htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Requested Properties</title>
  <link rel="stylesheet" href="/styles.css"> <!-- Link to your CSS file -->
</head>
<body>
<div id="app">
  <h2>${propertyName.name} Reviews</h2>
  <form action="/review" method="post">
    <label for="rating">Rating:</label>
    <input type="number" step="0.1" id="rating" name="rating"><br><br>
    <label for="description">Description:</label>
    <textarea id="description" name="description" rows="4" cols="50"></textarea><br><br>
    <label for="date">Date:</label>
    <input type="date" id="date" name="date"><br><br>
    <input type="hidden" id="propertyId" name="propertyId" value=${property_id}>
    <input type="submit" value="Submit">
  </form>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Rating</th>
          <th>Description</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
`;

    results.forEach((reviewInfo) => {
      htmlPage += `
        <tr>
          <td>${reviewInfo.rating}</td>
          <td>${reviewInfo.description}</td>
          <td>${reviewInfo.date.toDateString()}</td>
        </tr>
`;
    });

    htmlPage += `
      </tbody>
    </table>
  </div>
</div>
</body>
</html>
`;

    res.send(htmlPage);
  });
});

app.get('/renters/:id', (req, res) => {
  const property_id = req.params.id;

  const query = `
  SELECT 
    r.email, 
    r.name, 
    r.phoneNumer 
  FROM 
    renter r
  JOIN 
    rents rs 
  ON 
    r.email = rs.emailAddress
  JOIN 
    property p 
  ON 
    rs.propertyId = p.id
  WHERE 
    rs.propertyId = ?;
`;

  const query2 = `
    SELECT name FROM property WHERE id = ?;
  `;

  let propertyName = '';
  connection.query(query2, [property_id], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    if (results.length > 0){
      propertyName = results[0];
    }
  });

  connection.query(query, [property_id], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
      return;
    }

    let htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Requested Properties</title>
  <link rel="stylesheet" href="/styles.css"> <!-- Link to your CSS file -->
</head>
<body>
<div id="app">
  <h2>${propertyName.name} Renter Info</h2>
  <form action="/renter" method="post">
    <label for="email">Email Address:</label>
    <input type="text" id="email" name="email"><br><br>
    <label for="name">First and Last Name:</label>
    <input type="text" id="name" name="name"><br><br>
    <label for="phoneNumber">Phone Number:</label>
    <input type="text" id="phoneNumber" name="phoneNumber"><br><br>
    <label for="maxPrice">Max Price Per Night:</label>
    <input list="maxPrice" name="maxPrice">
    <datalist id="maxPrice">
      <option value="50">
      <option value="100">
      <option value="150">
      <option value="200">
      <option value="250">
      <option value="300">
      <option value="350">
      <option value="400">
      <option value="450">
      <option value="500">
    </datalist><br><br>
    <label for="numBed">Preferred number of bedrooms:</label>
    <input list="numBed" name="numBed">
    <datalist id="numBed">
      <option value="1">
      <option value="2">
      <option value="3">
      <option value="4">
      <option value="5">
      <option value="6">
      <option value="7">
      <option value="8">
      <option value="9">
      <option value="10">
    </datalist><br><br>
    <label for="numBath">Preferred number of bathrooms:</label>
    <input list="numBath" name="numBath">
    <datalist id="numBath">
      <option value="1">
      <option value="2">
      <option value="3">
      <option value="4">
      <option value="5">
      <option value="6">
      <option value="7">
      <option value="8">
      <option value="9">
      <option value="10">
    </datalist><br><br>
    <label for="numRenters">Number of guests:</label>
    <input list="numRenters" name="numRenters">
    <datalist id="numRenters">
      <option value="1">
      <option value="2">
      <option value="3">
      <option value="4">
      <option value="5">
      <option value="6">
      <option value="7">
      <option value="8">
      <option value="9">
      <option value="10">
    </datalist><br><br>
    <input type="hidden" id="propertyId" name="propertyId" value=${property_id}>
    <input type="submit" value="Submit">
  </form>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone Number</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
`;

    results.forEach((renterInfo) => {
      htmlPage += `
        <tr>
          <td>${renterInfo.name}</td>
          <td>${renterInfo.phoneNumer}</td>
          <td>${renterInfo.email}</td>
        </tr>
`;
    });

    htmlPage += `
      </tbody>
    </table>
  </div>
</div>
</body>
</html>
`;

    res.send(htmlPage);
  });
});

app.post('/renter', (req, res) => {
  const propertyId = req.body.propertyId;
  const email = req.body.email;
  const name = req.body.name;
  const phoneNumber = req.body.phoneNumber;
  const maxPrice = req.body.maxPrice;
  const numBed = req.body.numBed;
  const numBath = req.body.numBath;
  const numRenters = req.body.numRenters;

  console.log(propertyId);
  console.log(email);
  console.log(name);
  console.log(phoneNumber);
  console.log(maxPrice);
  console.log(numBed);
  console.log(numBath);
  console.log(numRenters);

  const query = `
    INSERT INTO renter (email, name, phoneNumer, maxPrice, numBed, numBath, numRenters)
VALUES (?, ?, ?, ?, ?, ?, ?);
  `;

  const query2 = 'INSERT INTO rents (propertyId, emailAddress) VALUES (?, ?);';

  connection.query(query, [email, name, phoneNumber, maxPrice, numBed, numBath, numRenters], (err, results) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('Error inserting data');
      return;
    }
  });

  connection.query(query2, [propertyId, email], (err, results) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('Error inserting data');
      return;
    }
  });
  
  res.writeHead(302, {
    location: "/renters/"+propertyId,
  });
  res.end();
});

app.post('/review', (req, res) => {
  const propertyId = req.body.propertyId;
  const date = req.body.date;
  const rating = req.body.rating;
  const description = req.body.description;

  console.log(propertyId);
  console.log(date);
  console.log(rating);
  console.log(description);

  connection.query(
    'CALL InsertReviewAndHas(?, ?, ?, ?)', 
    [propertyId, date, rating, description], (err, results) =>{
    if (err) {
      console.error('Error inserting data:', err);         
      res.status(500).send('Error inserting data');        
      return;
    }
  });

  res.writeHead(302, {
    location: "/reviews/"+propertyId,
  });
  res.end();
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
