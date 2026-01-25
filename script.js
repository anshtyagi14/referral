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
  // Check if form is open
  const isFormOpen = await checkFormStatus();
  
  if (!isFormOpen) {
    return; // Form is closed, stop initialization
  }
  
  // Form is open, continue normal initialization
  populateExperienceDropdowns();
  await loadRoles();
  attachEventListeners();
});

async function checkFormStatus() {
  try {
    const scriptUrl = form.action;
    const statusUrl = `${scriptUrl}?action=checkStatus`;
    
    const response = await fetch(statusUrl);
    const status = await response.json();
    
    if (!status.isOpen) {
      showFormClosed(status.closedTitle, status.closedMessage);
      return false;
    }
    
    // Form is open, show it with fade-in
    form.classList.add('form-ready');
    return true;
    
  } catch (err) {
    console.error("Error checking form status:", err);
    // Show form on error
    form.classList.add('form-ready');
    return true;
  }
}

function showFormClosed(title, message) {
  // Hide the entire form
  form.style.display = 'none';
  
  // Create closed message card
  const closedDiv = document.createElement('div');
  closedDiv.className = 'md-form-closed';
  closedDiv.innerHTML = `
    <div class="md-form-closed-content">
      <span class="material-symbols-outlined">lock</span>
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `;
  
  // Insert before the form
  form.parentElement.insertBefore(closedDiv, form);
}

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
  
  // Convert total experience to decimal years for comparison
  const totalYears = years + (months / 12);

  roleSelect.innerHTML = '<option value="">-- Select a role --</option>';

  if (totalYears === 0) {
    roleSelect.disabled = true;
    roleHelp.textContent = "Please select your experience first";
    roleHelp.className = "md-supporting-text";
    return;
  }

  const eligibleRoles = rolesData.filter(role => {
    const minYears = role.minExperienceYears;
    const maxYears = role.maxExperienceYears;
    
    // If maxYears is 0, it means "X+ years" (no upper limit)
    if (maxYears === 0) {
      return totalYears >= minYears;
    }
    
    // Otherwise, check if experience is within range
    return totalYears >= minYears && totalYears <= maxYears;
  });

  if (eligibleRoles.length === 0) {
    roleSelect.disabled = true;
    roleHelp.textContent = "❌ No roles available for this experience range";
    roleHelp.className = "md-supporting-text error";
  } else {
    roleSelect.disabled = false;
    eligibleRoles.forEach(role => {
      const opt = document.createElement("option");
      opt.value = role.name;
      
      // Format the display text based on whether there's an upper limit
      if (role.maxExperienceYears === 0) {
        opt.textContent = `${role.name} (${role.minExperienceYears}+ years)`;
      } else {
        opt.textContent = `${role.name} (${role.minExperienceYears}-${role.maxExperienceYears} years)`;
      }
      
      roleSelect.appendChild(opt);
    });
    roleHelp.textContent = `✅ ${eligibleRoles.length} role(s) available`;
    roleHelp.className = "md-supporting-text success";
  }
}

async function verifyPostalCode() {
  const pincode = postalCodeInput.value.trim();

  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    cityInput.value = "";
    postalHelp.textContent = "❌ Invalid postal code";
    postalHelp.className = "md-supporting-text error";
    return;
  }

  postalHelp.textContent = "Verifying postal code...";
  postalHelp.className = "md-supporting-text";

  try {
    const response = await fetch(`${POSTAL_API_URL}${pincode}`);
    const data = await response.json();

    if (data[0].Status === "Success" && data[0].PostOffice) {
      const postOffice = data[0].PostOffice[0];
      cityInput.value = postOffice.District;
      postalHelp.textContent = `✅ ${postOffice.District}, ${postOffice.State}`;
      postalHelp.className = "md-supporting-text success";
    } else {
      cityInput.value = "";
      postalHelp.textContent = "❌ Postal code not found";
      postalHelp.className = "md-supporting-text error";
    }
  } catch (err) {
    console.error("Postal verification error:", err);
    cityInput.value = "";
    postalHelp.textContent = "❌ Unable to verify postal code";
    postalHelp.className = "md-supporting-text error";
  }
}

function validateLinkedIn() {
  const url = linkedinInput.value.trim();

  if (!url) {
    linkedinHelp.textContent = "LinkedIn URL is required";
    linkedinHelp.className = "md-supporting-text";
    return;
  }

  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;

  if (linkedInPattern.test(url)) {
    linkedinHelp.textContent = "✅ Valid LinkedIn profile URL";
    linkedinHelp.className = "md-supporting-text success";
  } else {
    linkedinHelp.textContent = "❌ Must be a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)";
    linkedinHelp.className = "md-supporting-text error";
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  submitBtn.disabled = true;
  showMessage("Processing your referral...", "info");

  try {
    const firstName = document.getElementById("firstName").value.trim();
    const middleName = document.getElementById("middleName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const fullName = middleName 
      ? `${firstName} ${middleName} ${lastName}`
      : `${firstName} ${lastName}`;

    const years = parseInt(expYears.value) || 0;
    const months = parseInt(expMonths.value) || 0;
    const experienceDisplay = `${years} years ${months} months`;

    const phoneInput = document.getElementById("phoneInput").value.trim();
    const phone = `+91${phoneInput}`;

    const resumeFile = resumeFileInput.files[0];
    if (!resumeFile) {
      showMessage("Please upload your resume", "error");
      submitBtn.disabled = false;
      return;
    }

    if (resumeFile.type !== "application/pdf") {
      showMessage("Only PDF files are allowed", "error");
      submitBtn.disabled = false;
      return;
    }

    if (resumeFile.size > 10 * 1024 * 1024) {
      showMessage("Resume file size must be under 10MB", "error");
      submitBtn.disabled = false;
      return;
    }

    showMessage("Encoding resume...", "info");
    const base64 = await fileToBase64(resumeFile);

    const hasOffer = document.querySelector('input[name="hasOffer"]:checked');
    const offerValue = hasOffer ? hasOffer.value : 'Not specified';

    const employmentStatus = document.querySelector('input[name="employmentStatus"]:checked').value;
    const email = document.getElementById("email").value.trim();
    const city = cityInput.value.trim();
    const postalCode = postalCodeInput.value.trim();
    const role = roleSelect.value;
    const linkedinUrl = linkedinInput.value.trim();
    const comments = document.getElementById("comments").value.trim() || "N/A";

    // Prepare data as URL-encoded string
    const formData = new URLSearchParams({
      fullName: fullName,
      email: email,
      phone: phone,
      city: city,
      postalCode: postalCode,
      experienceDisplay: experienceDisplay,
      role: role,
      linkedinUrl: linkedinUrl,
      employmentStatus: employmentStatus,
      hasOffer: offerValue,
      comments: comments,
      resumeBase64: base64,
      resumeName: resumeFile.name,
      resumeType: resumeFile.type
    });

    showMessage("Submitting referral...", "info");

    // Use fetch with text/plain to bypass CORS preflight
    const response = await fetch(form.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: formData.toString()
    });

    const result = await response.json();

    if (result.success) {
      successModal.style.display = 'block';
      form.reset();
      cityInput.value = "";
      roleSelect.innerHTML = '<option value="">Select experience first</option>';
      roleSelect.disabled = true;
      roleHelp.textContent = "";
      linkedinHelp.textContent = "Must be a valid LinkedIn profile URL";
      linkedinHelp.className = "md-supporting-text";
      postalHelp.textContent = "Enter 6-digit PIN code";
      postalHelp.className = "md-supporting-text";
      messageDiv.style.display = 'none';
    } else {
      showMessage("Submission failed: " + result.message, "error");
    }

  } catch (err) {
    console.error("Submission error:", err);
    showMessage("An error occurred. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

function validateForm() {
  const phoneInput = document.getElementById("phoneInput").value.trim();
  if (!/^[6-9][0-9]{9}$/.test(phoneInput)) {
    showMessage("Please enter a valid 10-digit mobile number", "error");
    return false;
  }

  if (!cityInput.value.trim()) {
    showMessage("Please enter a valid postal code to auto-fill city", "error");
    return false;
  }

  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;
  if (!linkedInPattern.test(linkedinInput.value.trim())) {
    showMessage("Please enter a valid LinkedIn profile URL", "error");
    return false;
  }

  const employmentStatus = document.querySelector('input[name="employmentStatus"]:checked');
  if (!employmentStatus) {
    showMessage("Please select your current employment status", "error");
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
  messageDiv.className = `md-message ${type}`;
  messageDiv.style.display = "block";
  messageDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function closeModal() {
  successModal.style.display = 'none';
}

window.onclick = function(event) {
  if (event.target == successModal) {
    closeModal();
  }
}
