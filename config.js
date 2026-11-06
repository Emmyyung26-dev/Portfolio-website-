/* ==========================================================================
   config.js  -  EDIT THIS FILE FIRST
   --------------------------------------------------------------------------
   Everything personal lives here: contact details, social links, form setup.
   Leave a value as "" and the matching button shows a friendly reminder
   instead of a broken link.
   ========================================================================== */
window.SITE_CONFIG = {

  /* WhatsApp number in INTERNATIONAL format, digits only.
     No "+", no spaces, no dashes. Example: "2348012345678" */
  whatsappNumber: "",

  /* The message that appears pre-typed when a visitor taps the WhatsApp button */
  whatsappMessage: "Hello NuelWebSolution, I'd like to discuss a website project.",

  /* Your public business email, e.g. "hello@yourdomain.com" */
  email: "",

  /* Full URLs to your profiles. Leave "" to keep a button inactive. */
  socials: {
    github: "",     // e.g. "https://github.com/yourname"
    linkedin: "",   // e.g. "https://www.linkedin.com/in/yourname"
    instagram: "",  // e.g. "https://www.instagram.com/yourname"
    x: ""           // e.g. "https://x.com/yourname"
  },

  /* CONTACT FORM
     Option A (easiest): leave formEndpoint empty. The form opens the visitor's
     email app with the message pre-filled, sent to the email above.
     Option B (recommended): create a free form at formspree.io (or similar),
     paste its URL here, e.g. "https://formspree.io/f/abcdwxyz".
     The form then sends messages straight to your inbox without leaving the site. */
  formEndpoint: "",

  /* ABOUT SECTION STATS
     Only add numbers that are TRUE. Leave the list empty to hide the stats row.
     Example: { value: 12, suffix: "+", label: "Websites delivered" } */
  stats: []
};
