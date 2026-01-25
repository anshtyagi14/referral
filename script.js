console.log("✅ Referral Portal Script Loaded");

const ROLES_JSON_URL = "./roles.json";
const POSTAL_API_URL = "https://api.postalpincode.in/pincode/";

let rolesData = [];

const form = document.getElementById("referralForm");
const expYears = document.getElementById("expYears");
const expMonths = document.getElementById("expMonths");
const roleSelect = document.getElementById("role");
const roleHelp = document.getElementById("roleHelp");
const postalCodeInput = document.getElementById("postalCode");
const cityInput = document.getElementById("city");
const postalHelp = document.getElementById("postalHelp");
const linkedinInput = document.getElementById("linkedinUrl");
const linkedinHelp = document.getElementById("linkedinHelp");
const resumeFileInput = document.getElementById("resumeFile");
const messageDiv = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const successModal = document.getElementById("successModal");

document.addEventListener("DOMContentLoaded", async () => {
  populateExperienceDropdowns();
  await loadRoles();
  attachEventListeners();
});

function populateExperienceDropdowns() {
  for (let i = 0; i <= 30; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i} ${i === 1 ? 'Year' : 'Years'}`;
    expYears.appendChild(opt);
  }

  for (let i = 0; i <= 11; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i} ${i === 1 ? 'Month' : 'Months'}`;
    expMonths.appendChild(opt);
  }
}

async function loadRoles() {
  try {
    const response = await fetch(ROLES_JSON_URL);
    if (!response.ok) throw new Error("Failed to load roles");
    const data = await response.json();
    rolesData = data.roles;
    console.log("✅ Roles loaded:", rolesData);
  } catch (err) {
    console.error("❌ Error loading roles:", err);
    showMessage("Failed to load role data. Please refresh the page.", "error");
  }
}

function attachEventListeners() {
  expYears.addEventListener("change", updateRoleOptions);
  expMonths.addEventListener("change", updateRoleOptions);
  postalCodeInput.addEventListener("blur", verifyPostalCode);
  linkedinInput.addEventListener("blur", validateLinkedIn);
  form.addEventListener("submit", handleSubmit);
}

function updateRoleOptions() {
  const years = parseInt(expYears.value) || 0;
  const months = parseInt(expMonths.value) || 0;
  const totalMonths = (years * 12) + months;

  roleSelect.innerHTML = '<option value="">-- Select a role --</option>';

  if (totalMonths === 0 && years === 0) {
    roleSelect.disabled = true;
    roleHelp.textContent = "Please select your experience first";
    roleHelp.className = "help-text";
    return;
  }

  const eligibleRoles = rolesData.filter(
    role => totalMonths >= role.minExperienceMonths && totalMonths <= role.maxExperienceMonths
  );

  if (eligibleRoles.length === 0) {
    roleSelect.disabled = true;
    roleHelp.textContent = "❌ No roles available for this experience range";
    roleHelp.className = "help-text error";
  } else {
    roleSelect.disabled = false;
    eligibleRoles.forEach(role => {
      const opt = document.createElement("option");
      opt.value = role.name;
      const minYears = Math.floor(role.minExperienceMonths / 12);
      const maxYears = Math.floor(role.maxExperienceMonths / 12);
      opt.textContent = `${role.name} (${minYears}-${maxYears} years)`;
      roleSelect.appendChild(opt);
    });
    roleHelp.textContent = `✅ ${eligibleRoles.length} role(s) available`;
    roleHelp.className = "help-text success";
  }
}

async function verifyPostalCode() {
  const pincode = postalCodeInput.value.trim();

  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    cityInput.value = "";
    postalHelp.textContent = "❌ Invalid postal code";
    postalHelp.className = "help-text error";
    return;
  }

  postalHelp.textContent = "Verifying postal code...";
  postalHelp.className = "help-text";

  try {
    const response = await fetch(`${POSTAL_API_URL}${pincode}`);
    const data = await response.json();

    if (data[0].Status === "Success" && data[0].PostOffice) {
      const postOffice = data[0].PostOffice[0];
      cityInput.value = postOffice.District;
      postalHelp.textContent = `✅ ${postOffice.District}, ${postOffice.State}`;
      postalHelp.className = "help-text success";
    } else {
      cityInput.value = "";
      postalHelp.textContent = "❌ Postal code not found";
      postalHelp.className = "help-text error";
    }
  } catch (err) {
    console.error("Postal verification error:", err);
    cityInput.value = "";
    postalHelp.textContent = "❌ Unable to verify postal code";
    postalHelp.className = "help-text error";
  }
}

function validateLinkedIn() {
  const url = linkedinInput.value.trim();

  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;

  if (linkedInPattern.test(url)) {
    linkedinHelp.textContent = "✅ Valid LinkedIn profile URL";
    linkedinHelp.className = "help-text success";
  } else {
    linkedinHelp.textContent = "❌ Must be a valid LinkedIn profile URL";
    linkedinHelp.className = "help-text error";
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  submitBtn.disabled = true;
  showMessage("Processing your referral...", "info");

  const firstName = document.getElementById("firstName").value.trim();
  const middleName = document.getElementById("middleName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();

  const fullName = middleName
    ? `${firstName} ${middleName} ${lastName}`
    : `${firstName} ${lastName}`;

  const years = parseInt(expYears.value) || 0;
  const months = parseInt(expMonths.value) || 0;
  const experienceDisplay = `${years} years ${months} months`;

  const phone = `+91${document.getElementById("phoneInput").value.trim()}`;

  const resumeFile = resumeFileInput.files[0];
  const base64 = await fileToBase64(resumeFile);

  document.getElementById("fullName").value = fullName;
  document.getElementById("experienceDisplay").value = experienceDisplay;
  document.getElementById("phoneHidden").value = phone;
  document.getElementById("resumeBase64").value = base64;
  document.getElementById("resumeName").value = resumeFile.name;
  document.getElementById("resumeType").value = resumeFile.type;

  const hasOffer = document.querySelector('input[name="hasOffer"]:checked');
  if (!hasOffer) {
    const noOfferInput = document.createElement("input");
    noOfferInput.type = "hidden";
    noOfferInput.name = "hasOffer";
    noOfferInput.value = "Not specified";
    form.appendChild(noOfferInput);
  }

  showMessage("Submitting referral...", "info");

  // ✅ FIX: Native submit (no fetch, no CORS)
  form.submit();

  successModal.style.display = "block";
  form.reset();
  roleSelect.innerHTML = '<option value="">Select experience first</option>';
  roleSelect.disabled = true;
  messageDiv.style.display = "none";
  submitBtn.disabled = false;
}

function validateForm() {
  if (!cityInput.value.trim()) {
    showMessage("Please enter a valid postal code", "error");
    return false;
  }
  if (!roleSelect.value) {
    showMessage("Please select a job role", "error");
    return false;
  }
  return true;
}

function showMessage(msg, type) {
  messageDiv.textContent = msg;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";
}

function fileToBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
}

function closeModal() {
  successModal.style.display = "none";
}
