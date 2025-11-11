document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to get initials from an email/name
  function getInitials(text) {
    if (!text) return "?";
    const name = text.split("@")[0].replace(/[._\-]/g, " ");
    const parts = name.split(" ").filter(Boolean);
    const initials = parts.length === 1 ? parts[0].slice(0, 2) : (parts[0][0] + parts[parts.length - 1][0]);
    return initials.toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants markup
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `<ul class="participant-list">` +
            details.participants.map(p => {
              const initials = getInitials(p);
              // include a delete button to unregister this participant
              return `<li>
                        <span class="avatar">${initials}</span>
                        <span class="participant-name">${p}</span>
                        <button class="delete-participant" data-activity="${name}" data-email="${p}" title="Unregister">✖</button>
                      </li>`;
            }).join("") +
            `</ul>`;
        } else {
          participantsHTML = `<p class="no-participants">No participants yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <section class="participants">
            <h5>Participants (${details.participants.length})</h5>
            ${participantsHTML}
          </section>
        `;

        activitiesList.appendChild(activityCard);

        // Attach click handlers for delete buttons inside this activity card
        activityCard.querySelectorAll(".delete-participant").forEach(btn => {
          btn.addEventListener("click", async (event) => {
            event.preventDefault();
            const email = btn.dataset.email;
            const activityName = btn.dataset.activity;

            // Confirmation dialog before unregistering
            const ok = window.confirm(`Unregister ${email} from ${activityName}?`);
            if (!ok) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              const result = await res.json();

              if (res.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");

                // Refresh the activities list to reflect the change
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "An error occurred";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }

              // Hide message after 5 seconds
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            } catch (error) {
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering:", error);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so newly signed-up participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
