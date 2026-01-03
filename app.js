function createProfile() {
  const name = document.getElementById("name").value;
  const birthdate = document.getElementById("birthdate").value;
  const birthplace = document.getElementById("birthplace").value;

  document.getElementById("output").innerHTML = `
    <h2>Welcome, ${name}</h2>
    <p>This is your 2026 workbook.</p>
    <p><strong>Birthdate:</strong> ${birthdate}</p>
    <p><strong>Birthplace:</strong> ${birthplace}</p>
    <p>Astrology, numerology, and identity tools will appear here.</p>
  `;
}
