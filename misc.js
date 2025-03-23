class Modal {
  constructor() {
    this.modalContainer = null;
  }

  initialize() {
    if (!this.modalContainer) {
      this.modalContainer = document.getElementById("modalContainer");
      if (!this.modalContainer) {
        this.modalContainer = document.createElement("div");
        this.modalContainer.id = "modalContainer";
        document.body.appendChild(this.modalContainer);
      }
    }
  }

  createModal(options) {
    this.initialize();

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";

    const modalContent = document.createElement("div");
    modalContent.className = "modal";

    modalContent.innerHTML = `
        <h2 class="modal-title">${options.title}</h2>
        <div class="modal-content">${options.message}</div>
        <div class="modal-buttons">
          ${
            options.showCancel
              ? `<button class="modal-button secondary-button" id="cancelButton">
              ${options.cancelText || "Cancel"}
            </button>`
              : ""
          }
          <button class="modal-button primary-button" id="confirmButton">
            ${options.confirmText || "OK"}
          </button>
        </div>
      `;

    modalOverlay.appendChild(modalContent);
    this.modalContainer.appendChild(modalOverlay);
    modalOverlay.style.display = "block";

    return new Promise((resolve) => {
      const confirmButton = modalContent.querySelector("#confirmButton");
      const cancelButton = modalContent.querySelector("#cancelButton");

      confirmButton.addEventListener("click", () => {
        this.modalContainer.removeChild(modalOverlay);
        resolve(true);
      });

      if (cancelButton) {
        cancelButton.addEventListener("click", () => {
          this.modalContainer.removeChild(modalOverlay);
          resolve(false);
        });
      }
    });
  }

  alert(title, message) {
    return this.createModal({
      title,
      message,
      confirmText: "OK",
    });
  }

  confirm(title, message) {
    return this.createModal({
      title,
      message,
      confirmText: "Yes",
      cancelText: "No",
      showCancel: true,
    });
  }
}

// Initialize the modal system
const modalSystem = new Modal();

// Use DOMContentLoaded or ensure the code runs on client-side only
if (typeof window !== "undefined") {
  // This ensures the code only runs in browser, not during SSR
  document.addEventListener("DOMContentLoaded", async () => {
    // Wait a moment for React to fully hydrate
    setTimeout(async () => {
      await modalSystem.alert(
        "Welcome to Star Walker!",
        "Use the arrow keys or the w, a, s and d keys on your keyboard to move the character around."
      );

      await modalSystem.alert(
        "Sound Controls",
        "You can toggle the sound by clicking the button on the top right."
      );

      // Handle sound preference modal
      setTimeout(async () => {
        const playMusic = await modalSystem.confirm(
          "Sound Settings",
          "Do you want to turn on the sound?"
        );

        if (playMusic) {
          music.play();
          soundIcon.src = "./soundoff.png";
        } else {
          music.pause();
          soundIcon.src = "./soundon.png";
        }
      }, 1000);
    }, 500);
  });
}
