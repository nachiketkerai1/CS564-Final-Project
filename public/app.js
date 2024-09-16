document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('queryForm');
  const output = document.getElementById('output');

  form.addEventListener('submit', function(event) {
    event.preventDefault();
    const queryType = document.getElementById('queryType').value;
    
    fetch('http://localhost:3000/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: queryType })
    })
    .then(response => response.json())
    .then(data => {
      output.innerHTML = JSON.stringify(data, null, 2);
    })
    .catch(error => console.error('Error:', error));
  });
});
