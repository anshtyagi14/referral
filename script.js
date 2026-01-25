const ROLES_JSON_URL = "./roles.json";
const POSTAL_API_URL = "https://api.postalpincode.in/pincode/";

const form = document.getElementById("referralForm");
const expYears = document.getElementById("expYears");
const expMonths = document.getElementById("expMonths");
const roleSelect = document.getElementById("role");
const roleHelp = document.getElementById("roleHelp");
const postalCodeInput = document.getElementById("postalCode");
const cityInput = document.getElementById("city");
const resumeFileInput = document.getElementById("resumeFile");
const submitBtn = document.getElementById("submitBtn");
const successModal = document.getElementById("successModal");
const messageDiv = document.getElementById("message");

let rolesData = [];

document.addEventListener("DOMContentLoaded", async () => {
  populateExperience();
  await loadRoles();
  attachEvents();
});

function populateExperience() {
  for (let i = 0; i <= 30; i++) {
    expYears.add(new Option(`${i} Years`, i));
  }
  for (let i = 0; i <= 11; i++) {
    expMonths.add(new Option(`${i} Months`, i));
  }
}

async function loadRoles() {
  const res = await fetch(ROLES_JSON_URL);
  const data = await res.json();
  rolesData = data.roles;
}

function attachEvents() {
  expYears.addEventListener("change", updateRoles);
  expMonths.addEventListener("change", updateRoles);
  postalCodeInput.addEventListener("blur", verifyPostal);
  form.addEventListener("submit", handleSubmit);
}

function updateRoles() {
  const totalMonths = (+expYears.value * 12) + (+expMonths.value);
  roleSelect.innerHTML = `<option value="">Select role</option>`;

  const eligible = rolesData.filter(r =>
    totalMonths >= r.minExperienceMonths && totalMonths <= r.maxExperienceMonths
  );

  if (!eligible.length) {
    roleSelect.disabled = true;
    roleHelp.textContent = "No roles available";
    return;
  }

  roleSelect.disabled = false;
  eligible.forEach(r => {
    roleSelect.add(new Option(r.name, r.name));
  });
}

async function verifyPostal() {
  const pin = postalCodeInput.value;
  const res = await fetch(`${POSTAL_API_URL}${pin}`);
  const data = await res.json();

  if (data[0].Status === "Success") {
    cityInput.value = data[0].PostOffice[0].District;
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  submitBtn.disabled = true;
  messageDiv.textContent = "Submitting...";
  messageDiv.style.display = "block";

  const fullName =
    document.getElementById("firstName").value +
    " " +
    document.getElementById("lastName").value;

  document.getElementById("fullName").value = fullName;
  document.getElementById("phoneHidden").value = "+91" + document.getElementById("phoneInput").value;
  document.getElementById("experienceDisplay").value =
    `${expYears.value} years ${expMonths.value} months`;

  const file = resumeFileInput.files[0];
  const base64 = await toBase64(file);

  document.getElementById("resumeBase64").value = base64;
  document.getElementById("resumeName").value = file.name;
  document.getElementById("resumeType").value = file.type;

  // 🚀 Native submit (NO CORS)
  form.submit();

  successModal.style.display = "block";
  form.reset();
  submitBtn.disabled = false;
}

function toBase64(file) {
  return new Promise(res => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
}

function closeModal() {
  successModal.style.display = "none";
}
