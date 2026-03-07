/* ============================================================
   script.js — SECURED Frontend JavaScript
   ✅ F-05: textContent used (never innerHTML) — XSS safe
   ✅ F-06: Hardcoded localhost URL fixed — works in production
   ✅ F-08: maxlength enforced client-side too
   ✅ F-09: Input sanitization before sending to API
   ============================================================ */

/* ── ✅ FIX F-06: Smart API URL — works in both dev and production ────────────
   In development (localhost) → points to local backend
   In production (your domain) → uses same domain, no hardcoded URL needed */
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'   // Local dev — talk to local backend
  : '';                        // Production — use relative URL (same server)


/* ── 1. Animate skill bars on scroll ─────────────────────────────────────── */
const barFills = document.querySelectorAll('.bar-fill');

const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target;
      const targetWidth = fill.getAttribute('data-width');
      // Validate data-width is a safe number before applying
      const width = Math.min(100, Math.max(0, parseInt(targetWidth) || 0));
      fill.style.width = width + '%';
      barObserver.unobserve(fill);
    }
  });
}, { threshold: 0.3 });

barFills.forEach(bar => barObserver.observe(bar));


/* ── 2. Active nav link on scroll ────────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav ul a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.style.color = '');
      const activeLink = document.querySelector(`nav ul a[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.style.color = 'var(--accent)';
    }
  });
}, { threshold: 0.5 });

sections.forEach(section => navObserver.observe(section));


/* ── 3. Contact Form Submission ──────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
const formStatus  = document.getElementById('formStatus');

// ✅ FIX F-08: Client-side length limits matching backend + HTML maxlength
const LIMITS = { name: 100, email: 254, message: 2000 };

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect and trim all field values
  const formData = {
    name:    document.getElementById('name').value.trim(),
    email:   document.getElementById('email').value.trim(),
    message: document.getElementById('message').value.trim(),
  };

  // ── Client-side validation (backend will also validate) ───────────────────
  if (!formData.name || !formData.email || !formData.message) {
    showStatus('Please fill in all fields.', 'error');
    return;
  }

  if (formData.name.length > LIMITS.name) {
    showStatus(`Name must be under ${LIMITS.name} characters.`, 'error');
    return;
  }

  if (formData.email.length > LIMITS.email) {
    showStatus('Email address is too long.', 'error');
    return;
  }

  // Basic email format check on client side too
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    showStatus('Please enter a valid email address.', 'error');
    return;
  }

  if (formData.message.length > LIMITS.message) {
    showStatus(`Message must be under ${LIMITS.message} characters.`, 'error');
    return;
  }

  // ── Disable button during request ─────────────────────────────────────────
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = './sending...';

  try {
    // ✅ FIX F-06: Use API_BASE (dynamic) instead of hardcoded localhost
    const response = await fetch(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      // ✅ FIX F-05: Always use textContent — NEVER innerHTML for user-facing messages
      // textContent escapes all HTML, making XSS impossible here
      showStatus('Message sent successfully! I will get back to you soon.', 'success');
      contactForm.reset();
      updateCharCount('message', 0); // Reset char counter
    } else {
      // Show server error message safely via textContent
      showStatus(result.message || 'Something went wrong. Please try again.', 'error');
    }

  } catch (error) {
    console.error('Network error:', error);
    showStatus('Could not connect to server. Please try again later.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = './send_message';
  }
});


/* ── Helper: Show status message safely ──────────────────────────────────────
   ✅ FIX F-05: Uses textContent — NEVER innerHTML
   This is the key XSS prevention — textContent treats everything as plain
   text and never executes HTML or scripts, even if attacker input slips through */
function showStatus(message, type) {
  // ✅ SAFE: textContent never interprets HTML — "<script>" becomes literal text
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`;

  // Auto-clear after 6 seconds
  setTimeout(() => {
    formStatus.textContent = '';
    formStatus.className = 'form-status';
  }, 6000);
}


/* ── 4. Live character counter for message textarea ─────────────────────────
   Helps users stay within the 2000 char limit before hitting submit */
const messageTextarea = document.getElementById('message');

if (messageTextarea) {
  // Create the counter element
  const counter = document.createElement('small');
  counter.id = 'charCounter';
  counter.style.cssText = 'font-family: var(--mono); font-size: 0.72rem; color: var(--muted); display: block; text-align: right; margin-top: 0.3rem;';
  counter.textContent = '0 / 2000';

  // Insert it after the textarea
  messageTextarea.parentNode.appendChild(counter);

  messageTextarea.addEventListener('input', () => {
    updateCharCount('message', messageTextarea.value.length);
  });
}

function updateCharCount(fieldId, count) {
  const counter = document.getElementById('charCounter');
  if (!counter) return;
  counter.textContent = `${count} / ${LIMITS.message}`;
  // Turn red when approaching limit
  counter.style.color = count > 1800 ? 'var(--red)' : 'var(--muted)';
}


/* ── 5. Hero entrance animation ──────────────────────────────────────────── */
window.addEventListener('load', () => {
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  heroContent.style.opacity = '0';
  heroContent.style.transform = 'translateY(20px)';
  heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

  setTimeout(() => {
    heroContent.style.opacity = '1';
    heroContent.style.transform = 'translateY(0)';
  }, 100);
});


/* ── 6. Skill card stagger animation ─────────────────────────────────────── */
const skillCards = document.querySelectorAll('.skill-card');

skillCards.forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = `opacity 0.5s ease ${index * 0.15}s, transform 0.5s ease ${index * 0.15}s`;

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        cardObserver.unobserve(card);
      }
    });
  }, { threshold: 0.2 });

  cardObserver.observe(card);
});
