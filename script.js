document.addEventListener("DOMContentLoaded", () => {
    const auditorium = document.getElementById("auditorium");
    const zoneSummary = document.getElementById("zoneSummary");
    const overallSummary = document.getElementById("overallSummary");
    const resetButton = document.getElementById("resetButton");
    const overallSummaryButton = document.getElementById("overallSummaryButton");
    const zoneButtons = document.querySelectorAll(".zone-button");
    const passwordInput = document.getElementById("passwordInput");
    const submitPasswordButton = document.getElementById("submitPasswordButton");
    const buttonContainer = document.getElementById("buttonContainer");
    const errorMessage = document.getElementById("errorMessage");
    const toggleSpecialButton = document.getElementById("toggleSpecialButton");
    const removeSeatsButton = document.getElementById("removeSeatsButton");
    const restoreSeatsButton = document.getElementById("restoreSeatsButton");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const passwordSection = document.getElementById("passwordSection");

    let seats = [];
    let currentZone = null;
    let isSpecialMode = false;
    let isRemoveMode = false;

    const zoneConfigurations = {
        1: { rows: 10, cols: 10 },
        2: { rows: 9, cols: 10 },
        3: { rows: 8, cols: 10},
        4: { rows: 10, cols: 11},
        5: { rows: 12, cols: 10 },
    };

    const savedSeats = JSON.parse(localStorage.getItem('seats')) || {};

    zoneButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentZone = button.dataset.zone;
            highlightSelectedZone(button);
            showSeats(currentZone);
        });
    });

    toggleSpecialButton.addEventListener("click", () => {
        isSpecialMode = !isSpecialMode;
        toggleSpecialButton.classList.toggle("active", isSpecialMode);
    });

    removeSeatsButton.addEventListener("click", () => {
        isRemoveMode = !isRemoveMode;
        removeSeatsButton.classList.toggle("active", isRemoveMode);
    });

    resetButton.addEventListener("click", resetSeats); // Vincular el botón de reset a la función resetSeats
    overallSummaryButton.addEventListener("click", showOverallSummary); // Vincular el botón de resumen general a la función showOverallSummary

    restoreSeatsButton.addEventListener("click", restoreSeats);

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });

    function showSeats(zone) {
        auditorium.innerHTML = '';
        seats = [];
        auditorium.style.display = 'grid';

        const config = zoneConfigurations[zone];
        const zoneSeats = savedSeats[zone] || Array(config.rows * config.cols - countTotalBlankSpaces(config.blankSpaces)).fill("false");

        auditorium.style.gridTemplateColumns = `repeat(${config.cols}, minmax(var(--seat-size), 1fr))`;

        let seatIndex = 0;
        for (let i = 0; i < config.rows; i++) {
            for (let j = 0; j < config.cols; j++) {
                const isBlank = config.blankSpaces?.some(space => space.row === i && space.col === j);
                if (isBlank) {
                    const blankDiv = document.createElement("div");
                    blankDiv.classList.add("blank-space");
                    auditorium.appendChild(blankDiv);
                } else {
                    const seat = createSeat(zoneSeats[seatIndex]);
                    seats.push(seat);
                    auditorium.appendChild(seat);
                    seatIndex++;
                }
            }
        }
        updateSummary();
    }

    function createSeat(status) {
        const seat = document.createElement("div");
        seat.classList.add("seat");
        seat.dataset.occupied = status;
        if (status === "true") {
            seat.classList.add("occupied");
        } else if (status === "special") {
            seat.classList.add("needs-special");
        } else if (status === "inactive") {
            seat.classList.add("inactive");
        }

        seat.addEventListener("click", () => toggleSeat(seat));

        return seat;
    }

    function toggleSeat(seat) {
        if (isRemoveMode) {
            seat.dataset.occupied = "inactive";
            seat.classList.add("inactive");
        } else if (isSpecialMode) {
            if (seat.dataset.occupied === "special") {
                seat.dataset.occupied = "false";
                seat.classList.remove("needs-special");
            } else {
                seat.dataset.occupied = "special";
                seat.classList.add("needs-special");
            }
        } else {
            if (seat.dataset.occupied === "special") {
                seat.dataset.occupied = "true";
                seat.classList.remove("needs-special");
                seat.classList.add("occupied");
            } else {
                seat.dataset.occupied = seat.dataset.occupied === "false" ? "true" : "false";
                seat.classList.toggle("occupied");
            }
        }
        updateSummary();
        saveSeats();
    }

    function saveSeats() {
        const seatStatus = seats.map(seat => seat.dataset.occupied);
        savedSeats[currentZone] = seatStatus;
        localStorage.setItem('seats', JSON.stringify(savedSeats));
    }

    function updateSummary() {
        const occupiedSeats = seats.filter(seat => seat.dataset.occupied === "true" || seat.dataset.occupied === "special").length;
        const totalSeats = seats.filter(seat => seat.dataset.occupied !== "inactive").length;
        zoneSummary.textContent = `Zona ${currentZone} - Total de asientos: ${totalSeats}, Ocupados: ${occupiedSeats}, Libres: ${totalSeats - occupiedSeats}`;
    }

    function resetSeats() {
        seats.forEach(seat => {
            if (seat.dataset.occupied !== "inactive") {
                seat.dataset.occupied = "false";
                seat.classList.remove("occupied", "needs-special");
            }
        });
        updateSummary();
        saveSeats();
    }

    function restoreSeats() {
        seats.forEach(seat => {
            if (seat.dataset.occupied === "inactive") {
                seat.dataset.occupied = "false";
                seat.classList.remove("inactive");
            }
        });
        updateSummary();
        saveSeats();
    }

    function highlightSelectedZone(selectedButton) {
        zoneButtons.forEach(button => button.classList.remove("selected-zone"));
        selectedButton.classList.add("selected-zone");
    }

    function showOverallSummary() {
        let totalOccupied = 0;
        let totalSeats = 0;

        for (let zone in zoneConfigurations) {
            const config = zoneConfigurations[zone];
            const zoneSeatStatus = savedSeats[zone] || Array(config.rows * config.cols - countTotalBlankSpaces(config.blankSpaces)).fill("false");
            const zoneTotalSeats = zoneSeatStatus.filter(status => status !== "inactive").length;
            const zoneOccupiedSeats = zoneSeatStatus.filter(status => status === "true" || status === "special").length;

            totalSeats += zoneTotalSeats;
            totalOccupied += zoneOccupiedSeats;
        }

        overallSummary.textContent = `Asistencia General - Total de asientos: ${totalSeats}, Ocupados: ${totalOccupied}, Libres: ${totalSeats - totalOccupied}`;
    }

    function countTotalBlankSpaces(blankSpaces) {
        return blankSpaces ? blankSpaces.length : 0;
    }

    function checkPassword() {
        const password = passwordInput.value;
        const correctPassword = "1234"; // Cambia esto a la contraseña correcta

        if (password === correctPassword) {
            buttonContainer.style.display = 'flex';
            resetButton.disabled = false;
            overallSummaryButton.disabled = false;
            removeSeatsButton.disabled = false;
            restoreSeatsButton.disabled = false;
            errorMessage.style.display = 'none';
            passwordSection.style.display = 'none'; // Nuevo: Oculta la sección de la contraseña
        } else {
            errorMessage.style.display = 'block';
        }
    }

    submitPasswordButton.addEventListener("click", checkPassword);
});
